/**
 * Transfer Validation Schemas
 *
 * Zod schemas for validating transfer-related operations.
 * Transfers link two transactions (withdrawal + deposit) between payment methods.
 */

import { z } from "zod";
import { dateStringSchema, positiveAmountSchema, uuidSchema } from "./shared";

/**
 * Schema for creating a transfer between payment methods.
 *
 * Validation rules:
 * - Source and destination must be different payment methods
 * - Amount must be positive (negation happens server-side)
 * - Date must be valid (YYYY-MM-DD)
 * - Description is optional
 */
export const createTransferSchema = z
  .object({
    sourcePaymentMethodId: uuidSchema,
    destinationPaymentMethodId: uuidSchema,
    amount: positiveAmountSchema,
    date: dateStringSchema,
    description: z.string().max(500).optional(),
  })
  .refine(
    (data) => data.sourcePaymentMethodId !== data.destinationPaymentMethodId,
    {
      message: "Source and destination payment methods must be different",
      path: ["destinationPaymentMethodId"],
    },
  );

export type CreateTransferInput = z.infer<typeof createTransferSchema>;

/**
 * Schema for deleting a transfer.
 * Accepts either side's transaction ID.
 */
export const deleteTransferSchema = z.object({
  transactionId: uuidSchema,
});

export type DeleteTransferInput = z.infer<typeof deleteTransferSchema>;

/**
 * Schema for fetching a transfer by ID.
 * Accepts either side's transaction ID.
 */
export const getTransferByIdSchema = z.object({
  transactionId: uuidSchema,
});

export type GetTransferByIdInput = z.infer<typeof getTransferByIdSchema>;
