/**
 * @platform/supabase - Shared Supabase client utilities
 *
 * This package provides shared Supabase client factories and utilities
 * for use across the platform monorepo.
 *
 * @example Browser client (Client Components)
 * ```ts
 * import { createBrowserClientFromEnv } from '@platform/supabase';
 * const supabase = createBrowserClientFromEnv();
 * ```
 *
 * @example Server client (Next.js Server Components)
 * ```ts
 * import { createServerClientFromEnv } from '@platform/supabase/nextjs';
 * import { cookies } from 'next/headers';
 *
 * const cookieStore = await cookies();
 * const supabase = createServerClientFromEnv(cookieStore);
 * ```
 *
 * @example Admin client (Elevated privileges)
 * ```ts
 * import { createAdminClientFromEnv } from '@platform/supabase';
 * const adminClient = createAdminClientFromEnv();
 * ```
 */

// Re-export all client utilities
export * from "./client";
