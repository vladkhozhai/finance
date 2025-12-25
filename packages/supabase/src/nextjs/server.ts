/**
 * Supabase Server Client for Next.js
 *
 * Creates a Supabase client for server-side use with Next.js cookies() API.
 * For use in Server Components, Server Actions, and Route Handlers.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Cookie options type
 */
export interface CookieOptions {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: boolean | "strict" | "lax" | "none";
  secure?: boolean;
  [key: string]: unknown;
}

/**
 * Cookie store interface compatible with Next.js cookies()
 */
export interface CookieStore {
  getAll: () => Array<{ name: string; value: string }>;
  set: (name: string, value: string, options?: CookieOptions) => void;
}

/**
 * Configuration for creating a server client
 */
export interface ServerClientConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  cookieStore: CookieStore;
}

/**
 * Creates a Supabase server client for Next.js Server Components and Server Actions.
 * Uses the provided cookie store for session management.
 *
 * @param config - Configuration with Supabase credentials and cookie store
 * @returns Supabase server client instance
 *
 * @example
 * ```ts
 * import { cookies } from 'next/headers';
 *
 * const cookieStore = await cookies();
 * const supabase = createServerSupabaseClient({
 *   supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *   supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 *   cookieStore,
 * });
 * ```
 */
export function createServerSupabaseClient<Database = unknown>(
  config: ServerClientConfig,
): SupabaseClient<Database> {
  return createSupabaseServerClient<Database>(
    config.supabaseUrl,
    config.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return config.cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              config.cookieStore.set(name, value, options);
            }
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    },
  );
}

/**
 * Creates a server client using environment variables and a cookie store.
 * Throws if environment variables are missing.
 *
 * @param cookieStore - Cookie store from Next.js cookies()
 * @returns Supabase server client instance
 * @throws Error if NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing
 */
export function createServerClientFromEnv<Database = unknown>(
  cookieStore: CookieStore,
): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createServerSupabaseClient<Database>({
    supabaseUrl,
    supabaseAnonKey,
    cookieStore,
  });
}
