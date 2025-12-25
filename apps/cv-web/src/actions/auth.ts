/**
 * Authentication Server Actions
 *
 * Handles user authentication operations (sign in, sign up, sign out, password reset).
 * Uses Supabase Auth with server-side cookie management.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  type SignInInput,
  type SignUpInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

/**
 * Get the site URL for redirects
 * Handles both production and development environments
 */
function getSiteUrl(): string {
  // Production URL from environment
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  // Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Default to localhost for development
  return "http://localhost:3001";
}

/**
 * Sign in with email and password
 */
export async function signIn(data: SignInInput) {
  // Validate input
  const validated = signInSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false as const,
      error: validated.error.issues[0]?.message || "Invalid input",
    };
  }

  const supabase = await createClient();

  // Attempt sign in
  const { error } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  });

  if (error) {
    return {
      success: false as const,
      error: error.message,
    };
  }

  // Revalidate and redirect on success
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/**
 * Sign up with email and password
 */
export async function signUp(data: SignUpInput) {
  // Validate input
  const validated = signUpSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false as const,
      error: validated.error.issues[0]?.message || "Invalid input",
    };
  }

  const supabase = await createClient();
  const siteUrl = getSiteUrl();

  // Create user account with proper email redirect
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      data: {
        first_name: validated.data.firstName,
        last_name: validated.data.lastName,
      },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (signUpError) {
    return {
      success: false as const,
      error: signUpError.message,
    };
  }

  if (!authData.user) {
    return {
      success: false as const,
      error: "Failed to create user account",
    };
  }

  // Note: Profile is automatically created by database trigger (handle_new_user)
  // The trigger reads first_name and last_name from raw_user_meta_data

  // Revalidate and redirect on success to login with confirmation notice
  revalidatePath("/", "layout");
  redirect("/sign-in?confirmed=pending");
}

/**
 * Sign out current user
 */
export async function signOut() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return {
      success: false as const,
      error: error.message,
    };
  }

  revalidatePath("/", "layout");
  redirect("/sign-in");
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Request password reset email
 */
export async function forgotPassword(data: ForgotPasswordInput) {
  // Validate input
  const validated = forgotPasswordSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false as const,
      error: validated.error.issues[0]?.message || "Invalid input",
    };
  }

  const supabase = await createClient();
  const siteUrl = getSiteUrl();

  const { error } = await supabase.auth.resetPasswordForEmail(
    validated.data.email,
    {
      redirectTo: `${siteUrl}/reset-password`,
    },
  );

  if (error) {
    return {
      success: false as const,
      error: error.message,
    };
  }

  return {
    success: true as const,
  };
}

/**
 * Reset password with new password
 */
export async function resetPassword(data: ResetPasswordInput) {
  // Validate input
  const validated = resetPasswordSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false as const,
      error: validated.error.issues[0]?.message || "Invalid input",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: validated.data.password,
  });

  if (error) {
    return {
      success: false as const,
      error: error.message,
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/**
 * Resend confirmation email to user
 */
export async function resendConfirmationEmail(email: string) {
  if (!email || !email.includes("@")) {
    return {
      success: false as const,
      error: "Please provide a valid email address",
    };
  }

  const supabase = await createClient();
  const siteUrl = getSiteUrl();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    // Map common errors to user-friendly messages
    if (error.message.includes("rate limit")) {
      return {
        success: false as const,
        error:
          "Too many requests. Please wait a few minutes before trying again.",
      };
    }
    if (
      error.message.includes("not found") ||
      error.message.includes("not exist")
    ) {
      return {
        success: false as const,
        error:
          "No account found with this email. Please check the email address or sign up.",
      };
    }
    return {
      success: false as const,
      error: error.message,
    };
  }

  return {
    success: true as const,
  };
}
