/**
 * CV Preview Server Actions
 *
 * Handles CV preview operations including fetching all user CV data,
 * managing CV templates, and setting the selected template.
 * This is the main data provider for the CV preview/generation feature.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { WorkExperience } from "./work-experience";
import type { Education } from "./education";
import type { Skill } from "./skills";
import type { Project } from "./projects";
import type { Certification } from "./certifications";
import type { Language } from "./languages";
import type { SocialLink } from "./social-links";
import type { CVSettings } from "./cv-settings";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * User profile data for CV
 */
export interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  professional_title: string | null;
  phone: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_country: string | null;
  address_postal_code: string | null;
  professional_summary: string | null;
  profile_photo_url: string | null;
}

/**
 * CV Template definition
 */
export interface CVTemplate {
  id: string;
  template_name: string;
  template_slug: string;
  description: string | null;
  category: string;
  thumbnail_url: string | null;
  is_active: boolean;
  created_at: string;
}

/**
 * Complete CV data structure for preview/generation
 */
export interface CVData {
  profile: ProfileData | null;
  socialLinks: SocialLink[];
  workExperiences: WorkExperience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  languages: Language[];
  settings: CVSettings | null;
}

/**
 * Get all user CV data for preview
 * Fetches profile, social links, work experiences, education, skills,
 * projects, certifications, languages, and CV settings in parallel.
 */
