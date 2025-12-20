/**
 * Shared Validation Utilities
 *
 * Common Zod schemas and validation helpers used across the application.
 */

import { z } from "zod";

/**
 * UUID validation schema.
 */
export const uuidSchema = z.string().uuid("Invalid UUID format");

/**
 * Date string validation (YYYY-MM-DD format).
 */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

/**
 * Positive amount validation.
 */
export const positiveAmountSchema = z
  .number()
  .positive("Amount must be positive")
  .finite("Amount must be a finite number");

/**
 * Currency code validation (ISO 4217).
 */
export const currencySchema = z
  .string()
  .length(3, "Currency must be a 3-letter code")
  .regex(/^[A-Z]{3}$/, "Currency must be uppercase letters (e.g., USD, EUR)")
  .default("USD");

/**
 * Hex color validation.
 */
export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex code (e.g., #FF5733)");

/**
 * Standard result type for Server Actions.
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Helper to create a success result.
 */
export function success<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

/**
 * Helper to create an error result.
 */
export function error<T>(message: string): ActionResult<T> {
  return { success: false, error: message };
}

/**
 * Pagination schema for list queries.
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;
