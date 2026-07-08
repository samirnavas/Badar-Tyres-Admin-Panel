export function getSupabaseServerConfigError(): string | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    return "Server configuration error: NEXT_PUBLIC_SUPABASE_URL is not set.";
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    return "Server configuration error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.";
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return "Server configuration error: SUPABASE_SERVICE_ROLE_KEY is not set.";
  }
  return null;
}
