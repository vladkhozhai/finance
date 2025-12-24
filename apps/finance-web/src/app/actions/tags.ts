"use server";

/**
 * Tag Server Actions
 *
 * Server-side logic for tag-related operations.
 * All functions are async and can be called from Client Components.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult, error, success } from "@/lib/validations/shared";
import {
  type CreateTagInput,
  createTagSchema,
  type DeleteTagInput,
  deleteTagSchema,
  type UpdateTagInput,
  updateTagSchema,
} from "@/lib/validations/tag";
import type { Tables } from "@/types/database.types";

// Type alias for Tag row
type Tag = Tables<"tags">;

/**
 * Fetches all tags for the current user.
 * Sorted alphabetically by name.
 *
 * @returns ActionResult with array of tags
 */
export async function getTags(): Promise<ActionResult<Tag[]>> {
  try {
    // 1. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized. Please log in to view tags.");
    }

    // 2. Fetch tags sorted alphabetically
    const { data: tags, error: fetchError } = await supabase
      .from("tags")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    if (fetchError) {
      console.error("Tags fetch error:", fetchError);
      return error("Failed to fetch tags. Please try again.");
    }

    return success(tags || []);
  } catch (err) {
    console.error("Unexpected error in getTags:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Fetches a single tag by ID.
 * Verifies the user owns the tag (RLS handles this).
 *
 * @param id - Tag ID to fetch
 * @returns ActionResult with tag object or null if not found
 */
export async function getTagById(
  id: string,
): Promise<ActionResult<Tag | null>> {
  try {
    // 1. Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return error("Invalid tag ID format.");
    }

    // 2. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized. Please log in to view tag details.");
    }

    // 3. Fetch tag (RLS ensures user can only see their own)
    const { data: tag, error: fetchError } = await supabase
      .from("tags")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      // Check if it's a "not found" error
      if (fetchError.code === "PGRST116") {
        return success(null);
      }
      console.error("Tag fetch error:", fetchError);
      return error("Failed to fetch tag. Please try again.");
    }

    return success(tag);
  } catch (err) {
    console.error("Unexpected error in getTagById:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Creates a new tag or returns existing tag with the same name.
 * This allows for flexible tag creation on-the-fly during transaction creation.
 *
 * @param input - Tag data to create
 * @returns ActionResult with created or existing tag ID
 */
export async function createTag(
  input: CreateTagInput,
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    // 1. Validate input
    const validated = createTagSchema.safeParse(input);
    if (!validated.success) {
      return error(validated.error.issues[0].message);
    }

    // 2. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized. Please log in to create tags.");
    }

    // 3. Check if tag already exists for this user (case-insensitive)
    const { data: existingTag } = await supabase
      .from("tags")
      .select("id, name")
      .eq("user_id", user.id)
      .eq("name", validated.data.name)
      .single();

    if (existingTag) {
      // Return existing tag instead of creating a duplicate
      return success({ id: existingTag.id, name: existingTag.name });
    }

    // 4. Insert tag
    const { data: tag, error: insertError } = await supabase
      .from("tags")
      .insert({
        user_id: user.id,
        name: validated.data.name,
      })
      .select("id, name")
      .single();

    if (insertError) {
      console.error("Tag insert error:", insertError);
      return error("Failed to create tag. Please try again.");
    }

    // 5. Revalidate affected paths
    revalidatePath("/dashboard");
    revalidatePath("/tags");
    revalidatePath("/transactions");

    return success({ id: tag.id, name: tag.name });
  } catch (err) {
    console.error("Unexpected error in createTag:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Updates an existing tag.
 *
 * @param input - Tag data to update
 * @returns ActionResult with success status
 */
export async function updateTag(
  input: UpdateTagInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // 1. Validate input
    const validated = updateTagSchema.safeParse(input);
    if (!validated.success) {
      return error(validated.error.issues[0].message);
    }

    // 2. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized. Please log in to update tags.");
    }

    // 3. If updating name, check for duplicates
    if (validated.data.name) {
      const { data: existingTag } = await supabase
        .from("tags")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", validated.data.name)
        .neq("id", validated.data.id)
        .single();

      if (existingTag) {
        return error("A tag with this name already exists.");
      }
    }

    // 4. Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {};
    if (validated.data.name !== undefined)
      updateData.name = validated.data.name;

    // 5. Update tag (RLS ensures user can only update their own)
    const { error: updateError } = await supabase
      .from("tags")
      .update(updateData)
      .eq("id", validated.data.id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Tag update error:", updateError);
      return error("Failed to update tag. Please try again.");
    }

    // 6. Revalidate affected paths
    revalidatePath("/dashboard");
    revalidatePath("/tags");
    revalidatePath("/transactions");

    return success({ id: validated.data.id });
  } catch (err) {
    console.error("Unexpected error in updateTag:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Deletes a tag and all its associations with transactions.
 *
 * @param input - Tag ID to delete
 * @returns ActionResult with success status
 */
export async function deleteTag(
  input: DeleteTagInput,
): Promise<ActionResult<void>> {
  try {
    // 1. Validate input
    const validated = deleteTagSchema.safeParse(input);
    if (!validated.success) {
      return error(validated.error.issues[0].message);
    }

    // 2. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized. Please log in to delete tags.");
    }

    // 3. Check if tag is used in budgets
    const { data: budgetsUsingTag } = await supabase
      .from("budgets")
      .select("id")
      .eq("tag_id", validated.data.id)
      .limit(1)
      .single();

    if (budgetsUsingTag) {
      return error(
        "Cannot delete tag that is used in budgets. Please delete related budgets first.",
      );
    }

    // 4. Delete tag (cascade will handle transaction_tags associations)
    const { error: deleteError } = await supabase
      .from("tags")
      .delete()
      .eq("id", validated.data.id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Tag delete error:", deleteError);
      return error("Failed to delete tag. Please try again.");
    }

    // 5. Revalidate affected paths
    revalidatePath("/dashboard");
    revalidatePath("/tags");
    revalidatePath("/transactions");

    return success(undefined);
  } catch (err) {
    console.error("Unexpected error in deleteTag:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}
