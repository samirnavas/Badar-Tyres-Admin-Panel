/**
 * Resolves the Supabase service role key from server or public env vars.
 * Prefer SUPABASE_SERVICE_ROLE_KEY when set; fall back to NEXT_PUBLIC_* for legacy deploys.
 */
export function getSupabaseServiceRoleKey(): string | undefined {
  const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serverKey) return serverKey;

  return process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY?.trim() || undefined;
}

export function getSupabaseServerConfigError(): string | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    return "Server configuration error: NEXT_PUBLIC_SUPABASE_URL is not set.";
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    return "Server configuration error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.";
  }
  if (!getSupabaseServiceRoleKey()) {
    return "Server configuration error: NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY is not set.";
  }
  return null;
}
