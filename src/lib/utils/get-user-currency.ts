/**
 * User Currency Utility
 *
 * Helper to get the authenticated user's currency from their profile.
 */

"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Gets the authenticated user's currency from their profile.
 * Falls back to USD if no profile currency is set.
 *
 * @returns Currency code (e.g., "USD", "EUR", "UAH")
 */
export async function getUserCurrency(): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return "USD"; // Default fallback for unauthenticated users
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("currency")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.currency || "USD";
}
