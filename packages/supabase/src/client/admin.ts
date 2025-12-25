/**
 * Supabase Admin Client Factory
 *
 * Creates a Supabase admin client with service role key.
 * WARNING: This client bypasses Row Level Security (RLS).
 * Only use for trusted server-side operations that require elevated privileges.
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Configuration for creating an admin client
 */
export interface AdminClientConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

/**
 * Creates a Supabase admin client with service role key.
 *
 * WARNING: This client bypasses Row Level Security (RLS).
 * Only use for trusted server-side operations that require elevated privileges.
 *
 * @param config - Configuration with Supabase URL and service role key
 * @returns Supabase admin client instance
 *
 * @example
 * ```ts
 * const adminClient = createAdminClient({
 *   supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *   supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
 * });
 * ```
 */
export function createAdminSupabaseClient<Database = unknown>(
  config: AdminClientConfig,
): SupabaseClient<Database> {
  return createSupabaseClient<Database>(
    config.supabaseUrl,
    config.supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

/**
 * Creates an admin client using environment variables.
 * Throws if environment variables are missing.
 *
 * @returns Supabase admin client instance
 * @throws Error if NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing
 */
export function createAdminClientFromEnv<
  Database = unknown,
>(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing Supabase admin environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createAdminSupabaseClient<Database>({
    supabaseUrl,
    supabaseServiceRoleKey,
  });
}
