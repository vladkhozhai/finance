/**
 * Supabase Middleware Client
 *
 * For use in Next.js middleware to verify authentication state and refresh sessions.
 * This client handles request/response cookie management in the middleware context.
 *
 * Usage in middleware.ts:
 *   import { updateSession } from '@/lib/supabase/middleware';
 *   export async function middleware(request: NextRequest) {
 *     return await updateSession(request);
 *   }
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database.types";

/**
 * Updates the session in middleware by refreshing the auth token if needed.
 * This ensures that the user's session is always up-to-date across requests.
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
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // Refresh the session if needed
  const { error } = await supabase.auth.getUser();

  if (error) {
    console.error("Error getting user in middleware:", error.message);
  }

  // Redirect legacy routes to Profile page with appropriate tab
  const pathname = request.nextUrl.pathname;

  if (pathname === "/payment-methods") {
    const url = request.nextUrl.clone();
    url.pathname = "/profile";
    url.searchParams.set("tab", "payment-methods");
    return NextResponse.redirect(url);
  }

  if (pathname === "/categories") {
    const url = request.nextUrl.clone();
    url.pathname = "/profile";
    url.searchParams.set("tab", "categories");
    return NextResponse.redirect(url);
  }

  if (pathname === "/tags") {
    const url = request.nextUrl.clone();
    url.pathname = "/profile";
    url.searchParams.set("tab", "tags");
    return NextResponse.redirect(url);
  }

  // IMPORTANT: Return the supabaseResponse object with updated cookies
  return supabaseResponse;
}
