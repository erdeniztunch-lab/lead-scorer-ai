import { createClient } from "@supabase/supabase-js";

export function createSupabaseClientForUser(params: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  accessToken: string;
}) {
  return createClient(params.supabaseUrl, params.supabaseAnonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
      },
    },
  });
}
