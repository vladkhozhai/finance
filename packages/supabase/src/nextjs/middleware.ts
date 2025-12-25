/**
 * Supabase Middleware Utilities for Next.js
 *
 * Provides utilities for handling Supabase auth in Next.js middleware.
 * Creates a client that can refresh sessions and manage cookies in middleware context.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Request-like object with cookies for middleware
 */
export interface MiddlewareRequest {
  cookies: {
    getAll: () => Array<{ name: string; value: string }>;
    set: (name: string, value: string) => void;
  };
}

/**
 * Cookie options type for middleware
 */
export interface MiddlewareCookieOptions {
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
 * Response-like object with cookies for middleware
 */
export interface MiddlewareResponse {
  cookies: {
    set: (
      name: string,
      value: string,
      options?: MiddlewareCookieOptions,
    ) => void;
  };
}

/**
 * Configuration for creating a middleware client
 */
export interface MiddlewareClientConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  request: MiddlewareRequest;
  response: MiddlewareResponse;
}

/**
 * Result of creating a middleware client
 */
export interface MiddlewareClientResult<Database = unknown> {
  supabase: SupabaseClient<Database>;
  response: MiddlewareResponse;
}

/**
 * Creates a Supabase client for use in Next.js middleware.
 * Handles cookie management for request/response context.
 *
 * @param config - Configuration with Supabase credentials and request/response
 * @returns Object containing Supabase client and updated response
 *
 * @example
 * ```ts
 * import { NextResponse } from 'next/server';
 *
 * export async function middleware(request: NextRequest) {
 *   let response = NextResponse.next({ request });
 *
 *   const { supabase, response: updatedResponse } = createMiddlewareClient({
 *     supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *     supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 *     request,
 *     response,
 *   });
 *
 *   await supabase.auth.getUser();
 *   return updatedResponse;
 * }
 * ```
 */
export function createMiddlewareSupabaseClient<Database = unknown>(
  config: MiddlewareClientConfig,
): MiddlewareClientResult<Database> {
  let currentResponse = config.response;

  const supabase = createSupabaseServerClient<Database>(
    config.supabaseUrl,
    config.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return config.request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            config.request.cookies.set(name, value);
          }
          for (const { name, value, options } of cookiesToSet) {
            currentResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  return {
    supabase,
    response: currentResponse,
  };
}
