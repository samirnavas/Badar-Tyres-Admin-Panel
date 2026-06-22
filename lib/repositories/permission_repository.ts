"use server";

import { assertNoError } from "../database/helpers";
import {
  permissionsFromRows,
  permissionsToRows,
  type PermissionRow,
} from "../database/mappers";
import { getSupabaseAdmin } from "../supabase-admin";
import { simulateLatency } from "./delay";

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

export async function getPermissions(): Promise<Record<string, string[]>> {
  await simulateLatency();
  const result = await getSupabaseAdmin().from("permissions").select("*");
  const rows = assertNoError(result, "getPermissions") as PermissionRow[];
  return normalizePermissions(rows ?? []);
}

export async function updatePermissions(
  data: Record<string, string[]>,
): Promise<Record<string, string[]>> {
  await simulateLatency();
  const merged = { ...data, Admin: ["*"] };
  const rows = permissionsToRows(merged);

  const upsertResult = await getSupabaseAdmin()
    .from("permissions")
    .upsert(rows, { onConflict: "role" });
  assertNoError(upsertResult, "updatePermissions");

  const existingResult = await getSupabaseAdmin().from("permissions").select("role");
  const existingRows = assertNoError(existingResult, "updatePermissions") as PermissionRow[];
  const rolesToDelete = (existingRows ?? [])
    .map((row) => row.role)
    .filter((role) => !(role in merged));

  if (rolesToDelete.length > 0) {
    const deleteResult = await getSupabaseAdmin()
      .from("permissions")
      .delete()
      .in("role", rolesToDelete);
    assertNoError(deleteResult, "updatePermissions");
  }

  return merged;
}
