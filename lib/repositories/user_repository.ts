"use server";

import type { User } from "../models/User";
import { assertNoError, firstOrNull } from "../database/helpers";
import { userFromRow, userToRow, type UserRow } from "../database/mappers";
import { getSupabaseAdmin } from "../supabase-admin";
import { getSupabaseAuthClient, supabase } from "../supabase";
import { simulateLatency } from "./delay";

const USER_COLUMNS = "id, name, email, role, created_at, username, phone";

/** Required to create a user who can log in. */
export type CreateUserInput = Omit<User, "id"> & {
  username: string;
  password: string;
};

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function resolveEmailForLegacyLogin(
  username: string,
  profiles: UserRow[],
): UserRow | null {
  const normalized = normalizeUsername(username);
  if (!normalized) return null;

  const byUsername = profiles.find(
    (profile) => profile.username?.toLowerCase() === normalized,
  );
  if (byUsername) return byUsername;

  if (normalized.includes("@")) {
    return (
      profiles.find(
        (profile) => profile.email.toLowerCase() === normalized,
      ) ?? null
    );
  }

  const byLocalPart = profiles.find(
    (profile) =>
      profile.email.toLowerCase().split("@")[0] === normalized,
  );
  if (byLocalPart) return byLocalPart;

  return (
    profiles.find(
      (profile) =>
        profile.email.toLowerCase() === `${normalized}@badartyres.local`,
    ) ?? null
  );
}

async function findProfileByUsername(username: string): Promise<UserRow | null> {
  const normalized = normalizeUsername(username);
  const result = await supabase
    .from("users")
    .select(USER_COLUMNS)
    .eq("username", normalized)
    .limit(1);
  const row = firstOrNull(assertNoError(result, "findProfileByUsername") as UserRow[]);
  if (row) return row;

  const profilesResult = await supabase.from("users").select(USER_COLUMNS);
  const profiles = assertNoError(profilesResult, "findProfileByUsername") as UserRow[];
  return resolveEmailForLegacyLogin(username, profiles);
}

/**
 * Returns all users.
 */
export async function getUsers(): Promise<User[]> {
  await simulateLatency();
  const result = await supabase.from("users").select(USER_COLUMNS).order("name");
  const rows = assertNoError(result, "getUsers") as UserRow[];
  return (rows ?? []).map(userFromRow);
}

/**
 * Returns a single user by id, or null if no match is found.
 */
export async function getUserById(id: string): Promise<User | null> {
  await simulateLatency();
  const result = await supabase
    .from("users")
    .select(USER_COLUMNS)
    .eq("id", id)
    .limit(1);
  const row = firstOrNull(assertNoError(result, "getUserById") as UserRow[]);
  return row ? userFromRow(row) : null;
}

/**
 * Returns only users with the technician role — used to populate the
 * "assigned technician" selector on job cards.
 */
export async function getTechnicians(): Promise<User[]> {
  await simulateLatency();
  const result = await supabase
    .from("users")
    .select(USER_COLUMNS)
    .eq("role", "Technician")
    .order("name");
  const rows = assertNoError(result, "getTechnicians") as UserRow[];
  return (rows ?? []).map(userFromRow);
}

export async function createUser(data: CreateUserInput): Promise<User> {
  await simulateLatency();

  const username = normalizeUsername(data.username);
  if (!username) {
    throw new Error("Username is required.");
  }
  if (!data.password?.trim()) {
    throw new Error("Password is required.");
  }

  const email =
    data.email?.trim() ||
    `${username}@badartyres.local`;

  const existingUsername = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .limit(1);
  if (firstOrNull(assertNoError(existingUsername, "createUser") as { id: string }[])) {
    throw new Error("That username is already taken.");
  }

  const { data: authData, error: authError } =
    await getSupabaseAuthClient().auth.signUp({
      email,
      password: data.password,
      options: {
        data: {
          username,
          name: data.name,
          role: data.role,
          phone: data.phone ?? "",
        },
      },
    });

  if (authError || !authData.user) {
    throw new Error(authError?.message ?? "Failed to create login account.");
  }

  const newUser: User = {
    id: authData.user.id,
    name: data.name,
    username,
    role: data.role,
    email,
    phone: data.phone ?? "",
  };

  const result = await supabase
    .from("users")
    .upsert(userToRow(newUser), { onConflict: "id" })
    .select(USER_COLUMNS)
    .single();

  if (result.error) {
    await getSupabaseAdmin().auth.admin.deleteUser(authData.user.id);
    throw new Error(result.error.message);
  }

  return userFromRow(assertNoError(result, "createUser") as UserRow);
}

