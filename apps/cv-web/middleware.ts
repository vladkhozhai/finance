import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  console.log("Middleware running for:", request.nextUrl.pathname);

  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
    "/auth/error",
  ];

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check for auth cookie
  const hasAuthCookie = request.cookies.getAll().some(cookie =>
    cookie.name.includes("auth-token") || cookie.name.includes("sb-")
  );

  // If no auth cookie and not on public route, redirect to sign-in
  if (!hasAuthCookie && !isPublicRoute && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // If no auth cookie and on root, redirect to sign-in
  if (!hasAuthCookie && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
