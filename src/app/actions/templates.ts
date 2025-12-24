"use server";

/**
 * Transaction Templates Server Actions
 *
 * Server-side logic for transaction template operations.
 * Templates allow users to quickly create recurring transactions
 * with pre-filled category, payment method, and tags.
 *
 * Features:
 * - CRUD operations with atomic tag management
 * - Fixed-price and variable-price template support
 * - Favorite templates for quick access
 * - Create transactions from templates with overrides
 * - Full RLS security
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult, error, success } from "@/lib/validations/shared";
import {
  type CreateTemplateInput,
  createTemplateSchema,
  type DeleteTemplateInput,
  deleteTemplateSchema,
  type GetTemplatesFilter,
  getTemplatesFilterSchema,
  type ToggleFavoriteInput,
  type TransactionOverrides,
  toggleFavoriteSchema,
  transactionOverridesSchema,
  type UpdateTemplateInput,
  updateTemplateSchema,
} from "@/lib/validations/template";
import type { Tables } from "@/types/database.types";

// Type aliases for Template with relations
type Template = Tables<"transaction_templates">;
type Category = Tables<"categories">;
type Tag = Tables<"tags">;
type PaymentMethod = Tables<"payment_methods">;

export type TemplateWithRelations = Template & {
  category: Category | null;
  payment_method: PaymentMethod | null;
  template_tags: Array<{
    tag: Tag;
  }>;
};

/**
 * Fetches all templates for the authenticated user with filters.
 * Includes related category, payment method, and tags.
 *
 * @param filters - Optional filters (favorites only, category, etc.)
 * @returns ActionResult with array of templates sorted by favorites first, then by name
 */