export async function updateUser(
  id: string,
  data: Partial<Omit<User, "id">>,
  actingUserId: string,
): Promise<User | null> {
  await simulateLatency();
  const existingResult = await supabase
    .from("users")
    .select(USER_COLUMNS)
    .eq("id", id)
    .limit(1)
    .single();
  const existingRow = assertNoError(existingResult, "updateUser") as UserRow;
  if (!existingRow) return null;

  const existing = userFromRow(existingRow);

  if (
    data.role &&
    existing.id === actingUserId &&
    existing.role === "Admin" &&
    data.role !== "Admin"
  ) {
    throw new Error("Admins cannot demote their own role.");
  }

  if (data.username) {
    const username = normalizeUsername(data.username);
    const clash = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .neq("id", id)
      .limit(1);
    if (firstOrNull(assertNoError(clash, "updateUser") as { id: string }[])) {
      throw new Error("That username is already taken.");
    }
    data.username = username;
  }

  const updated: User = { ...existing, ...data };
  const result = await supabase
    .from("users")
    .update(userToRow(updated, existingRow.created_at))
    .eq("id", id)
    .select(USER_COLUMNS)
    .single();
  return userFromRow(assertNoError(result, "updateUser") as UserRow);
}

export async function updateUserRole(
  id: string,
  newRole: User["role"],
  actingUserId: string,
): Promise<User | null> {
  return updateUser(id, { role: newRole }, actingUserId);
}

export async function deleteUser(id: string, actingUserId: string): Promise<void> {
  await simulateLatency();
  if (id === actingUserId) {
    throw new Error("Admins cannot delete their own account.");
  }

  const existing = await getUserById(id);
  if (!existing) return;

  const { error: authDeleteError } =
    await getSupabaseAdmin().auth.admin.deleteUser(id);
  if (authDeleteError && !authDeleteError.message.includes("not found")) {
    const { data: authUsers } = await getSupabaseAdmin().auth.admin.listUsers({
      perPage: 1000,
    });
    const authUser = authUsers.users.find(
      (user: any) => user.email?.toLowerCase() === existing.email.toLowerCase(),
    );
    if (authUser) {
      await getSupabaseAdmin().auth.admin.deleteUser(authUser.id);
    }
  }

  const result = await supabase.from("users").delete().eq("id", id);
  assertNoError(result, "deleteUser");
}

export async function verifyLogin(
  username: string,
  password: string,
): Promise<{ token: string; user: User }> {
  await simulateLatency();

  let emailToUse = username.trim().toLowerCase();

  // If it's not an email, assume it's a username and fetch the mapped email from public.users
  if (!emailToUse.includes("@")) {
    const profile = await findProfileByUsername(username);
    if (!profile) {
      throw new Error("Invalid username or password");
    }
    emailToUse = profile.email;
  }

  const authResult = await getSupabaseAuthClient().auth.signInWithPassword({
    email: emailToUse,
    password,
  });

  if (authResult.error || !authResult.data.session || !authResult.data.user) {
    throw new Error("Invalid username or password");
  }

  // Strictly fetch the public profile using the Foreign Key (Auth UUID)
  const authUserId = authResult.data.user.id;
  const userResult = await supabase
    .from("users")
    .select(USER_COLUMNS)
    .eq("id", authUserId)
    .single();

  if (userResult.error || !userResult.data) {
    await getSupabaseAuthClient().auth.signOut();
    throw new Error("Your user profile was not found. Please contact an admin to link your account.");
  }

  return {
    token: authResult.data.session.access_token,
    user: userFromRow(userResult.data as UserRow),
  };
}
