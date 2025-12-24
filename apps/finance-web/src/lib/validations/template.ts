/**
 * Transaction Template Validation Schemas
 *
 * Zod schemas for validating transaction template-related inputs.
 */

import { z } from "zod";
import { dateStringSchema, positiveAmountSchema, uuidSchema } from "./shared";

/**
 * Schema for creating a new transaction template.
 * Templates can have fixed amounts (set amount) or variable amounts (null amount).
 * Variable-price templates require the user to enter an amount when creating a transaction.
 */
export const createTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(100, "Template name must be 100 characters or less")
    .trim(),
  amount: positiveAmountSchema.optional().nullable(),
  categoryId: uuidSchema.optional().nullable(),
  paymentMethodId: uuidSchema.optional().nullable(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .trim()
    .optional()
    .nullable(),
  isFavorite: z.boolean().optional().default(false),
  tagIds: z.array(uuidSchema).optional().default([]),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

/**
 * Schema for updating an existing transaction template.
 * All fields are optional (partial update).
 */
export const updateTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(100, "Template name must be 100 characters or less")
    .trim()
    .optional(),
  amount: positiveAmountSchema.optional().nullable(),
  categoryId: uuidSchema.optional().nullable(),
  paymentMethodId: uuidSchema.optional().nullable(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .trim()
    .optional()
    .nullable(),
  isFavorite: z.boolean().optional(),
  tagIds: z.array(uuidSchema).optional(),
});

export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

/**
 * Schema for deleting a transaction template.
 */
export const deleteTemplateSchema = z.object({
  id: uuidSchema,
});

export type DeleteTemplateInput = z.infer<typeof deleteTemplateSchema>;

/**
 * Schema for toggling template favorite status.
 */
export const toggleFavoriteSchema = z.object({
  id: uuidSchema,
});

export type ToggleFavoriteInput = z.infer<typeof toggleFavoriteSchema>;

/**
 * Schema for filtering transaction templates.
 */
export const getTemplatesFilterSchema = z.object({
  favoritesOnly: z.boolean().optional().default(false),
  categoryId: uuidSchema.optional(),
  paymentMethodId: uuidSchema.optional(),
});

export type GetTemplatesFilter = z.infer<typeof getTemplatesFilterSchema>;

/**
 * Schema for transaction overrides when creating from template.
 * Used for variable-price templates or to override date/description.
 *
 * For variable-price templates (template.amount = NULL):
 *   - amount is REQUIRED
 *   - date and description are optional overrides
 *
 * For fixed-price templates (template.amount is set):
 *   - amount override is ignored (uses template amount)
 *   - date and description are optional overrides
 */
export const transactionOverridesSchema = z.object({
  amount: positiveAmountSchema.optional(),
  date: dateStringSchema.optional(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .trim()
    .optional(),
});

export type TransactionOverrides = z.infer<typeof transactionOverridesSchema>;
