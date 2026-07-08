import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey } from "./supabase-config";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = getSupabaseServiceRoleKey();

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY for admin operations.",
      );
    }

    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  return adminClient;
}
