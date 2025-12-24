/**
 * Budget Validation Schemas
 *
 * Zod schemas for validating budget-related inputs.
 */

import { z } from "zod";
import { positiveAmountSchema, uuidSchema } from "./shared";

/**
 * Period schema - must be first day of month (YYYY-MM-01 format).
 * The database stores this as DATE type and enforces first-day constraint.
 */
export const periodSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-01$/,
    "Period must be the first day of a month (YYYY-MM-01 format)",
  );

/**
 * Month string schema for filtering (YYYY-MM format).
 */
export const monthStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format");

/**
 * Schema for creating a new budget.
 * Must have either categoryId OR tagId, but not both.
 */
export const createBudgetSchema = z
  .object({
    amount: positiveAmountSchema,
    period: periodSchema,
    categoryId: uuidSchema.optional(),
    tagId: uuidSchema.optional(),
  })
  .refine(
    (data) => {
      // Exactly one of categoryId or tagId must be set
      const hasCategoryId = !!data.categoryId;
      const hasTagId = !!data.tagId;
      return (hasCategoryId && !hasTagId) || (!hasCategoryId && hasTagId);
    },
    {
      message: "Budget must have either a categoryId OR a tagId, not both",
      path: ["categoryId"], // Show error on categoryId field
    },
  );

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;

/**
 * Schema for updating an existing budget.
 * Note: Category/tag cannot be changed (delete and recreate instead).
 */
export const updateBudgetSchema = z.object({
  id: uuidSchema,
  amount: positiveAmountSchema.optional(),
  period: periodSchema.optional(),
});

export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;

/**
 * Schema for deleting a budget.
 */
export const deleteBudgetSchema = z.object({
  id: uuidSchema,
});

export type DeleteBudgetInput = z.infer<typeof deleteBudgetSchema>;

/**
 * Schema for filtering budgets.
 * Empty strings for period/month are converted to undefined (no filter).
 */
export const budgetFiltersSchema = z.object({
  categoryId: uuidSchema.optional(),
  tagId: uuidSchema.optional(),
  period: z.preprocess(
    (val) => (val === "" ? undefined : val),
    periodSchema.optional(),
  ), // Specific month (YYYY-MM-01), empty string = no filter
  month: z.preprocess(
    (val) => (val === "" ? undefined : val),
    monthStringSchema.optional(),
  ), // Filter by month (YYYY-MM), empty string = no filter
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

export type BudgetFilters = z.infer<typeof budgetFiltersSchema>;

/**
 * Schema for getting budget by ID.
 */
export const getBudgetByIdSchema = z.object({
  id: uuidSchema,
});

export type GetBudgetByIdInput = z.infer<typeof getBudgetByIdSchema>;

/**
 * Schema for budget progress filters.
 * Empty strings for period/month are converted to undefined (defaults to current month).
 */
export const budgetProgressFiltersSchema = z.object({
  categoryId: uuidSchema.optional(),
  tagId: uuidSchema.optional(),
  period: z.preprocess(
    (val) => (val === "" ? undefined : val),
    periodSchema.optional(),
  ), // Default to current month, empty string = current month
  month: z.preprocess(
    (val) => (val === "" ? undefined : val),
    monthStringSchema.optional(),
  ), // Filter by month (YYYY-MM), empty string = current month
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

export type BudgetProgressFilters = z.infer<typeof budgetProgressFiltersSchema>;

/**
 * Schema for getting budget breakdown by payment method.
 */
export const getBudgetBreakdownSchema = z.object({
  budgetId: uuidSchema,
});

export type GetBudgetBreakdownInput = z.infer<typeof getBudgetBreakdownSchema>;
