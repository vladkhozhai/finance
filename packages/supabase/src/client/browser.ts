/**
 * Supabase Browser Client Factory
 *
 * Creates a Supabase client for browser use in Client Components.
 * Uses cookie-based auth with automatic cookie management.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Configuration for creating a browser client
 */
export interface BrowserClientConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

/**
 * Creates a Supabase client for browser use in Client Components.
 * Uses cookie-based auth with automatic cookie management.
 *
 * @param config - Configuration with Supabase URL and anon key
 * @returns Supabase browser client instance
 *
 * @example
 * ```ts
 * const supabase = createBrowserClient({
 *   supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *   supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 * });
 * ```
 */
export function createBrowserSupabaseClient<Database = unknown>(
  config: BrowserClientConfig,
): SupabaseClient<Database> {
  return createBrowserClient<Database>(
    config.supabaseUrl,
    config.supabaseAnonKey,
  );
}

/**
 * Creates a browser client using environment variables.
 * Throws if environment variables are missing.
 *
 * @returns Supabase browser client instance
 * @throws Error if NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing
 */
export function createBrowserClientFromEnv<
  Database = unknown,
>(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createBrowserSupabaseClient<Database>({
    supabaseUrl,
    supabaseAnonKey,
  });
}
