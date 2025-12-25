/**
 * Next.js Middleware
 *
 * Runs on every request to refresh user sessions and handle authentication.
 * This middleware ensures that user auth tokens are always up-to-date.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Middleware function that runs on every request.
 * Updates Supabase session and handles route protection.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

/**
 * Matcher configuration to specify which routes the middleware should run on.
 * This configuration excludes static files and API routes for better performance.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (*.svg, *.png, *.jpg, *.jpeg, *.gif, *.webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
