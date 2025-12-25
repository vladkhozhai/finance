/**
 * Social Links Server Actions
 *
 * Handles social link operations (get, create, update, delete).
 * Social links allow users to add professional profiles like LinkedIn, GitHub, etc.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  socialLinkSchema,
  type SocialLinkInput,
} from "@/lib/validations/profile";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface SocialLink {
  id: string;
  user_id: string;
  platform: string;
  url: string;
  display_order: number | null;
  created_at: string;
}

/**
 * Get current user's social links ordered by display_order
 */
export async function getSocialLinks(): Promise<ActionResult<SocialLink[]>> {
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

    // Fetch social links
    const { data: links, error: fetchError } = await supabase
      .from("cv_social_links")
      .select("*")
      .eq("user_id", user.id)
      .order("display_order", { ascending: true });

    if (fetchError) {
      console.error("Social links fetch error:", fetchError);
      return { success: false, error: "Failed to fetch social links" };
    }

    return { success: true, data: links || [] };
  } catch (error) {
    console.error("Unexpected error in getSocialLinks:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Create new social link for current user
 */
export async function createSocialLink(
  data: SocialLinkInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validate input
    const validated = socialLinkSchema.safeParse(data);
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

    // Get current max display_order
    const { data: existingLinks, error: fetchError } = await supabase
      .from("cv_social_links")
      .select("display_order")
      .eq("user_id", user.id)
      .order("display_order", { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error("Error fetching existing links:", fetchError);
      return { success: false, error: "Failed to create social link" };
    }

    const nextOrder =
      existingLinks && existingLinks.length > 0 && existingLinks[0].display_order !== null
        ? existingLinks[0].display_order + 1
        : 0;

    // Create social link
    const { data: link, error: insertError } = await supabase
      .from("cv_social_links")
      .insert({
        user_id: user.id,
        platform: validated.data.platform,
        url: validated.data.url,
        display_order: nextOrder,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Social link insert error:", insertError);
      return { success: false, error: "Failed to create social link" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return { success: true, data: { id: link.id } };
  } catch (error) {
    console.error("Unexpected error in createSocialLink:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update existing social link
 */
export async function updateSocialLink(
  id: string,
  data: SocialLinkInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validate ID
    if (!id) {
      return { success: false, error: "Social link ID is required" };
    }

    // Validate input
    const validated = socialLinkSchema.safeParse(data);
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

    // Update social link (RLS ensures user can only update their own links)
    const { error: updateError } = await supabase
      .from("cv_social_links")
      .update({
        platform: validated.data.platform,
        url: validated.data.url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Social link update error:", updateError);
      return { success: false, error: "Failed to update social link" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("Unexpected error in updateSocialLink:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete social link
 */
export async function deleteSocialLink(
  id: string,
): Promise<ActionResult<{ success: true }>> {
  try {
    // Validate ID
    if (!id) {
      return { success: false, error: "Social link ID is required" };
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

    // Delete social link (RLS ensures user can only delete their own links)
    const { error: deleteError } = await supabase
      .from("cv_social_links")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Social link delete error:", deleteError);
      return { success: false, error: "Failed to delete social link" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("Unexpected error in deleteSocialLink:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
