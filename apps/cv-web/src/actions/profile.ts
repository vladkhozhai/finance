/**
 * Profile Server Actions
 *
 * Handles user profile operations (get, update, photo upload/delete).
 * Uses Supabase for database operations and storage for profile photos.
 *
 * @see https://supabase.com/docs/guides/storage
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Get current user's profile
 */
export async function getProfile(): Promise<
  ActionResult<{
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
  }>
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

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from("cv_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return { success: false, error: "Failed to fetch profile" };
    }

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    return { success: true, data: profile };
  } catch (error) {
    console.error("Unexpected error in getProfile:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update current user's profile
 */
export async function updateProfile(
  data: ProfileInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validate input
    const validated = profileSchema.safeParse(data);
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

    // Update profile
    const { error: updateError } = await supabase
      .from("cv_profiles")
      .update({
        ...validated.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return { success: false, error: "Failed to update profile" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return { success: true, data: { id: user.id } };
  } catch (error) {
    console.error("Unexpected error in updateProfile:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Upload profile photo to Supabase Storage
 */
export async function uploadProfilePhoto(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
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

    // Extract file from FormData
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Please upload a JPEG, PNG, or WebP image.",
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: "File size too large. Maximum size is 5MB.",
      };
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `profile-photos/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("cv-uploads")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Photo upload error:", uploadError);
      return { success: false, error: "Failed to upload photo" };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("cv-uploads").getPublicUrl(filePath);

    // Update profile with new photo URL
    const { error: updateError } = await supabase
      .from("cv_profiles")
      .update({
        profile_photo_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile photo URL update error:", updateError);
      // Clean up uploaded file
      await supabase.storage.from("cv-uploads").remove([filePath]);
      return { success: false, error: "Failed to update profile photo" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return { success: true, data: { url: publicUrl } };
  } catch (error) {
    console.error("Unexpected error in uploadProfilePhoto:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete profile photo from Supabase Storage and profile record
 */
export async function deleteProfilePhoto(): Promise<
  ActionResult<{ success: true }>
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

    // Get current profile to find photo URL
    const { data: profile, error: profileError } = await supabase
      .from("cv_profiles")
      .select("profile_photo_url")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return { success: false, error: "Failed to fetch profile" };
    }

    // Extract file path from URL if photo exists
    if (profile.profile_photo_url) {
      try {
        const url = new URL(profile.profile_photo_url);
        const pathMatch = url.pathname.match(/\/cv-uploads\/(.+)$/);
        if (pathMatch) {
          const filePath = pathMatch[1];
          // Delete from storage (don't fail if file doesn't exist)
          await supabase.storage.from("cv-uploads").remove([filePath]);
        }
      } catch (error) {
        console.error("Error parsing photo URL:", error);
        // Continue to update profile even if file deletion fails
      }
    }

    // Update profile to remove photo URL
    const { error: updateError } = await supabase
      .from("cv_profiles")
      .update({
        profile_photo_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile photo removal error:", updateError);
      return { success: false, error: "Failed to remove profile photo" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("Unexpected error in deleteProfilePhoto:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
