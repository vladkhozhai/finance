/**
 * Supabase Server Client
 *
 * For use in Server Components, Server Actions, and Route Handlers.
 * This client handles cookies on the server using Next.js cookies() API
 * with @supabase/ssr for proper cookie management.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

/**
 * Creates a Supabase client for server-side use in Server Components and Server Actions.
 * Uses Next.js cookies() API for cookie management with proper typing.
 *
 * @returns Promise<SupabaseClient> - Supabase server client instance
 * @throws Error if required environment variables are missing
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

/**
 * Creates a Supabase admin client with service role key.
 * WARNING: This client bypasses Row Level Security (RLS).
 * Only use for trusted server-side operations that require elevated privileges.
 *
 * @returns Supabase admin client instance
 * @throws Error if service role key is missing
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing Supabase admin environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.",
    );
  }

  // Note: For admin operations, we use the regular createClient from @supabase/supabase-js
  // since we don't need cookie management for service role operations
  const { createClient: createSupabaseClient } =
    require("@supabase/supabase-js");
  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as ReturnType<typeof createServerClient<Database>>;
}
