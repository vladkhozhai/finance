/**
 * Supabase Middleware Client
 *
 * For use in Next.js middleware to verify authentication state and refresh sessions.
 * This client handles request/response cookie management in the middleware context.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database.types";

/**
 * Updates the session in middleware by refreshing the auth token if needed.
 * This ensures that the user's session is always up-to-date across requests.
 * Also handles protected route redirects.
 *
 * @param request - The incoming Next.js request
 * @returns NextResponse with updated cookies
 */
export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "Missing Supabase environment variables in middleware. Auth will not work properly.",
    );
    return NextResponse.next({
      request,
    });
  }

  // Create a NextResponse object to manipulate
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // Check if there's an auth token present to avoid slow auth check
  const hasAuthCookie =
    request.cookies.has("sb-127-0-0-1-54321-auth-token") ||
    request.cookies.getAll().some((cookie) => cookie.name.includes("auth-token"));

  // Define protected and public routes
  const pathname = request.nextUrl.pathname;

  // Routes that require authentication
  const protectedRoutes = ["/cv", "/profile", "/dashboard"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth"];
  const isPublicRoute =
    pathname === "/" || publicRoutes.some((route) => pathname.startsWith(route));

  // API routes and Next.js internals are always allowed
  const isApiRoute = pathname.startsWith("/api");
  const isNextInternalRoute =
    pathname.startsWith("/_next") || pathname === "/favicon.ico";

  // Skip auth check for API and internal routes
  if (isApiRoute || isNextInternalRoute) {
    return supabaseResponse;
  }

  // Fast path: no auth cookie and trying to access protected route
  if (!hasAuthCookie && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Refresh the session if needed (only if we have auth cookies)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Error getting user in middleware:", error.message);
  }

  // If user is not authenticated and trying to access protected route
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    // Preserve the original URL as a 'next' parameter for post-login redirect
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access auth login/signup pages, redirect to dashboard
  if (user && pathname.startsWith("/auth/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: Return the supabaseResponse object with updated cookies
  return supabaseResponse;
}
