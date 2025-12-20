/**
 * Authentication Validation Schemas
 *
 * Zod schemas for validating authentication inputs.
 * Includes support for test TLDs (.test, .localhost, .example, .invalid) per RFC 2606.
 */

import { z } from "zod";

/**
 * Email validation that accepts both standard TLDs and reserved test TLDs.
 *
 * Standard email validation using Zod's built-in validator, plus support for:
 * - .test (for testing)
 * - .localhost (for local development)
 * - .example (for documentation)
 * - .invalid (for testing invalid scenarios)
 *
 * @see https://datatracker.ietf.org/doc/html/rfc2606 (Reserved Top Level DNS Names)
 */
const emailSchema = z
  .string()
  .min(1, "Email is required")
  .refine(
    (email) => {
      // Basic email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return false;
      }

      // Check if it's a test TLD
      const testTLDs = [".test", ".localhost", ".example", ".invalid"];
      const hasTestTLD = testTLDs.some((tld) =>
        email.toLowerCase().endsWith(tld),
      );

      if (hasTestTLD) {
        return true; // Accept test TLDs
      }

      // For non-test TLDs, use Zod's stricter validation
      return z.string().email().safeParse(email).success;
    },
    { message: "Invalid email address" },
  );

/**
 * Sign in validation schema
 */
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

/**
 * Sign up validation schema
 */
export const signUpSchema = z.object({
  email: emailSchema,
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