export async function getUserCVData(): Promise<ActionResult<CVData>> {
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

    // Fetch all CV data in parallel for optimal performance
    const [
      profileResult,
      socialLinksResult,
      workExperiencesResult,
      educationResult,
      skillsResult,
      projectsResult,
      certificationsResult,
      languagesResult,
      settingsResult,
    ] = await Promise.all([
      // Profile
      supabase
        .from("cv_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle(),

      // Social Links (ordered by display_order)
      supabase
        .from("cv_social_links")
        .select("*")
        .eq("user_id", user.id)
        .order("display_order", { ascending: true }),

      // Work Experiences (ordered by display_order, then start_date DESC)
      supabase
        .from("cv_work_experiences")
        .select("*")
        .eq("user_id", user.id)
        .order("display_order", { ascending: true })
        .order("start_date", { ascending: false }),

      // Education (ordered by display_order, then start_date DESC)
      supabase
        .from("cv_education")
        .select("*")
        .eq("user_id", user.id)
        .order("display_order", { ascending: true })
        .order("start_date", { ascending: false }),

      // Skills (ordered by display_order)
      supabase
        .from("cv_skills")
        .select("*")
        .eq("user_id", user.id)
        .order("display_order", { ascending: true }),

      // Projects (ordered by display_order)
      supabase
        .from("cv_projects")
        .select("*")
        .eq("user_id", user.id)
        .order("display_order", { ascending: true }),

      // Certifications (ordered by display_order)
      supabase
        .from("cv_certifications")
        .select("*")
        .eq("user_id", user.id)
        .order("display_order", { ascending: true })
        .order("issue_date", { ascending: false }),

      // Languages (ordered by display_order)
      supabase
        .from("cv_languages")
        .select("*")
        .eq("user_id", user.id)
        .order("display_order", { ascending: true }),

      // CV Settings
      supabase
        .from("cv_user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    // Check for errors in any of the queries
    if (profileResult.error) {
      console.error("Profile fetch error:", profileResult.error);
      return { success: false, error: "Failed to fetch profile" };
    }

    if (socialLinksResult.error) {
      console.error("Social links fetch error:", socialLinksResult.error);
      return { success: false, error: "Failed to fetch social links" };
    }

    if (workExperiencesResult.error) {
      console.error("Work experiences fetch error:", workExperiencesResult.error);
      return { success: false, error: "Failed to fetch work experiences" };
    }

    if (educationResult.error) {
      console.error("Education fetch error:", educationResult.error);
      return { success: false, error: "Failed to fetch education" };
    }

    if (skillsResult.error) {
      console.error("Skills fetch error:", skillsResult.error);
      return { success: false, error: "Failed to fetch skills" };
    }

    if (projectsResult.error) {
      console.error("Projects fetch error:", projectsResult.error);
      return { success: false, error: "Failed to fetch projects" };
    }

    if (certificationsResult.error) {
      console.error("Certifications fetch error:", certificationsResult.error);
      return { success: false, error: "Failed to fetch certifications" };
    }

    if (languagesResult.error) {
      console.error("Languages fetch error:", languagesResult.error);
      return { success: false, error: "Failed to fetch languages" };
    }

    if (settingsResult.error) {
      console.error("CV settings fetch error:", settingsResult.error);
      return { success: false, error: "Failed to fetch CV settings" };
    }

    // Format settings with proper type for sections_visibility
    const settings = settingsResult.data
      ? {
          ...settingsResult.data,
          sections_visibility: (settingsResult.data.sections_visibility ?? {}) as Record<string, boolean>,
        }
      : null;

    // Construct CV data object
    const cvData: CVData = {
      profile: profileResult.data,
      socialLinks: socialLinksResult.data || [],
      workExperiences: workExperiencesResult.data || [],
      education: educationResult.data || [],
      skills: skillsResult.data || [],
      projects: projectsResult.data || [],
      certifications: certificationsResult.data || [],
      languages: languagesResult.data || [],
      settings,
    };

    return { success: true, data: cvData };
  } catch (error) {
    console.error("Unexpected error in getUserCVData:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all active CV templates
 * Fetches templates from cv_templates table, ordered by creation date.
 */
export async function getTemplates(): Promise<ActionResult<CVTemplate[]>> {
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

    // Fetch active templates
    const { data: templates, error: fetchError } = await supabase
      .from("cv_templates")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error("Templates fetch error:", fetchError);
      return { success: false, error: "Failed to fetch templates" };
    }

    return { success: true, data: templates || [] };
  } catch (error) {
    console.error("Unexpected error in getTemplates:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Set the selected template for the user's CV
 * Updates the selected_template_id in cv_user_settings.
 * Creates settings record if it doesn't exist.
 *
 * @param templateId - The ID of the template to select
 */
export async function setSelectedTemplate(
  templateId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validate templateId
    if (!templateId) {
      return { success: false, error: "Template ID is required" };
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

    // Verify template exists and is active
    const { data: template, error: templateError } = await supabase
      .from("cv_templates")
      .select("id, is_active")
      .eq("id", templateId)
      .maybeSingle();

    if (templateError) {
      console.error("Template verification error:", templateError);
      return { success: false, error: "Failed to verify template" };
    }

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    if (!template.is_active) {
      return { success: false, error: "Template is not active" };
    }

    // Check if settings exist
    const { data: existingSettings, error: fetchError } = await supabase
      .from("cv_user_settings")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("CV settings fetch error:", fetchError);
      return { success: false, error: "Failed to update template selection" };
    }

    let settingsId: string;

    if (!existingSettings) {
      // Create new settings with default values
      const { data: newSettings, error: insertError } = await supabase
        .from("cv_user_settings")
        .insert({
          user_id: user.id,
          selected_template_id: templateId,
          theme_color: null,
          font_family: null,
          sections_visibility: {
            projects: true,
            certifications: true,
            languages: true,
          },
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("CV settings creation error:", insertError);
        return { success: false, error: "Failed to set template" };
      }

      settingsId = newSettings.id;
    } else {
      // Update existing settings
      const { error: updateError } = await supabase
        .from("cv_user_settings")
        .update({
          selected_template_id: templateId,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Template selection update error:", updateError);
        return { success: false, error: "Failed to set template" };
      }

      settingsId = existingSettings.id;
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/cv");
    revalidatePath("/settings");

    return { success: true, data: { id: settingsId } };
  } catch (error) {
    console.error("Unexpected error in setSelectedTemplate:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
