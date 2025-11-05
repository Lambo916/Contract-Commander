import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Helper to try multiple environment variable names (supports Vite, Next, Express)
function pickEnv(...keys: string[]): string | undefined {
  // Try import.meta.env first (Vite browser context)
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      for (const k of keys) {
        const v = (import.meta as any).env[k];
        if (v) return v as string;
      }
    }
  } catch {
    // import.meta not available, fall through to process.env
  }
  
  // Then try process.env (Node/server context)
  for (const k of keys) {
    const v = process.env[k];
    if (v) return v as string;
  }
  return undefined;
}

// Browser/client-side Supabase client (works across Vite, Next, Express)
// For future auth features and client-side database operations
export function supabaseBrowser(): SupabaseClient {
  const supabaseUrl = pickEnv(
    "VITE_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_URL"
  );
  const supabaseAnonKey = pickEnv(
    "VITE_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_ANON_KEY"
  );

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase environment variables not found. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL/SUPABASE_ANON_KEY)"
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

// Server-side Supabase client (Node/Express handlers)
// Uses service role key if available, falls back to anon key
export function supabaseServer(): SupabaseClient {
  const supabaseUrl = pickEnv(
    "SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "VITE_SUPABASE_URL"
  );
  const supabaseKey = pickEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "VITE_SUPABASE_ANON_KEY"
  );

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase environment variables not found. Set SUPABASE_URL and SUPABASE_ANON_KEY"
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
