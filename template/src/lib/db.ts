import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _sb: SupabaseClient | null = null;

export function sb(): SupabaseClient {
  if (!_sb) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase env vars missing. Copy .env.example to .env.local and fill them in.");
    _sb = createClient(url, key, { auth: { persistSession: false } });
  }
  return _sb;
}
