/**
 * Supabase Browser Client
 *
 * For use in Client Components (components with "use client" directive).
 * This client handles cookies in the browser environment using the cookie-based
 * authentication flow with @supabase/ssr.
 *
 * Usage:
 *   import { createClient } from '@/lib/supabase/client';
 *   const supabase = createClient();
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * Creates a Supabase client for browser use in Client Components.
 * Uses cookie-based auth with automatic cookie management and persistent sessions.
 *
 * Features:
 * - persistSession: true - Sessions persist across browser sessions
 * - autoRefreshToken: true - Automatically refreshes tokens before expiry
 * - Cookie storage - Tokens stored securely in HTTP-only cookies
 *
 * @returns Supabase browser client instance
 * @throws Error if required environment variables are missing
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.",
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
