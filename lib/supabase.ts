// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

// Service role client — server-only, full access, bypasses RLS.
// Only ever import this file into server components, server actions,
// or route handlers — NEVER into a "use client" component.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);