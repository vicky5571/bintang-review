import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-supabase-anon-key')
);

// Standard public client (for public operations obeying RLS)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

export const isServiceRoleConfigured = Boolean(
  supabaseUrl &&
    supabaseServiceRoleKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseServiceRoleKey.includes('your-supabase-service-role-key')
);

// Privileged server client (uses service_role key to bypass RLS for authorized admin/owner tasks)
// Gracefully falls back to standard client if service_role is not yet provided
export const supabaseAdmin = isServiceRoleConfigured
  ? createClient(supabaseUrl!, supabaseServiceRoleKey!, {
      auth: { persistSession: false },
    })
  : supabase;
