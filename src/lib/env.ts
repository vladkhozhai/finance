/**
 * Environment Variable Validation
 *
 * Validates required environment variables at runtime to catch configuration
 * errors early. This helps prevent cryptic errors in production.
 *
 * Usage:
 *   import { env } from '@/lib/env';
 *   const apiUrl = env.NEXT_PUBLIC_SUPABASE_URL;
 *
 * @throws Error if required variables are missing or invalid
 */

import { z } from "zod";

/**
 * Schema for environment variables.
 * Add new required variables here as the project grows.
 */
const envSchema = z.object({
  // Supabase Configuration (Public)
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL")
    .min(1, "NEXT_PUBLIC_SUPABASE_URL is required"),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),

  // Supabase Service Role Key (Server-only, optional for most use cases)
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Application Configuration (Public)
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL")
    .default("http://localhost:3000"),

  // Database Configuration (Server-only, optional for Supabase CLI)
  DATABASE_URL: z.string().optional(),

  // Node Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

/**
 * Type-safe environment variables.
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validates and parses environment variables.
 * Throws an error if validation fails.
 */
function validateEnv(): Env {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      DATABASE_URL: process.env.DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map((err) => `  - ${err.path.join(".")}: ${err.message}`)
        .join("\n");

      throw new Error(
        `❌ Invalid environment variables:\n${missingVars}\n\nPlease check your .env.local file.`,
      );
    }
    throw error;
  }
}

/**
 * Validated environment variables.
 * Use this throughout your application for type-safe access to env vars.
 *
 * @example
 *   import { env } from '@/lib/env';
 *   console.log(env.NEXT_PUBLIC_SUPABASE_URL);
 */
export const env = validateEnv();
