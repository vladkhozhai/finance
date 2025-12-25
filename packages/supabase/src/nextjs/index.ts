/**
 * Next.js specific Supabase exports
 */

export {
  createServerSupabaseClient,
  createServerClientFromEnv,
  type ServerClientConfig,
  type CookieStore,
  type CookieOptions,
} from "./server";

export {
  createMiddlewareSupabaseClient,
  type MiddlewareClientConfig,
  type MiddlewareClientResult,
  type MiddlewareRequest,
  type MiddlewareResponse,
  type MiddlewareCookieOptions,
} from "./middleware";
