/**
 * Certifications Server Actions
 *
 * Handles certification operations (get, create, update, delete, reorder).
 * Certifications are ordered by display_order for user-controlled sorting.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  certificationSchema,
  type CertificationInput,
} from "@/lib/validations/profile";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface Certification {
  id: string;
  user_id: string;
  certification_name: string;
  issuing_organization: string;
  issue_date: string;
  expiration_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
  display_order: number | null;
  created_at: string;
}

/**
 * Get current user's certifications ordered by display_order, then issue_date desc
 */
export async function getCertifications(): Promise<
  ActionResult<Certification[]>
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

    // Fetch certifications
    const { data: certifications, error: fetchError } = await supabase
      .from("cv_certifications")
      .select("*")
      .eq("user_id", user.id)
      .order("display_order", { ascending: true })
      .order("issue_date", { ascending: false });

    if (fetchError) {
      console.error("Certifications fetch error:", fetchError);
      return { success: false, error: "Failed to fetch certifications" };
    }

    return { success: true, data: certifications || [] };
  } catch (error) {
    console.error("Unexpected error in getCertifications:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Create new certification for current user
 */
export async function createCertification(
  data: CertificationInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validate input
    const validated = certificationSchema.safeParse(data);
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

    // Validate business rules (only if expiration date is provided and not empty)
    if (validated.data.expiration_date && validated.data.expiration_date !== "") {
      const issueDate = new Date(validated.data.issue_date);
      const expirationDate = new Date(validated.data.expiration_date);

      if (expirationDate <= issueDate) {
        return {
          success: false,
          error: "Expiration date must be after issue date",
        };
      }
    }

    // Get current max display_order
    const { data: existingCertifications, error: fetchError } = await supabase
      .from("cv_certifications")
      .select("display_order")
      .eq("user_id", user.id)
      .order("display_order", { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error("Error fetching existing certifications:", fetchError);
      return { success: false, error: "Failed to create certification" };
    }

    const nextOrder =
      existingCertifications &&
      existingCertifications.length > 0 &&
      existingCertifications[0].display_order !== null
        ? existingCertifications[0].display_order + 1
        : 0;

    // Normalize empty strings to null for optional fields
    const credentialUrl =
      validated.data.credential_url === ""
        ? null
        : validated.data.credential_url;
    const expirationDate =
      validated.data.expiration_date === ""
        ? null
        : validated.data.expiration_date;
    const credentialId =
      validated.data.credential_id === ""
        ? null
        : validated.data.credential_id;

    // Create certification
    const { data: certification, error: insertError } = await supabase
      .from("cv_certifications")
      .insert({
        user_id: user.id,
        certification_name: validated.data.certification_name,
        issuing_organization: validated.data.issuing_organization,
        issue_date: validated.data.issue_date,
        expiration_date: expirationDate,
        credential_id: credentialId,
        credential_url: credentialUrl,
        display_order: nextOrder,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Certification insert error:", insertError);
      return { success: false, error: "Failed to create certification" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");

    return { success: true, data: { id: certification.id } };
  } catch (error) {
    console.error("Unexpected error in createCertification:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update existing certification
 */
export async function updateCertification(
  id: string,
  data: CertificationInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validate ID
    if (!id) {
      return { success: false, error: "Certification ID is required" };
    }

    // Validate input
    const validated = certificationSchema.safeParse(data);
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

    // Validate business rules (only if expiration date is provided and not empty)
    if (validated.data.expiration_date && validated.data.expiration_date !== "") {
      const issueDate = new Date(validated.data.issue_date);
      const expirationDate = new Date(validated.data.expiration_date);

      if (expirationDate <= issueDate) {
        return {
          success: false,
          error: "Expiration date must be after issue date",
        };
      }
    }

    // Normalize empty strings to null for optional fields
    const credentialUrl =
      validated.data.credential_url === ""
        ? null
        : validated.data.credential_url;
    const expirationDate =
      validated.data.expiration_date === ""
        ? null
        : validated.data.expiration_date;
    const credentialId =
      validated.data.credential_id === ""
        ? null
        : validated.data.credential_id;

    // Update certification (RLS ensures user can only update their own certifications)
    const { error: updateError } = await supabase
      .from("cv_certifications")
      .update({
        certification_name: validated.data.certification_name,
        issuing_organization: validated.data.issuing_organization,
        issue_date: validated.data.issue_date,
        expiration_date: expirationDate,
        credential_id: credentialId,
        credential_url: credentialUrl,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Certification update error:", updateError);
      return { success: false, error: "Failed to update certification" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("Unexpected error in updateCertification:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete certification
 */
export async function deleteCertification(
  id: string,
): Promise<ActionResult<{ success: true }>> {
  try {
    // Validate ID
    if (!id) {
      return { success: false, error: "Certification ID is required" };
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

    // Delete certification (RLS ensures user can only delete their own certifications)
    const { error: deleteError } = await supabase
      .from("cv_certifications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Certification delete error:", deleteError);
      return { success: false, error: "Failed to delete certification" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("Unexpected error in deleteCertification:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Reorder certifications by updating display_order
 * @param orderedIds - Array of certification IDs in the desired order
 */
export async function reorderCertifications(
  orderedIds: string[],
): Promise<ActionResult<{ success: true }>> {
  try {
    // Validate input
    if (!orderedIds || orderedIds.length === 0) {
      return { success: false, error: "No certifications to reorder" };
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
    const { data: existingCertifications, error: fetchError } = await supabase
      .from("cv_certifications")
      .select("id")
      .eq("user_id", user.id)
      .in("id", orderedIds);

    if (fetchError) {
      console.error("Error fetching certifications for reorder:", fetchError);
      return { success: false, error: "Failed to reorder certifications" };
    }

    if (existingCertifications.length !== orderedIds.length) {
      return {
        success: false,
        error: "Some certifications do not exist or do not belong to you",
      };
    }

    // Update display_order for each certification
    const updates = orderedIds.map((id, index) => {
      return supabase
        .from("cv_certifications")
        .update({ display_order: index })
        .eq("id", id)
        .eq("user_id", user.id);
    });

    // Execute all updates in parallel
    const results = await Promise.all(updates);

    // Check for any errors
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      console.error("Certification reorder errors:", errors);
      return { success: false, error: "Failed to reorder certifications" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("Unexpected error in reorderCertifications:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
