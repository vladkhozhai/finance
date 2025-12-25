/**
 * Supabase client exports
 */

export {
  createBrowserSupabaseClient,
  createBrowserClientFromEnv,
  type BrowserClientConfig,
} from "./browser";

export {
  createAdminSupabaseClient,
  createAdminClientFromEnv,
  type AdminClientConfig,
} from "./admin";