export async function getTemplates(
  filters?: GetTemplatesFilter,
): Promise<ActionResult<TemplateWithRelations[]>> {
  try {
    // 1. Validate filters if provided
    const validated = filters
      ? getTemplatesFilterSchema.safeParse(filters)
      : { success: true as const, data: getTemplatesFilterSchema.parse({}) };

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
      return error("Unauthorized. Please log in to view templates.");
    }

    // 3. Build base query with relations
    let query = supabase
      .from("transaction_templates")
      .select(
        `
        *,
        category:categories(id, name, color, type),
        payment_method:payment_methods(id, name, currency, color),
        template_tags(
          tag:tags(id, name)
        )
      `,
      )
      .eq("user_id", user.id);

    // 4. Apply filters
    const { favoritesOnly, categoryId, paymentMethodId } = validated.data;

    if (favoritesOnly) {
      query = query.eq("is_favorite", true);
    }

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    if (paymentMethodId) {
      query = query.eq("payment_method_id", paymentMethodId);
    }

    // 5. Execute query with sorting (favorites first, then by name)
    query = query.order("is_favorite", { ascending: false }).order("name");

    const { data: templates, error: fetchError } = await query;

    if (fetchError) {
      console.error("Templates fetch error:", fetchError);
      return error("Failed to fetch templates. Please try again.");
    }

    return success((templates || []) as TemplateWithRelations[]);
  } catch (err) {
    console.error("Unexpected error in getTemplates:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Fetches a single template by ID with relations.
 *
 * @param templateId - Template ID to fetch
 * @returns ActionResult with template object or null if not found
 */
export async function getTemplateById(
  templateId: string,
): Promise<ActionResult<TemplateWithRelations | null>> {
  try {
    // 1. Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(templateId)) {
      return error("Invalid template ID format.");
    }

    // 2. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized. Please log in to view template details.");
    }

    // 3. Fetch template with relations (RLS ensures user can only see their own)
    const { data: template, error: fetchError } = await supabase
      .from("transaction_templates")
      .select(
        `
        *,
        category:categories(id, name, color, type),
        payment_method:payment_methods(id, name, currency, color),
        template_tags(
          tag:tags(id, name)
        )
      `,
      )
      .eq("id", templateId)
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      // Check if it's a "not found" error
      if (fetchError.code === "PGRST116") {
        return success(null);
      }
      console.error("Template fetch error:", fetchError);
      return error("Failed to fetch template. Please try again.");
    }

    return success(template as TemplateWithRelations);
  } catch (err) {
    console.error("Unexpected error in getTemplateById:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Creates a new transaction template with optional tags.
 *
 * @param input - Template data to create
 * @returns ActionResult with created template ID
 */
export async function createTemplate(
  input: CreateTemplateInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // 1. Sanitize input - convert "$undefined" strings to null
    // Frontend may send "$undefined" as string literal for optional fields
    const sanitizedInput = {
      ...input,
      categoryId:
        (input.categoryId as unknown) === "$undefined"
          ? null
          : input.categoryId,
      paymentMethodId:
        (input.paymentMethodId as unknown) === "$undefined"
          ? null
          : input.paymentMethodId,
      description:
        (input.description as unknown) === "$undefined"
          ? null
          : input.description,
      amount: (input.amount as unknown) === "$undefined" ? null : input.amount,
    };

    // 2. Validate input
    const validated = createTemplateSchema.safeParse(sanitizedInput);
    if (!validated.success) {
      return error(validated.error.issues[0].message);
    }

    // 3. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized. Please log in to create templates.");
    }

    // 4. Verify category exists and belongs to user (if provided)
    if (validated.data.categoryId) {
      const { data: categoryCheck, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .eq("id", validated.data.categoryId)
        .eq("user_id", user.id)
        .single();

      if (categoryError || !categoryCheck) {
        return error("Invalid category. Please select a valid category.");
      }
    }

    // 5. Verify payment method exists and belongs to user (if provided)
    if (validated.data.paymentMethodId) {
      const { data: paymentMethodCheck, error: paymentMethodError } =
        await supabase
          .from("payment_methods")
          .select("id")
          .eq("id", validated.data.paymentMethodId)
          .eq("user_id", user.id)
          .single();

      if (paymentMethodError || !paymentMethodCheck) {
        return error(
          "Invalid payment method. Please select a valid payment method.",
        );
      }
    }

    // 6. Verify tags exist and belong to user (if provided)
    if (validated.data.tagIds && validated.data.tagIds.length > 0) {
      const { data: tagsCheck, error: tagsError } = await supabase
        .from("tags")
        .select("id")
        .eq("user_id", user.id)
        .in("id", validated.data.tagIds);

      if (
        tagsError ||
        !tagsCheck ||
        tagsCheck.length !== validated.data.tagIds.length
      ) {
        return error("Invalid tags. Please select valid tags.");
      }
    }

    // 7. Insert template
    const { data: template, error: insertError } = await supabase
      .from("transaction_templates")
      .insert({
        user_id: user.id,
        name: validated.data.name,
        amount: validated.data.amount ?? null,
        category_id: validated.data.categoryId ?? null,
        payment_method_id: validated.data.paymentMethodId ?? null,
        description: validated.data.description ?? null,
        is_favorite: validated.data.isFavorite ?? false,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Template insert error:", insertError);
      return error("Failed to create template. Please try again.");
    }

    // 8. Handle tags if provided (atomic operation)
    if (validated.data.tagIds && validated.data.tagIds.length > 0) {
      const tagInserts = validated.data.tagIds.map((tagId) => ({
        template_id: template.id,
        tag_id: tagId,
      }));

      const { error: tagError } = await supabase
        .from("template_tags")
        .insert(tagInserts);

      if (tagError) {
        console.error("Template tag insert error:", tagError);
        // If tags fail, rollback template
        await supabase
          .from("transaction_templates")
          .delete()
          .eq("id", template.id);
        return error("Failed to assign tags to template. Please try again.");
      }
    }

    // 9. Revalidate affected paths
    revalidatePath("/templates");
    revalidatePath("/transactions");

    return success({ id: template.id });
  } catch (err) {
    console.error("Unexpected error in createTemplate:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Updates an existing transaction template.
 * Handles atomic tag updates (delete old, insert new).
 *
 * @param templateId - Template ID to update
 * @param input - Template data to update
 * @returns ActionResult with success status
 */
export async function updateTemplate(
  templateId: string,
  input: UpdateTemplateInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // 1. Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(templateId)) {
      return error("Invalid template ID format.");
    }

    // 2. Sanitize input - convert "$undefined" strings to null
    // Frontend may send "$undefined" as string literal for optional fields
    const sanitizedInput = { ...input };
    if ((input.categoryId as unknown) === "$undefined") {
      sanitizedInput.categoryId = null;
    }
    if ((input.paymentMethodId as unknown) === "$undefined") {
      sanitizedInput.paymentMethodId = null;
    }
    if ((input.description as unknown) === "$undefined") {
      sanitizedInput.description = null;
    }
    if ((input.amount as unknown) === "$undefined") {
      sanitizedInput.amount = null;
    }

    // 3. Validate input
    const validated = updateTemplateSchema.safeParse(sanitizedInput);
    if (!validated.success) {
      return error(validated.error.issues[0].message);
    }

    // 4. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized. Please log in to update templates.");
    }

    // 5. Verify template exists and belongs to user
    const { data: existingTemplate, error: fetchError } = await supabase
      .from("transaction_templates")
      .select("id")
      .eq("id", templateId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingTemplate) {
      return error(
        "Template not found or you do not have permission to update it.",
      );
    }

    // 6. Verify category exists and belongs to user (if updating category)
    if (validated.data.categoryId !== undefined) {
      if (validated.data.categoryId !== null) {
        const { data: categoryCheck, error: categoryError } = await supabase
          .from("categories")
          .select("id")
          .eq("id", validated.data.categoryId)
          .eq("user_id", user.id)
          .single();

        if (categoryError || !categoryCheck) {
          return error("Invalid category. Please select a valid category.");
        }
      }
    }

    // 7. Verify payment method exists and belongs to user (if updating payment method)
    if (validated.data.paymentMethodId !== undefined) {
      if (validated.data.paymentMethodId !== null) {
        const { data: paymentMethodCheck, error: paymentMethodError } =
          await supabase
            .from("payment_methods")
            .select("id")
            .eq("id", validated.data.paymentMethodId)
            .eq("user_id", user.id)
            .single();

        if (paymentMethodError || !paymentMethodCheck) {
          return error(
            "Invalid payment method. Please select a valid payment method.",
          );
        }
      }
    }

    // 8. Verify tags exist and belong to user (if updating tags)
    if (validated.data.tagIds && validated.data.tagIds.length > 0) {
      const { data: tagsCheck, error: tagsError } = await supabase
        .from("tags")
        .select("id")
        .eq("user_id", user.id)
        .in("id", validated.data.tagIds);

      if (
        tagsError ||
        !tagsCheck ||
        tagsCheck.length !== validated.data.tagIds.length
      ) {
        return error("Invalid tags. Please select valid tags.");
      }
    }

    // 9. Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {};
    if (validated.data.name !== undefined)
      updateData.name = validated.data.name;
    if (validated.data.amount !== undefined)
      updateData.amount = validated.data.amount;
    if (validated.data.categoryId !== undefined)
      updateData.category_id = validated.data.categoryId;
    if (validated.data.paymentMethodId !== undefined)
      updateData.payment_method_id = validated.data.paymentMethodId;
    if (validated.data.description !== undefined)
      updateData.description = validated.data.description;
    if (validated.data.isFavorite !== undefined)
      updateData.is_favorite = validated.data.isFavorite;

    // 10. Update template (RLS ensures user can only update their own)
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from("transaction_templates")
        .update(updateData)
        .eq("id", templateId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Template update error:", updateError);
        return error("Failed to update template. Please try again.");
      }
    }

    // 11. Handle tag updates if provided (atomic operation)
    if (validated.data.tagIds !== undefined) {
      // Delete existing tags
      const { error: deleteTagsError } = await supabase
        .from("template_tags")
        .delete()
        .eq("template_id", templateId);

      if (deleteTagsError) {
        console.error("Template tag delete error:", deleteTagsError);
        return error("Failed to update template tags. Please try again.");
      }

      // Insert new tags
      if (validated.data.tagIds.length > 0) {
        const tagInserts = validated.data.tagIds.map((tagId) => ({
          template_id: templateId,
          tag_id: tagId,
        }));

        const { error: tagInsertError } = await supabase
          .from("template_tags")
          .insert(tagInserts);

        if (tagInsertError) {
          console.error("Template tag insert error:", tagInsertError);
          return error("Failed to update template tags. Please try again.");
        }
      }
    }

    // 12. Revalidate affected paths
    revalidatePath("/templates");
    revalidatePath("/transactions");

    return success({ id: templateId });
  } catch (err) {
    console.error("Unexpected error in updateTemplate:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Deletes a transaction template.
 * Cascade deletion handles template_tags automatically via FK constraint.
 *
 * @param input - Template ID to delete
 * @returns ActionResult with success status
 */
export async function deleteTemplate(
  input: DeleteTemplateInput,
): Promise<ActionResult<void>> {
  try {
    // 1. Validate input
    const validated = deleteTemplateSchema.safeParse(input);
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
      return error("Unauthorized. Please log in to delete templates.");
    }

    // 3. Delete template (cascade will handle template_tags)
    const { error: deleteError } = await supabase
      .from("transaction_templates")
      .delete()
      .eq("id", validated.data.id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Template delete error:", deleteError);
      return error("Failed to delete template. Please try again.");
    }

    // 4. Revalidate affected paths
    revalidatePath("/templates");
    revalidatePath("/transactions");

    return success(undefined);
  } catch (err) {
    console.error("Unexpected error in deleteTemplate:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Toggles the favorite status of a template.
 *
 * @param input - Template ID to toggle favorite status
 * @returns ActionResult with new favorite status
 */
export async function toggleFavorite(
  input: ToggleFavoriteInput,
): Promise<ActionResult<{ isFavorite: boolean }>> {
  try {
    // 1. Validate input
    const validated = toggleFavoriteSchema.safeParse(input);
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
      return error("Unauthorized. Please log in to update templates.");
    }

    // 3. Fetch current favorite status
    const { data: currentTemplate, error: fetchError } = await supabase
      .from("transaction_templates")
      .select("is_favorite")
      .eq("id", validated.data.id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !currentTemplate) {
      return error(
        "Template not found or you do not have permission to update it.",
      );
    }

    // 4. Toggle favorite status
    const newFavoriteStatus = !currentTemplate.is_favorite;

    const { error: updateError } = await supabase
      .from("transaction_templates")
      .update({ is_favorite: newFavoriteStatus })
      .eq("id", validated.data.id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Template favorite toggle error:", updateError);
      return error("Failed to update template. Please try again.");
    }

    // 5. Revalidate affected paths
    revalidatePath("/templates");

    return success({ isFavorite: newFavoriteStatus });
  } catch (err) {
    console.error("Unexpected error in toggleFavorite:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Creates a transaction from a template with optional overrides.
 * Uses the database function create_transaction_from_template for atomic operation.
 *
 * Variable-price templates (amount = NULL):
 *   - User MUST provide amount in overrides
 *   - Optional date/description overrides
 *
 * Fixed-price templates (amount set):
 *   - Amount from template is used
 *   - Optional date/description overrides
 *   - Amount override is ignored (fixed price)
 *
 * @param templateId - Template ID to use
 * @param overrides - Optional overrides for amount (variable-price only), date, description
 * @returns ActionResult with created transaction ID
 */
export async function createTransactionFromTemplate(
  templateId: string,
  overrides?: TransactionOverrides,
): Promise<ActionResult<{ id: string }>> {
  try {
    // 1. Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(templateId)) {
      return error("Invalid template ID format.");
    }

    // 2. Validate overrides if provided
    const validatedOverrides = overrides
      ? transactionOverridesSchema.safeParse(overrides)
      : { success: true as const, data: {} };

    if (!validatedOverrides.success) {
      return error(validatedOverrides.error.issues[0].message);
    }

    // 3. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized. Please log in to create transactions.");
    }

    // 4. Call database function to create transaction from template
    // The function handles validation, amount resolution, and tag copying
    const { data: transactionId, error: createError } = await supabase.rpc(
      "create_transaction_from_template",
      {
        p_template_id: templateId,
        p_user_id: user.id,
        p_amount: validatedOverrides.data.amount,
        p_date: validatedOverrides.data.date,
        p_description: validatedOverrides.data.description,
      },
    );

    if (createError) {
      console.error("Transaction from template creation error:", createError);

      // Provide user-friendly error messages based on common failure cases
      if (createError.message.includes("Template not found")) {
        return error(
          "Template not found or you do not have permission to use it.",
        );
      }

      if (createError.message.includes("Amount is required")) {
        return error(
          "This template has variable pricing. Please provide an amount.",
        );
      }

      if (createError.message.includes("must have a category")) {
        return error(
          "This template is incomplete. Please add a category to the template before creating a transaction.",
        );
      }

      return error(
        "Failed to create transaction from template. Please try again.",
      );
    }

    // 5. Revalidate affected paths
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/budgets");

    return success({ id: transactionId });
  } catch (err) {
    console.error("Unexpected error in createTransactionFromTemplate:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Fetches only favorite templates for quick access.
 * Useful for displaying in dashboard quick-action widgets.
 *
 * @returns ActionResult with array of favorite templates sorted by name
 */
export async function getFavoriteTemplates(): Promise<
  ActionResult<TemplateWithRelations[]>
> {
  return getTemplates({ favoritesOnly: true });
}
