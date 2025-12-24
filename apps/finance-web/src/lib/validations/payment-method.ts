/**
 * Payment Method Validation Schemas
 *
 * Zod schemas for validating payment method-related inputs.
 * Supports multi-currency tracking with ISO 4217 currency codes.
 */

import { z } from "zod";
import { hexColorSchema, uuidSchema } from "./shared";

/**
 * ISO 4217 Currency Codes (Common subset)
 * Full list: https://en.wikipedia.org/wiki/ISO_4217
 */
export const CURRENCY_CODES = [
  "USD", // United States Dollar
  "EUR", // Euro
  "UAH", // Ukrainian Hryvnia
  "GBP", // British Pound Sterling
  "JPY", // Japanese Yen
  "CNY", // Chinese Yuan
  "CHF", // Swiss Franc
  "CAD", // Canadian Dollar
  "AUD", // Australian Dollar
  "PLN", // Polish Złoty
  "CZK", // Czech Koruna
  "SEK", // Swedish Krona
  "NOK", // Norwegian Krone
  "DKK", // Danish Krone
  "HUF", // Hungarian Forint
  "RON", // Romanian Leu
  "BGN", // Bulgarian Lev
  "RUB", // Russian Ruble
  "TRY", // Turkish Lira
  "INR", // Indian Rupee
  "BRL", // Brazilian Real
  "MXN", // Mexican Peso
  "ZAR", // South African Rand
  "KRW", // South Korean Won
  "SGD", // Singapore Dollar
  "HKD", // Hong Kong Dollar
  "NZD", // New Zealand Dollar
  "THB", // Thai Baht
  "MYR", // Malaysian Ringgit
  "IDR", // Indonesian Rupiah
  "PHP", // Philippine Peso
  "VND", // Vietnamese Dong
  "AED", // UAE Dirham
  "SAR", // Saudi Riyal
  "ILS", // Israeli Shekel
  "EGP", // Egyptian Pound
  "KWD", // Kuwaiti Dinar
  "QAR", // Qatari Riyal
] as const;

/**
 * Card type enum for payment methods.
 */
export const cardTypeSchema = z.enum([
  "debit",
  "credit",
  "cash",
  "savings",
  "other",
]);

export type CardType = z.infer<typeof cardTypeSchema>;

/**
 * Currency code validation schema.
 * Validates against ISO 4217 format (3 uppercase letters).
 */
export const currencyCodeSchema = z
  .string()
  .length(3, "Currency code must be exactly 3 characters")
  .regex(/^[A-Z]{3}$/, "Currency code must be uppercase (e.g., USD, EUR, UAH)")
  .refine(
    (code): code is (typeof CURRENCY_CODES)[number] =>
      CURRENCY_CODES.includes(code as (typeof CURRENCY_CODES)[number]),
    {
      message: "Unsupported currency code. Please use a valid ISO 4217 code.",
    },
  );

export type CurrencyCode = z.infer<typeof currencyCodeSchema>;

/**
 * Payment method color schema (optional hex color).
 */
export const paymentMethodColorSchema = hexColorSchema.optional().nullable();

/**
 * Payment method name schema.
 */
export const paymentMethodNameSchema = z
  .string()
  .min(1, "Payment method name is required")
  .max(100, "Payment method name must be 100 characters or less")
  .trim();

/**
 * Schema for creating a new payment method.
 */
export const createPaymentMethodSchema = z.object({
  name: paymentMethodNameSchema,
  currency: currencyCodeSchema,
  cardType: cardTypeSchema.optional().nullable(),
  color: paymentMethodColorSchema,
  isDefault: z.boolean().optional().default(false),
});

export type CreatePaymentMethodInput = z.infer<
  typeof createPaymentMethodSchema
>;

/**
 * Schema for updating an existing payment method.
 * Note: Currency cannot be changed after creation (data integrity).
 */
export const updatePaymentMethodSchema = z.object({
  id: uuidSchema,
  name: paymentMethodNameSchema.optional(),
  cardType: cardTypeSchema.optional().nullable(),
  color: paymentMethodColorSchema,
  isDefault: z.boolean().optional(),
});

export type UpdatePaymentMethodInput = z.infer<
  typeof updatePaymentMethodSchema
>;

/**
 * Schema for archiving/activating a payment method.
 */
export const archivePaymentMethodSchema = z.object({
  id: uuidSchema,
});

export type ArchivePaymentMethodInput = z.infer<
  typeof archivePaymentMethodSchema
>;

/**
 * Schema for activating a payment method.
 */
export const activatePaymentMethodSchema = z.object({
  id: uuidSchema,
});

export type ActivatePaymentMethodInput = z.infer<
  typeof activatePaymentMethodSchema
>;

/**
 * Schema for deleting a payment method.
 */
export const deletePaymentMethodSchema = z.object({
  id: uuidSchema,
});

export type DeletePaymentMethodInput = z.infer<
  typeof deletePaymentMethodSchema
>;

/**
 * Schema for payment method filters (for listing).
 */
export const paymentMethodFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  currency: currencyCodeSchema.optional(),
  limit: z.number().int().positive().max(100).optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type PaymentMethodFilters = z.infer<typeof paymentMethodFiltersSchema>;

/**
 * Schema for getting payment method by ID.
 */
export const getPaymentMethodByIdSchema = z.object({
  id: uuidSchema,
});

export type GetPaymentMethodByIdInput = z.infer<
  typeof getPaymentMethodByIdSchema
>;
