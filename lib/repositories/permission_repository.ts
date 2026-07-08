"use server";

import { assertNoError } from "../database/helpers";
import {
  permissionsFromRows,
  permissionsToRows,
  type PermissionRow,
} from "../database/mappers";
import { supabase } from "../supabase";
import { getSupabaseServerConfigError } from "../supabase-config";
import { simulateLatency } from "./delay";

const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  Admin: ["*"],
  Manager: [
    "/dashboard",
    "/jobs",
    "/services",
    "/inventory",
    "/customers",
    "/bays",
    "/billing",
    "action:apply_discount",
  ],
  Supervisor: [
    "/dashboard",
    "/jobs",
    "/services",
    "/inventory",
    "/customers",
    "/bays",
  ],
  "Team Lead": ["/dashboard", "/jobs", "/inventory", "/bays"],
  Technician: ["/dashboard", "/jobs", "/bays"],
  Sales: ["/billing", "/dashboard", "/jobs", "/services"],
};

type PermissionsUpdateResult =
  | { ok: true; data: Record<string, string[]> }
  | { ok: false; error: string };

function normalizePermissions(
  rows: PermissionRow[],
): Record<string, string[]> {
  const permissions = permissionsFromRows(rows);

  for (const [role, routes] of Object.entries(permissions)) {
    if (!Array.isArray(routes)) {
      permissions[role] = [];
    }
  }

  return { ...permissions, Admin: ["*"] };
}

async function seedDefaultPermissions(): Promise<Record<string, string[]> | null> {
  const rows = permissionsToRows(DEFAULT_PERMISSIONS);
  const result = await supabase
    .from("permissions")
    .upsert(rows, { onConflict: "role" })
    .select("*");

  if (result.error || !result.data?.length) {
    console.error(
      "[getPermissions] Failed to seed default permissions:",
      result.error,
    );
    return null;
  }

  return normalizePermissions(result.data as PermissionRow[]);
}

export async function getPermissions(): Promise<Record<string, string[]>> {
  const configError = getSupabaseServerConfigError();
  if (configError) {
    console.error("[getPermissions]", configError);
    return DEFAULT_PERMISSIONS;
  }

  try {
    await simulateLatency();
    const result = await supabase.from("permissions").select("*");
    const rows = assertNoError(result, "getPermissions") as PermissionRow[];

    if (!rows?.length) {
      const seeded = await seedDefaultPermissions();
      return seeded ?? DEFAULT_PERMISSIONS;
    }

    return normalizePermissions(rows);
  } catch (error) {
    console.error("[getPermissions]", error);
    return DEFAULT_PERMISSIONS;
  }
}

export async function updatePermissions(
  data: Record<string, string[]>,
): Promise<PermissionsUpdateResult> {
  const configError = getSupabaseServerConfigError();
  if (configError) {
    console.error("[updatePermissions]", configError);
    return { ok: false, error: configError };
  }

  try {
    await simulateLatency();
    const merged = { ...data, Admin: ["*"] };
    const rows = permissionsToRows(merged);

    const upsertResult = await supabase
      .from("permissions")
      .upsert(rows, { onConflict: "role" });
    assertNoError(upsertResult, "updatePermissions");

    const existingResult = await supabase.from("permissions").select("role");
    const existingRows = assertNoError(
      existingResult,
      "updatePermissions",
    ) as PermissionRow[];
    const rolesToDelete = (existingRows ?? [])
      .map((row) => row.role)
      .filter((role) => !(role in merged));

    if (rolesToDelete.length > 0) {
      const deleteResult = await supabase
        .from("permissions")
        .delete()
        .in("role", rolesToDelete);
      assertNoError(deleteResult, "updatePermissions");
    }

    return { ok: true, data: merged };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save permissions.";
    console.error("[updatePermissions]", error);
    return { ok: false, error: message };
  }
}
