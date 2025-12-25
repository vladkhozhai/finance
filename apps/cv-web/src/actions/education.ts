/**
 * Education Server Actions
 *
 * Handles education operations (get, create, update, delete, reorder).
 * Education entries are ordered by display_order for user-controlled sorting.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  educationSchema,
  type EducationInput,
} from "@/lib/validations/profile";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface Education {
  id: string;
  user_id: string;
  institution_name: string;
  degree: string;
  field_of_study: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean | null;
  gpa: string | null;
  description: string | null;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get current user's education entries ordered by display_order, then start_date desc
 */
export async function getEducation(): Promise<ActionResult<Education[]>> {
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

    // Fetch education entries
    const { data: education, error: fetchError } = await supabase
      .from("cv_education")
      .select("*")
      .eq("user_id", user.id)
      .order("display_order", { ascending: true })
      .order("start_date", { ascending: false });

    if (fetchError) {
      console.error("Education fetch error:", fetchError);
      return { success: false, error: "Failed to fetch education" };
    }

    return { success: true, data: education || [] };
  } catch (error) {
    console.error("Unexpected error in getEducation:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Create new education entry for current user
 */
export async function createEducation(
  data: EducationInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validate input
    const validated = educationSchema.safeParse(data);
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
        error: "Current education cannot have an end date",
      };
    }

    if (!validated.data.is_current && !validated.data.end_date) {
      return {
        success: false,
        error: "Completed education must have an end date",
      };
    }

    // Get current max display_order
    const { data: existingEducation, error: fetchError } = await supabase
      .from("cv_education")
      .select("display_order")
      .eq("user_id", user.id)
      .order("display_order", { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error("Error fetching existing education:", fetchError);
      return { success: false, error: "Failed to create education" };
    }

    const nextOrder =
      existingEducation && existingEducation.length > 0 && existingEducation[0].display_order !== null
        ? existingEducation[0].display_order + 1
        : 0;

    // Create education entry
    const { data: education, error: insertError } = await supabase
      .from("cv_education")
      .insert({
        user_id: user.id,
        institution_name: validated.data.institution_name,
        degree: validated.data.degree,
        field_of_study: validated.data.field_of_study,
        location: validated.data.location,
        start_date: validated.data.start_date,
        end_date: validated.data.end_date,
        is_current: validated.data.is_current,
        gpa: validated.data.gpa,
        description: validated.data.description,
        display_order: nextOrder,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Education insert error:", insertError);
      return { success: false, error: "Failed to create education" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");

    return { success: true, data: { id: education.id } };
  } catch (error) {
    console.error("Unexpected error in createEducation:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update existing education entry
 */
export async function updateEducation(
  id: string,
  data: EducationInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validate ID
    if (!id) {
      return { success: false, error: "Education ID is required" };
    }

    // Validate input
    const validated = educationSchema.safeParse(data);
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
        error: "Current education cannot have an end date",
      };
    }

    if (!validated.data.is_current && !validated.data.end_date) {
      return {
        success: false,
        error: "Completed education must have an end date",
      };
    }

    // Update education entry (RLS ensures user can only update their own entries)
    const { error: updateError } = await supabase
      .from("cv_education")
      .update({
        institution_name: validated.data.institution_name,
        degree: validated.data.degree,
        field_of_study: validated.data.field_of_study,
        location: validated.data.location,
        start_date: validated.data.start_date,
        end_date: validated.data.end_date,
        is_current: validated.data.is_current,
        gpa: validated.data.gpa,
        description: validated.data.description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Education update error:", updateError);
      return { success: false, error: "Failed to update education" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("Unexpected error in updateEducation:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete education entry
 */
export async function deleteEducation(
  id: string,
): Promise<ActionResult<{ success: true }>> {
  try {
    // Validate ID
    if (!id) {
      return { success: false, error: "Education ID is required" };
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

    // Delete education entry (RLS ensures user can only delete their own entries)
    const { error: deleteError } = await supabase
      .from("cv_education")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Education delete error:", deleteError);
      return { success: false, error: "Failed to delete education" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("Unexpected error in deleteEducation:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Reorder education entries by updating display_order
 * @param orderedIds - Array of education IDs in the desired order
 */
export async function reorderEducation(
  orderedIds: string[],
): Promise<ActionResult<{ success: true }>> {
  try {
    // Validate input
    if (!orderedIds || orderedIds.length === 0) {
      return { success: false, error: "No education entries to reorder" };
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
    const { data: existingEducation, error: fetchError } = await supabase
      .from("cv_education")
      .select("id")
      .eq("user_id", user.id)
      .in("id", orderedIds);

    if (fetchError) {
      console.error("Error fetching education for reorder:", fetchError);
      return { success: false, error: "Failed to reorder education" };
    }

    if (existingEducation.length !== orderedIds.length) {
      return {
        success: false,
        error: "Some education entries do not exist or do not belong to you",
      };
    }

    // Update display_order for each entry
    const updates = orderedIds.map((id, index) => {
      return supabase
        .from("cv_education")
        .update({ display_order: index, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);
    });

    // Execute all updates in parallel
    const results = await Promise.all(updates);

    // Check for any errors
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      console.error("Education reorder errors:", errors);
      return { success: false, error: "Failed to reorder education" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("Unexpected error in reorderEducation:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
