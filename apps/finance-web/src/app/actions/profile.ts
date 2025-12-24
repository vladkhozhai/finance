/**
 * Profile Server Actions
 *
 * Handles user profile updates (currency, preferences, etc.).
 */

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Validation schemas
const updateCurrencySchema = z.object({
  currency: z.string().min(3).max(3),
});

const updatePreferencesSchema = z.object({
  currency: z.string().min(3).max(3),
});

type UpdateCurrencyInput = z.infer<typeof updateCurrencySchema>;
type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

/**
 * Update user's default currency
 */
export async function updateCurrency(data: UpdateCurrencyInput) {
  const validated = updateCurrencySchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false as const,
      error: validated.error.issues[0]?.message || "Invalid input",
    };
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false as const,
      error: "Not authenticated",
    };
  }

  // Update profile
  const { error } = await supabase
    .from("profiles")
    .update({ currency: validated.data.currency })
    .eq("id", user.id);

  if (error) {
    return {
      success: false as const,
      error: error.message,
    };
  }

  revalidatePath("/profile/overview");
  revalidatePath("/profile/preferences");

  return {
    success: true as const,
    data: { currency: validated.data.currency },
  };
}

/**
 * Update user preferences (currency, default payment method, etc.)
 */
export async function updatePreferences(data: UpdatePreferencesInput) {
  const validated = updatePreferencesSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false as const,
      error: validated.error.issues[0]?.message || "Invalid input",
    };
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false as const,
      error: "Not authenticated",
    };
  }

  // Update profile
  const { error } = await supabase
    .from("profiles")
    .update({ currency: validated.data.currency })
    .eq("id", user.id);

  if (error) {
    return {
      success: false as const,
      error: error.message,
    };
  }

  revalidatePath("/profile/overview");
  revalidatePath("/profile/preferences");
  revalidatePath("/", "layout");

  return {
    success: true as const,
    data: validated.data,
  };
}

/**
 * Get user profile data
 */
export async function getUserProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false as const,
      error: "Not authenticated",
    };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    return {
      success: false as const,
      error: error.message,
    };
  }

  return {
    success: true as const,
    data: profile,
  };
}
