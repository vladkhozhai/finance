/**
 * Skills Server Actions
 *
 * Handles skill operations (get, create, update, delete, reorder).
 * Skills are ordered by display_order for user-controlled sorting.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { skillSchema, type SkillInput } from "@/lib/validations/profile";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface Skill {
  id: string;
  user_id: string;
  skill_name: string;
  proficiency_level: string | null;
  category: string | null;
  display_order: number | null;
  created_at: string;
}

/**
 * Get current user's skills ordered by display_order
 */
export async function getSkills(): Promise<ActionResult<Skill[]>> {
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

    // Fetch skills
    const { data: skills, error: fetchError } = await supabase
      .from("cv_skills")
      .select("*")
      .eq("user_id", user.id)
      .order("display_order", { ascending: true });

    if (fetchError) {
      console.error("Skills fetch error:", fetchError);
      return { success: false, error: "Failed to fetch skills" };
    }

    return { success: true, data: skills || [] };
  } catch (error) {
    console.error("Unexpected error in getSkills:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Create new skill for current user
 */
export async function createSkill(
  data: SkillInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validate input
    const validated = skillSchema.safeParse(data);
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

    // Check for duplicate skill name
    const { data: existingSkill, error: checkError } = await supabase
      .from("cv_skills")
      .select("id")
      .eq("user_id", user.id)
      .eq("skill_name", validated.data.skill_name)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking for duplicate skill:", checkError);
      return { success: false, error: "Failed to create skill" };
    }

    if (existingSkill) {
      return {
        success: false,
        error: "This skill is already in your profile",
      };
    }

    // Get current max display_order
    const { data: existingSkills, error: fetchError } = await supabase
      .from("cv_skills")
      .select("display_order")
      .eq("user_id", user.id)
      .order("display_order", { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error("Error fetching existing skills:", fetchError);
      return { success: false, error: "Failed to create skill" };
    }

    const nextOrder =
      existingSkills && existingSkills.length > 0 && existingSkills[0].display_order !== null
        ? existingSkills[0].display_order + 1
        : 0;

    // Create skill
    const { data: skill, error: insertError } = await supabase
      .from("cv_skills")
      .insert({
        user_id: user.id,
        skill_name: validated.data.skill_name,
        proficiency_level: validated.data.proficiency_level,
        category: validated.data.category,
        display_order: nextOrder,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Skill insert error:", insertError);
      return { success: false, error: "Failed to create skill" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");

    return { success: true, data: { id: skill.id } };
  } catch (error) {
    console.error("Unexpected error in createSkill:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update existing skill
 */
export async function updateSkill(
  id: string,
  data: SkillInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validate ID
    if (!id) {
      return { success: false, error: "Skill ID is required" };
    }

    // Validate input
    const validated = skillSchema.safeParse(data);
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

    // Check for duplicate skill name (excluding current skill)
    const { data: existingSkill, error: checkError } = await supabase
      .from("cv_skills")
      .select("id")
      .eq("user_id", user.id)
      .eq("skill_name", validated.data.skill_name)
      .neq("id", id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking for duplicate skill:", checkError);
      return { success: false, error: "Failed to update skill" };
    }

    if (existingSkill) {
      return {
        success: false,
        error: "This skill is already in your profile",
      };
    }

    // Update skill (RLS ensures user can only update their own skills)
    const { error: updateError } = await supabase
      .from("cv_skills")
      .update({
        skill_name: validated.data.skill_name,
        proficiency_level: validated.data.proficiency_level,
        category: validated.data.category,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Skill update error:", updateError);
      return { success: false, error: "Failed to update skill" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("Unexpected error in updateSkill:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete skill
 */
export async function deleteSkill(
  id: string,
): Promise<ActionResult<{ success: true }>> {
  try {
    // Validate ID
    if (!id) {
      return { success: false, error: "Skill ID is required" };
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

    // Delete skill (RLS ensures user can only delete their own skills)
    const { error: deleteError } = await supabase
      .from("cv_skills")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Skill delete error:", deleteError);
      return { success: false, error: "Failed to delete skill" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("Unexpected error in deleteSkill:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Reorder skills by updating display_order
 * @param orderedIds - Array of skill IDs in the desired order
 */
export async function reorderSkills(
  orderedIds: string[],
): Promise<ActionResult<{ success: true }>> {
  try {
    // Validate input
    if (!orderedIds || orderedIds.length === 0) {
      return { success: false, error: "No skills to reorder" };
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
    const { data: existingSkills, error: fetchError } = await supabase
      .from("cv_skills")
      .select("id")
      .eq("user_id", user.id)
      .in("id", orderedIds);

    if (fetchError) {
      console.error("Error fetching skills for reorder:", fetchError);
      return { success: false, error: "Failed to reorder skills" };
    }

    if (existingSkills.length !== orderedIds.length) {
      return {
        success: false,
        error: "Some skills do not exist or do not belong to you",
      };
    }

    // Update display_order for each skill
    const updates = orderedIds.map((id, index) => {
      return supabase
        .from("cv_skills")
        .update({ display_order: index })
        .eq("id", id)
        .eq("user_id", user.id);
    });

    // Execute all updates in parallel
    const results = await Promise.all(updates);

    // Check for any errors
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      console.error("Skill reorder errors:", errors);
      return { success: false, error: "Failed to reorder skills" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("Unexpected error in reorderSkills:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
