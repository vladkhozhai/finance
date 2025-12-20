/**
 * Authentication Server Actions
 *
 * Handles user authentication operations (sign in, sign up, sign out).
 * Uses Supabase Auth with server-side cookie management.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Validation schemas
const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  currency: z.string().default("USD"),
});

type SignInInput = z.infer<typeof signInSchema>;
type SignUpInput = z.infer<typeof signUpSchema>;

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
  redirect("/");
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

  // Create user account
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      data: {
        currency: validated.data.currency,
      },
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
  // The trigger reads currency from raw_user_meta_data

  // Revalidate and redirect on success
  revalidatePath("/", "layout");
  redirect("/");
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
  redirect("/login");
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
