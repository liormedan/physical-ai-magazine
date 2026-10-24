import { createClient } from '@supabase/supabase-js';

// Accounts need a Supabase project (see ACCOUNTS.md). Without the two public
// variables below the site still works and the account UI says so.
// The anon key is public by design; row level security in
// supabase/migrations protects the data.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const authConfigured = Boolean(url && key);

let client;
export function getSupabase() {
  if (!authConfigured) return null;
  client ??= createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  return client;
}
