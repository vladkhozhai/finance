/**
 * Next.js Middleware for CV Web App
 *
 * Protects routes requiring authentication and manages auth flow.
 * Uses Supabase SSR for session management and token refresh.
 */

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Middleware function that runs on every request matching the config.
 * Delegates to Supabase updateSession helper for auth verification.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

/**
 * Matcher configuration for middleware.
 * Excludes:
 * - Next.js internal routes (_next/*)
 * - Static files (images, fonts, etc.)
 * - API routes (/api/*)
 * - favicon.ico
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * - Static file extensions (svg, png, jpg, jpeg, gif, webp, ico)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
