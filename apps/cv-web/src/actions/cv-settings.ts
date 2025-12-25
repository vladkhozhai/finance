/**
 * CV Settings Server Actions
 *
 * Handles CV settings operations (get, update, toggle section visibility).
 * CV settings control which sections are visible in the generated CV and styling options.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  cvSettingsSchema,
  type CVSettingsInput,
} from "@/lib/validations/profile";
import type { Json } from "@/types/database.types";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface CVSettings {
  id: string;
  user_id: string;
  selected_template_id: string | null;
  theme_color: string | null;
  font_family: string | null;
  sections_visibility: Record<string, boolean>;
  updated_at: string;
}

/**
 * Get current user's CV settings (creates default if none exist)
 */
export async function getCVSettings(): Promise<ActionResult<CVSettings>> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Try to fetch existing settings
    const { data: settings, error: fetchError } = await supabase
      .from("cv_user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("CV settings fetch error:", fetchError);
      return { success: false, error: "Failed to fetch CV settings" };
    }

    // If no settings exist, create default settings
    if (!settings) {
      const defaultSettings = {
        user_id: user.id,
        selected_template_id: null,
        theme_color: null,
        font_family: null,
        sections_visibility: {
          projects: true,
          certifications: true,
          languages: true,
        },
      };

      const { data: newSettings, error: insertError } = await supabase
        .from("cv_user_settings")
        .insert(defaultSettings)
        .select("*")
        .single();

      if (insertError) {
        console.error("CV settings creation error:", insertError);
        return { success: false, error: "Failed to create CV settings" };
      }

      return {
        success: true,
        data: {
          ...newSettings,
          sections_visibility: (newSettings.sections_visibility ?? {}) as Record<string, boolean>,
        },
      };
    }

    return {
      success: true,
      data: {
        ...settings,
        sections_visibility: (settings.sections_visibility ?? {}) as Record<string, boolean>,
      },
    };
  } catch (error) {
    console.error("Unexpected error in getCVSettings:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update CV settings for current user
 */
export async function updateCVSettings(
  data: CVSettingsInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validate input
    const validated = cvSettingsSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Invalid input",
      };
    }

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if settings exist
    const { data: existingSettings, error: fetchError } = await supabase
      .from("cv_user_settings")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("CV settings fetch error:", fetchError);
      return { success: false, error: "Failed to update CV settings" };
    }

    let settingsId: string;

    if (!existingSettings) {
      // Create new settings
      const { data: newSettings, error: insertError } = await supabase
        .from("cv_user_settings")
        .insert({
          user_id: user.id,
          selected_template_id: validated.data.selected_template_id,
          theme_color: validated.data.theme_color,
          font_family: validated.data.font_family,
          sections_visibility: validated.data.sections_visibility as Json,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("CV settings creation error:", insertError);
        return { success: false, error: "Failed to create CV settings" };
      }

      settingsId = newSettings.id;
    } else {
      // Update existing settings
      const { error: updateError } = await supabase
        .from("cv_user_settings")
        .update({
          selected_template_id: validated.data.selected_template_id,
          theme_color: validated.data.theme_color,
          font_family: validated.data.font_family,
          sections_visibility: validated.data.sections_visibility as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("CV settings update error:", updateError);
        return { success: false, error: "Failed to update CV settings" };
      }

      settingsId = existingSettings.id;
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");
    revalidatePath("/settings");

    return { success: true, data: { id: settingsId } };
  } catch (error) {
    console.error("Unexpected error in updateCVSettings:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Toggle visibility of a specific CV section
 * @param section - Name of the section to toggle (e.g., "projects", "certifications", "languages")
 * @param visible - Whether the section should be visible
 */
export async function updateSectionVisibility(
  section: string,
  visible: boolean,
): Promise<ActionResult<{ success: true }>> {
  try {
    // Validate section name
    if (!section || typeof section !== "string") {
      return { success: false, error: "Invalid section name" };
    }

    if (typeof visible !== "boolean") {
      return { success: false, error: "Visibility must be a boolean" };
    }

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get current settings
    const { data: currentSettings, error: fetchError } = await supabase
      .from("cv_user_settings")
      .select("sections_visibility")
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("CV settings fetch error:", fetchError);
      return { success: false, error: "Failed to update section visibility" };
    }

    let updatedVisibility: Record<string, boolean>;

    if (!currentSettings) {
      // Create default settings with the specified section visibility
      updatedVisibility = {
        projects: true,
        certifications: true,
        languages: true,
        [section]: visible,
      };

      const { error: insertError } = await supabase
        .from("cv_user_settings")
        .insert({
          user_id: user.id,
          selected_template_id: null,
          theme_color: null,
          font_family: null,
          sections_visibility: updatedVisibility as Json,
        });

      if (insertError) {
        console.error("CV settings creation error:", insertError);
        return { success: false, error: "Failed to create CV settings" };
      }
    } else {
      // Update specific section visibility
      updatedVisibility = {
        ...(currentSettings.sections_visibility as Record<string, boolean>),
        [section]: visible,
      };

      const { error: updateError } = await supabase
        .from("cv_user_settings")
        .update({
          sections_visibility: updatedVisibility as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Section visibility update error:", updateError);
        return { success: false, error: "Failed to update section visibility" };
      }
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");
    revalidatePath("/settings");

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("Unexpected error in updateSectionVisibility:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
