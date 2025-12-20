/**
 * Category Validation Schemas
 *
 * Zod schemas for validating category-related inputs.
 */

import { z } from "zod";
import { hexColorSchema, uuidSchema } from "./shared";

/**
 * Category type enum.
 */
export const categoryTypeSchema = z.enum(["expense", "income"]);

export type CategoryType = z.infer<typeof categoryTypeSchema>;

/**
 * Schema for creating a new category.
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(50, "Category name must be 50 characters or less")
    .trim(),
  color: hexColorSchema,
  type: categoryTypeSchema,
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

/**
 * Schema for updating an existing category.
 */
export const updateCategorySchema = z.object({
  id: uuidSchema,
  name: z
    .string()
    .min(1, "Category name is required")
    .max(50, "Category name must be 50 characters or less")
    .trim()
    .optional(),
  color: hexColorSchema.optional(),
  type: categoryTypeSchema.optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

/**
 * Schema for deleting a category.
 */
export const deleteCategorySchema = z.object({
  id: uuidSchema,
});

export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;
