import { createClient } from '@supabase/supabase-js';

// Read Supabase credentials from Vite env variables
// Add these to your .env (local) and Cloudflare Pages Environment Variables:
// VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. The app will fall back to localStorage only.',
  );
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;


