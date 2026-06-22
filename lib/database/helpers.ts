import type { PostgrestError } from "@supabase/supabase-js";

export function assertNoError<T>(
  result: { data: T; error: PostgrestError | null },
  context?: string,
): T {
  if (result.error) {
    const prefix = context ? `${context}: ` : "";
    throw new Error(`${prefix}${result.error.message}`);
  }
  return result.data as T;
}

export function firstOrNull<T>(rows: T[] | null): T | null {
  if (!rows?.length) return null;
  return rows[0];
}
