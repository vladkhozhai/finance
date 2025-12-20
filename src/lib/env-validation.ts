/**
 * Environment Variable Validation
 *
 * Validates that all required environment variables are present and properly formatted.
 * This runs on server startup to catch configuration errors early.
 *
 * Required variables:
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase project URL (public, browser-exposed)
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Supabase anonymous key (public, RLS-protected)
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key (server-only, bypasses RLS)
 *
 * Optional variables:
 * - NEXT_PUBLIC_APP_URL: Application base URL
 * - DATABASE_URL: Direct database connection string (for migrations)
 * - SUPABASE_ACCESS_TOKEN: Supabase CLI access token
 * - SUPABASE_PROJECT_REF: Supabase project reference ID
 *
 * Usage:
 *   Import this file in root layout or middleware to validate on startup
 *   import '@/lib/env-validation';
 */

interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validates a JWT token format (basic check)
 */
function isValidJwt(token: string): boolean {
  // JWT format: header.payload.signature (3 parts separated by dots)
  const parts = token.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

/**
 * Validates all required environment variables
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Validate NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL is not set");
  } else if (!isValidUrl(supabaseUrl)) {
    errors.push(`NEXT_PUBLIC_SUPABASE_URL is not a valid URL: ${supabaseUrl}`);
  } else if (!supabaseUrl.includes("supabase.co")) {
    warnings.push(
      `NEXT_PUBLIC_SUPABASE_URL does not appear to be a Supabase URL: ${supabaseUrl}`,
    );
  }

  // Check if using local Supabase (skip JWT validation for local development)
  const isLocalSupabase =
    supabaseUrl?.includes("127.0.0.1") || supabaseUrl?.includes("localhost");

  // Validate NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseAnonKey) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  } else if (!isLocalSupabase && !isValidJwt(supabaseAnonKey)) {
    // Only enforce JWT format for production Supabase instances
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is not a valid JWT token");
  }

  // Validate SUPABASE_SERVICE_ROLE_KEY (server-only)
  if (!supabaseServiceKey) {
    errors.push(
      "SUPABASE_SERVICE_ROLE_KEY is not set (required for admin operations)",
    );
  } else if (!isLocalSupabase && !isValidJwt(supabaseServiceKey)) {
    // Only enforce JWT format for production Supabase instances
    errors.push("SUPABASE_SERVICE_ROLE_KEY is not a valid JWT token");
  }

  // Validate optional but recommended variables
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    warnings.push(
      "NEXT_PUBLIC_APP_URL is not set (recommended for proper redirects)",
    );
  } else if (!isValidUrl(appUrl)) {
    warnings.push(`NEXT_PUBLIC_APP_URL is not a valid URL: ${appUrl}`);
  }

  // Check for common mistakes
  if (supabaseUrl === "https://your-project-ref.supabase.co") {
    errors.push(
      "NEXT_PUBLIC_SUPABASE_URL contains placeholder value - update with your actual Supabase URL",
    );
  }

  if (supabaseAnonKey?.startsWith("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")) {
    errors.push(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY contains placeholder value - update with your actual anonymous key",
    );
  }

  if (
    supabaseServiceKey?.startsWith("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
  ) {
    errors.push(
      "SUPABASE_SERVICE_ROLE_KEY contains placeholder value - update with your actual service role key",
    );
  }

  // Security check: Ensure service role key is different from anon key
  if (
    supabaseAnonKey &&
    supabaseServiceKey &&
    supabaseAnonKey === supabaseServiceKey
  ) {
    errors.push(
      "SUPABASE_SERVICE_ROLE_KEY must be different from NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates environment and throws error if invalid
 * Call this in server startup code (e.g., root layout, middleware)
 */
export function validateEnvironmentOrThrow(): void {
  const result = validateEnvironment();

  // Log warnings
  if (result.warnings.length > 0) {
    console.warn("Environment validation warnings:");
    for (const warning of result.warnings) {
      console.warn(`  - ${warning}`);
    }
  }

  // Throw on errors
  if (!result.isValid) {
    const errorMessage = [
      "Environment validation failed:",
      "",
      "Errors:",
      ...result.errors.map((err) => `  - ${err}`),
      "",
      "Please check your .env.local file and ensure all required variables are set.",
      "See .env.example for reference.",
    ].join("\n");

    throw new Error(errorMessage);
  }
}

/**
 * Gets a summary of environment configuration (safe for logging)
 */
export function getEnvironmentSummary(): Record<string, string | boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "not-set";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "not-set";
  const nodeEnv = process.env.NODE_ENV || "development";

  return {
    environment: nodeEnv,
    supabaseUrl: supabaseUrl.replace(/https?:\/\/([^/]+).*/, "$1"), // Show only domain
    appUrl: appUrl.replace(/https?:\/\/([^/]+).*/, "$1"), // Show only domain
    supabaseAnonKeySet: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    databaseUrlSet: !!process.env.DATABASE_URL,
  };
}

// Run validation on module load (server-side only)
// Skip validation during build time to allow CI/CD with placeholder values
if (
  typeof window === "undefined" &&
  process.env.NEXT_PHASE !== "phase-production-build"
) {
  try {
    validateEnvironmentOrThrow();
    const summary = getEnvironmentSummary();
    console.log("Environment validation passed:", summary);
  } catch (error) {
    console.error(error);
    // Only throw in production runtime to prevent blocking local development
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
  }
}
