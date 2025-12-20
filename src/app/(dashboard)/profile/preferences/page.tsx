/**
 * Profile Preferences Page
 *
 * Allows users to update their preferences:
 * - Default currency
 * - Default payment method (optional)
 * - Other app preferences
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PreferencesForm } from "./preferences-form";

export default async function PreferencesPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = (await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()) as {
    data: { currency: string } | null;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Customize your FinanceFlow experience
        </p>
      </div>

      {/* Preferences Form */}
      <PreferencesForm currentCurrency={profile?.currency || "USD"} />
    </div>
  );
}
