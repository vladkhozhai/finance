/**
 * Authentication Validation Schemas
 *
 * Zod schemas for validating authentication inputs.
 * Uses standard email validation - all standard email formats accepted.
 *
 * Note: Supabase Auth API rejects .test TLD emails regardless of client-side validation.
 * For testing, use @example.com which is a valid RFC 2606 reserved domain.
 */

import { z } from "zod";

/**
 * Sign in validation schema
 */
export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Sign up validation schema
 */
export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  currency: z.string().default("USD"),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
