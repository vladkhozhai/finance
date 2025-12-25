/**
 * Languages Server Actions
 *
 * Handles language operations (get, create, update, delete, reorder).
 * Languages are ordered by display_order for user-controlled sorting.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { languageSchema, type LanguageInput } from "@/lib/validations/profile";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface Language {
  id: string;
  user_id: string;
  language_name: string;
  proficiency: string;
  display_order: number | null;
  created_at: string;
}

/**
 * Get current user's languages ordered by display_order
 */
export async function getLanguages(): Promise<ActionResult<Language[]>> {
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

    // Fetch languages
    const { data: languages, error: fetchError } = await supabase
      .from("cv_languages")
      .select("*")
      .eq("user_id", user.id)
      .order("display_order", { ascending: true });

    if (fetchError) {
      console.error("Languages fetch error:", fetchError);
      return { success: false, error: "Failed to fetch languages" };
    }

    return { success: true, data: languages || [] };
  } catch (error) {
    console.error("Unexpected error in getLanguages:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Create new language for current user
 */
export async function createLanguage(
  data: LanguageInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validate input
    const validated = languageSchema.safeParse(data);
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

    // Check for duplicate language
    const { data: existingLanguage, error: checkError } = await supabase
      .from("cv_languages")
      .select("id")
      .eq("user_id", user.id)
      .eq("language_name", validated.data.language_name)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking for duplicate language:", checkError);
      return { success: false, error: "Failed to create language" };
    }

    if (existingLanguage) {
      return {
        success: false,
        error: "This language is already in your profile",
      };
    }

    // Get current max display_order
    const { data: existingLanguages, error: fetchError } = await supabase
      .from("cv_languages")
      .select("display_order")
      .eq("user_id", user.id)
      .order("display_order", { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error("Error fetching existing languages:", fetchError);
      return { success: false, error: "Failed to create language" };
    }

    const nextOrder =
      existingLanguages && existingLanguages.length > 0 && existingLanguages[0].display_order !== null
        ? existingLanguages[0].display_order + 1
        : 0;

    // Create language
    const { data: language, error: insertError } = await supabase
      .from("cv_languages")
      .insert({
        user_id: user.id,
        language_name: validated.data.language_name,
        proficiency: validated.data.proficiency,
        display_order: nextOrder,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Language insert error:", insertError);
      return { success: false, error: "Failed to create language" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");

    return { success: true, data: { id: language.id } };
  } catch (error) {
    console.error("Unexpected error in createLanguage:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update existing language
 */
export async function updateLanguage(
  id: string,
  data: LanguageInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validate ID
    if (!id) {
      return { success: false, error: "Language ID is required" };
    }

    // Validate input
    const validated = languageSchema.safeParse(data);
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

    // Check for duplicate language (excluding current language being updated)
    const { data: existingLanguage, error: checkError } = await supabase
      .from("cv_languages")
      .select("id")
      .eq("user_id", user.id)
      .eq("language_name", validated.data.language_name)
      .neq("id", id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking for duplicate language:", checkError);
      return { success: false, error: "Failed to update language" };
    }

    if (existingLanguage) {
      return {
        success: false,
        error: "This language is already in your profile",
      };
    }

    // Update language (RLS ensures user can only update their own languages)
    const { error: updateError } = await supabase
      .from("cv_languages")
      .update({
        language_name: validated.data.language_name,
        proficiency: validated.data.proficiency,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Language update error:", updateError);
      return { success: false, error: "Failed to update language" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("Unexpected error in updateLanguage:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete language
 */
export async function deleteLanguage(
  id: string,
): Promise<ActionResult<{ success: true }>> {
  try {
    // Validate ID
    if (!id) {
      return { success: false, error: "Language ID is required" };
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

    // Delete language (RLS ensures user can only delete their own languages)
    const { error: deleteError } = await supabase
      .from("cv_languages")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Language delete error:", deleteError);
      return { success: false, error: "Failed to delete language" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("Unexpected error in deleteLanguage:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Reorder languages by updating display_order
 * @param orderedIds - Array of language IDs in the desired order
 */
export async function reorderLanguages(
  orderedIds: string[],
): Promise<ActionResult<{ success: true }>> {
  try {
    // Validate input
    if (!orderedIds || orderedIds.length === 0) {
      return { success: false, error: "No languages to reorder" };
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
    const { data: existingLanguages, error: fetchError } = await supabase
      .from("cv_languages")
      .select("id")
      .eq("user_id", user.id)
      .in("id", orderedIds);

    if (fetchError) {
      console.error("Error fetching languages for reorder:", fetchError);
      return { success: false, error: "Failed to reorder languages" };
    }

    if (existingLanguages.length !== orderedIds.length) {
      return {
        success: false,
        error: "Some languages do not exist or do not belong to you",
      };
    }

    // Update display_order for each language
    const updates = orderedIds.map((id, index) => {
      return supabase
        .from("cv_languages")
        .update({ display_order: index })
        .eq("id", id)
        .eq("user_id", user.id);
    });

    // Execute all updates in parallel
    const results = await Promise.all(updates);

    // Check for any errors
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      console.error("Language reorder errors:", errors);
      return { success: false, error: "Failed to reorder languages" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("Unexpected error in reorderLanguages:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
