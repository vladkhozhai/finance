"use server";

/**
 * Category Server Actions
 *
 * Server-side logic for category-related operations.
 * All functions are async and can be called from Client Components.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  type CreateCategoryInput,
  createCategorySchema,
  type DeleteCategoryInput,
  deleteCategorySchema,
  type UpdateCategoryInput,
  updateCategorySchema,
} from "@/lib/validations/category";
import { type ActionResult, error, success } from "@/lib/validations/shared";
import type { Tables } from "@/types/database.types";

// Type alias for Category row
type Category = Tables<"categories">;

/**
 * Fetches all categories for the current user.
 * Optionally filters by category type (expense or income).
 *
 * @param type - Optional filter by category type
 * @returns ActionResult with array of categories
 */
export async function getCategories(
  type?: "expense" | "income",
): Promise<ActionResult<Category[]>> {
  try {
    // 1. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized. Please log in to view categories.");
    }

    // 2. Build query
    let query = supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // 3. Apply type filter if provided
    if (type) {
      query = query.eq("type", type);
    }

    // 4. Execute query
    const { data: categories, error: fetchError } = await query;

    if (fetchError) {
      console.error("Categories fetch error:", fetchError);
      return error("Failed to fetch categories. Please try again.");
    }

    return success(categories || []);
  } catch (err) {
    console.error("Unexpected error in getCategories:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Fetches a single category by ID.
 * Verifies the user owns the category (RLS handles this).
 *
 * @param id - Category ID to fetch
 * @returns ActionResult with category object or null if not found
 */
export async function getCategoryById(
  id: string,
): Promise<ActionResult<Category | null>> {
  try {
    // 1. Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return error("Invalid category ID format.");
    }

    // 2. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized. Please log in to view category details.");
    }

    // 3. Fetch category (RLS ensures user can only see their own)
    const { data: category, error: fetchError } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      // Check if it's a "not found" error
      if (fetchError.code === "PGRST116") {
        return success(null);
      }
      console.error("Category fetch error:", fetchError);
      return error("Failed to fetch category. Please try again.");
    }

    return success(category);
  } catch (err) {
    console.error("Unexpected error in getCategoryById:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Creates a new category.
 *
 * @param input - Category data to create
 * @returns ActionResult with created category ID
 */
export async function createCategory(
  input: CreateCategoryInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // 1. Validate input
    const validated = createCategorySchema.safeParse(input);
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
      return error("Unauthorized. Please log in to create categories.");
    }

    // 3. Check if category name already exists for this user
    const { data: existingCategory } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", validated.data.name)
      .single();

    if (existingCategory) {
      return error("A category with this name already exists.");
    }

    // 4. Insert category
    const { data: category, error: insertError } = await supabase
      .from("categories")
      .insert({
        user_id: user.id,
        name: validated.data.name,
        color: validated.data.color,
        type: validated.data.type,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Category insert error:", insertError);
      return error("Failed to create category. Please try again.");
    }

    // 5. Revalidate affected paths
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    revalidatePath("/transactions");

    return success({ id: category.id });
  } catch (err) {
    console.error("Unexpected error in createCategory:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Updates an existing category.
 *
 * @param input - Category data to update
 * @returns ActionResult with success status
 */
export async function updateCategory(
  input: UpdateCategoryInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // 1. Validate input
    const validated = updateCategorySchema.safeParse(input);
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
      return error("Unauthorized. Please log in to update categories.");
    }

    // 3. If updating name, check for duplicates
    if (validated.data.name) {
      const { data: existingCategory } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", validated.data.name)
        .neq("id", validated.data.id)
        .single();

      if (existingCategory) {
        return error("A category with this name already exists.");
      }
    }

    // 4. Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {};
    if (validated.data.name !== undefined)
      updateData.name = validated.data.name;
    if (validated.data.color !== undefined)
      updateData.color = validated.data.color;
    if (validated.data.type !== undefined)
      updateData.type = validated.data.type;

    // 5. Update category (RLS ensures user can only update their own)
    const { error: updateError } = await supabase
      .from("categories")
      .update(updateData)
      .eq("id", validated.data.id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Category update error:", updateError);
      return error("Failed to update category. Please try again.");
    }

    // 6. Revalidate affected paths
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    revalidatePath("/transactions");

    return success({ id: validated.data.id });
  } catch (err) {
    console.error("Unexpected error in updateCategory:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Deletes a category.
 *
 * @param input - Category ID to delete
 * @returns ActionResult with success status
 */
export async function deleteCategory(
  input: DeleteCategoryInput,
): Promise<ActionResult<void>> {
  try {
    // 1. Validate input
    const validated = deleteCategorySchema.safeParse(input);
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
      return error("Unauthorized. Please log in to delete categories.");
    }

    // 3. Check if category is used in transactions
    const { data: transactionsUsingCategory } = await supabase
      .from("transactions")
      .select("id")
      .eq("category_id", validated.data.id)
      .limit(1)
      .single();

    if (transactionsUsingCategory) {
      return error(
        "Cannot delete category that is used in transactions. Please reassign transactions first.",
      );
    }

    // 4. Check if category is used in budgets
    const { data: budgetsUsingCategory } = await supabase
      .from("budgets")
      .select("id")
      .eq("category_id", validated.data.id)
      .limit(1)
      .single();

    if (budgetsUsingCategory) {
      return error(
        "Cannot delete category that is used in budgets. Please delete related budgets first.",
      );
    }

    // 5. Delete category
    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", validated.data.id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Category delete error:", deleteError);
      return error("Failed to delete category. Please try again.");
    }

    // 6. Revalidate affected paths
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    revalidatePath("/transactions");

    return success(undefined);
  } catch (err) {
    console.error("Unexpected error in deleteCategory:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}
