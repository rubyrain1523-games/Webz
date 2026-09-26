/* ===== SUPABASE CLIENT =====
   These two values are safe to expose in frontend code.
   The URL is just an address, and the "publishable" (anon) key
   only lets the app do what our Row Level Security policies allow --
   it can never bypass them. The secret to actually protect is the
   service_role key, which never appears anywhere in this project.
*/

const SUPABASE_URL = "https://eywodwhgfpvoufkvyyyq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_a1TmbjJ2BUgIC6DuKf-khg_S8E38ib0";

window.WebzSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
