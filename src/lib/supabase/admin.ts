import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin client using service_role key — bypasses RLS entirely.
 * ONLY use in server actions / server components behind admin checks.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY env var");
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
