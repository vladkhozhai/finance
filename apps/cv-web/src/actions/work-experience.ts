/**
 * Work Experience Server Actions
 *
 * Handles work experience operations (get, create, update, delete, reorder).
 * Work experiences are ordered by display_order for user-controlled sorting.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  workExperienceSchema,
  type WorkExperienceInput,
} from "@/lib/validations/profile";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface WorkExperience {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  employment_type: string | null;
  location: string | null;
  is_remote: boolean | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean | null;
  description: string | null;
  achievements: string[] | null;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get current user's work experiences ordered by display_order, then start_date desc
 */
export async function getWorkExperiences(): Promise<
  ActionResult<WorkExperience[]>
> {
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

    // Fetch work experiences
    const { data: experiences, error: fetchError } = await supabase
      .from("cv_work_experiences")
      .select("*")
      .eq("user_id", user.id)
      .order("display_order", { ascending: true })
      .order("start_date", { ascending: false });

    if (fetchError) {
      console.error("Work experiences fetch error:", fetchError);
      return { success: false, error: "Failed to fetch work experiences" };
    }

    return { success: true, data: experiences || [] };
  } catch (error) {
    console.error("Unexpected error in getWorkExperiences:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Create new work experience for current user
 */
export async function createWorkExperience(
  data: WorkExperienceInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validate input
    const validated = workExperienceSchema.safeParse(data);
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

    // Validate business rules
    if (validated.data.is_current && validated.data.end_date) {
      return {
        success: false,
        error: "Current position cannot have an end date",
      };
    }

    if (!validated.data.is_current && !validated.data.end_date) {
      return {
        success: false,
        error: "Past position must have an end date",
      };
    }

    // Get current max display_order
    const { data: existingExperiences, error: fetchError } = await supabase
      .from("cv_work_experiences")
      .select("display_order")
      .eq("user_id", user.id)
      .order("display_order", { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error("Error fetching existing experiences:", fetchError);
      return { success: false, error: "Failed to create work experience" };
    }

    const nextOrder =
      existingExperiences && existingExperiences.length > 0 && existingExperiences[0].display_order !== null
        ? existingExperiences[0].display_order + 1
        : 0;

    // Create work experience
    const { data: experience, error: insertError } = await supabase
      .from("cv_work_experiences")
      .insert({
        user_id: user.id,
        company_name: validated.data.company_name,
        job_title: validated.data.job_title,
        employment_type: validated.data.employment_type,
        location: validated.data.location,
        is_remote: validated.data.is_remote,
        start_date: validated.data.start_date,
        end_date: validated.data.end_date,
        is_current: validated.data.is_current,
        description: validated.data.description,
        achievements: validated.data.achievements,
        display_order: nextOrder,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Work experience insert error:", insertError);
      return { success: false, error: "Failed to create work experience" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");

    return { success: true, data: { id: experience.id } };
  } catch (error) {
    console.error("Unexpected error in createWorkExperience:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update existing work experience
 */
export async function updateWorkExperience(
  id: string,
  data: WorkExperienceInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validate ID
    if (!id) {
      return { success: false, error: "Work experience ID is required" };
    }

    // Validate input
    const validated = workExperienceSchema.safeParse(data);
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

    // Validate business rules
    if (validated.data.is_current && validated.data.end_date) {
      return {
        success: false,
        error: "Current position cannot have an end date",
      };
    }

    if (!validated.data.is_current && !validated.data.end_date) {
      return {
        success: false,
        error: "Past position must have an end date",
      };
    }

    // Update work experience (RLS ensures user can only update their own experiences)
    const { error: updateError } = await supabase
      .from("cv_work_experiences")
      .update({
        company_name: validated.data.company_name,
        job_title: validated.data.job_title,
        employment_type: validated.data.employment_type,
        location: validated.data.location,
        is_remote: validated.data.is_remote,
        start_date: validated.data.start_date,
        end_date: validated.data.end_date,
        is_current: validated.data.is_current,
        description: validated.data.description,
        achievements: validated.data.achievements,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Work experience update error:", updateError);
      return { success: false, error: "Failed to update work experience" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("Unexpected error in updateWorkExperience:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete work experience
 */
export async function deleteWorkExperience(
  id: string,
): Promise<ActionResult<{ success: true }>> {
  try {
    // Validate ID
    if (!id) {
      return { success: false, error: "Work experience ID is required" };
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

    // Delete work experience (RLS ensures user can only delete their own experiences)
    const { error: deleteError } = await supabase
      .from("cv_work_experiences")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Work experience delete error:", deleteError);
      return { success: false, error: "Failed to delete work experience" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("Unexpected error in deleteWorkExperience:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Reorder work experiences by updating display_order
 * @param orderedIds - Array of work experience IDs in the desired order
 */
export async function reorderWorkExperiences(
  orderedIds: string[],
): Promise<ActionResult<{ success: true }>> {
  try {
    // Validate input
    if (!orderedIds || orderedIds.length === 0) {
      return { success: false, error: "No work experiences to reorder" };
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

    // Verify all IDs belong to the user
    const { data: existingExperiences, error: fetchError } = await supabase
      .from("cv_work_experiences")
      .select("id")
      .eq("user_id", user.id)
      .in("id", orderedIds);

    if (fetchError) {
      console.error("Error fetching experiences for reorder:", fetchError);
      return { success: false, error: "Failed to reorder work experiences" };
    }

    if (existingExperiences.length !== orderedIds.length) {
      return {
        success: false,
        error: "Some work experiences do not exist or do not belong to you",
      };
    }

    // Update display_order for each experience
    const updates = orderedIds.map((id, index) => {
      return supabase
        .from("cv_work_experiences")
        .update({ display_order: index, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);
    });

    // Execute all updates in parallel
    const results = await Promise.all(updates);

    // Check for any errors
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      console.error("Work experience reorder errors:", errors);
      return { success: false, error: "Failed to reorder work experiences" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("Unexpected error in reorderWorkExperiences:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
