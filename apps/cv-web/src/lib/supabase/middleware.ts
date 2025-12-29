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
  const hasAuthCookie = request.cookies.has('sb-127-0-0-1-54321-auth-token') ||
                        request.cookies.getAll().some(cookie =>
                          cookie.name.includes('auth-token')
                        );

  // If no auth cookies, skip the slow getUser() call for public routes
  const pathname = request.nextUrl.pathname;
  const publicRoutes = [
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
    "/auth/error",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Fast path: no auth cookie and trying to access protected route
  if (!hasAuthCookie && !isPublicRoute && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Fast path: no auth cookie and on root
  if (!hasAuthCookie && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
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
  if (!user && !isPublicRoute && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    // Preserve the original URL as a 'next' parameter for post-login redirect
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (user && isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Redirect root to dashboard if authenticated, otherwise to sign-in
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/dashboard" : "/sign-in";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: Return the supabaseResponse object with updated cookies
  return supabaseResponse;
}
