/**
 * Auth Callback Route Handler
 *
 * Handles OAuth and email confirmation callbacks from Supabase Auth.
 * This route receives the authentication code and exchanges it for a session.
 *
 * Flow:
 * 1. User clicks confirmation link in email
 * 2. Supabase redirects to this route with code/token
 * 3. This handler exchanges the code for a session
 * 4. User is redirected to dashboard (success) or error page (failure)
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // Get the authorization code from URL params
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  // Handle error params from Supabase
  const error = searchParams.get("error");
  const error_code = searchParams.get("error_code");
  const error_description = searchParams.get("error_description");

  // If there's an error from Supabase, redirect to error page
  if (error || error_code) {
    const errorMessage =
      error_description || error || "Authentication failed. Please try again.";
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(error || error_code || "unknown")}&message=${encodeURIComponent(errorMessage)}`
    );
  }

  // Handle PKCE flow (code exchange)
  if (code) {
    const supabase = await createClient();

    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Auth callback error (code exchange):", exchangeError);

      // Map error codes to user-friendly messages
      let userMessage = "Authentication failed. Please try again.";
      if (
        exchangeError.message.includes("expired") ||
        exchangeError.message.includes("invalid")
      ) {
        userMessage =
          "The confirmation link has expired or is invalid. Please request a new confirmation email.";
      }

      return NextResponse.redirect(
        `${origin}/auth/error?error=${encodeURIComponent(exchangeError.code || "exchange_failed")}&message=${encodeURIComponent(userMessage)}`
      );
    }

    // Success! Redirect to dashboard
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  // Handle token hash flow (email confirmation with token_hash)
  if (token_hash && type) {
    const supabase = await createClient();

    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "signup" | "email" | "recovery" | "invite",
    });

    if (verifyError) {
      console.error("Auth callback error (token verification):", verifyError);

      let userMessage = "Verification failed. Please try again.";
      if (
        verifyError.message.includes("expired") ||
        verifyError.code === "otp_expired"
      ) {
        userMessage =
          "The confirmation link has expired. Please request a new confirmation email.";
      } else if (verifyError.message.includes("invalid")) {
        userMessage =
          "The confirmation link is invalid. Please request a new confirmation email.";
      }

      return NextResponse.redirect(
        `${origin}/auth/error?error=${encodeURIComponent(verifyError.code || "verification_failed")}&message=${encodeURIComponent(userMessage)}`
      );
    }

    // Success! Redirect to dashboard
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  // No code or token_hash provided - redirect to error
  return NextResponse.redirect(
    `${origin}/auth/error?error=missing_params&message=${encodeURIComponent("Invalid confirmation link. Please check your email and try again.")}`
  );
}
