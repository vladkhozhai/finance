/**
 * Transaction Validation Schemas
 *
 * Zod schemas for validating transaction-related inputs.
 */

import { z } from "zod";
import { dateStringSchema, positiveAmountSchema, uuidSchema } from "./shared";

/**
 * Transaction type enum.
 */
export const transactionTypeSchema = z.enum(["income", "expense"]);

export type TransactionType = z.infer<typeof transactionTypeSchema>;

/**
 * Schema for creating a new transaction.
 * Multi-currency support with automatic payment method resolution.
 *
 * Note: paymentMethodId is optional in the API but transactions always get assigned
 * a payment method. If not provided, the server action will auto-select or auto-create
 * a default payment method. This provides better UX while maintaining data integrity.
 *
 * See: createTransaction() in transactions.ts for payment method resolution logic.
 */
export const createTransactionSchema = z
  .object({
    amount: positiveAmountSchema,
    type: transactionTypeSchema,
    categoryId: uuidSchema,
    date: dateStringSchema,
    description: z
      .string()
      .max(500, "Description must be 500 characters or less")
      .trim()
      .optional(),
    tagIds: z.array(uuidSchema).optional(),
    // Multi-currency fields - paymentMethodId is optional for backward compatibility
    paymentMethodId: uuidSchema.optional(), // Optional - uses default payment method if not provided
    manualExchangeRate: z
      .number()
      .positive("Exchange rate must be positive")
      .optional(),
  })
  .refine(
    (data) => {
      // If paymentMethodId provided, amount represents native amount
      // Backend will handle conversion to base currency
      return true;
    },
    { message: "Invalid transaction data" },
  );

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

/**
 * Schema for updating an existing transaction.
 * Multi-currency fields are generally not editable directly - changing amount
 * on multi-currency transactions will recalculate exchange rate.
 */
export const updateTransactionSchema = z.object({
  id: uuidSchema,
  amount: positiveAmountSchema.optional(),
  type: transactionTypeSchema.optional(),
  categoryId: uuidSchema.optional(),
  date: dateStringSchema.optional(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .trim()
    .optional()
    .nullable(),
  tagIds: z.array(uuidSchema).optional(),
  // Multi-currency fields (optional for updates)
  paymentMethodId: uuidSchema.optional(),
  manualExchangeRate: z
    .number()
    .positive("Exchange rate must be positive")
    .optional(),
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

/**
 * Schema for deleting a transaction.
 */
export const deleteTransactionSchema = z.object({
  id: uuidSchema,
});

export type DeleteTransactionInput = z.infer<typeof deleteTransactionSchema>;

/**
 * Schema for filtering transactions.
 * Supports filtering by payment method for multi-currency queries.
 */
export const getTransactionsFilterSchema = z.object({
  type: transactionTypeSchema.optional(),
  categoryId: uuidSchema.optional(),
  paymentMethodId: uuidSchema.optional(),
  tagIds: z.array(uuidSchema).optional(),
  dateFrom: dateStringSchema.optional(),
  dateTo: dateStringSchema.optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export type GetTransactionsFilter = z.infer<typeof getTransactionsFilterSchema>;
