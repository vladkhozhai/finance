/**
 * Auth Callback Route
 *
 * Handles the OAuth and email confirmation callback from Supabase.
 * Exchanges the auth code for a session and redirects appropriately.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle errors from Supabase Auth
  if (error) {
    console.error("Auth callback error:", error, errorDescription);
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(errorDescription || error)}`,
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Error exchanging code for session:", exchangeError);
      return NextResponse.redirect(
        `${origin}/auth/error?error=${encodeURIComponent(exchangeError.message)}`,
      );
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  // No code provided
  return NextResponse.redirect(`${origin}/sign-in`);
}
