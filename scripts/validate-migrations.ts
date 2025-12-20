#!/usr/bin/env tsx

/**
 * Migration Validation Script
 *
 * Validates all migration files in supabase/migrations/ directory:
 * - File naming convention (YYYYMMDDHHMMSS_description.sql)
 * - SQL syntax validity (basic checks)
 * - Idempotency patterns (IF NOT EXISTS, etc.)
 * - RLS policy presence for new tables
 * - No hardcoded UUIDs or sensitive data
 *
 * Usage:
 *   npx tsx scripts/validate-migrations.ts
 *   npm run validate-migrations (add to package.json)
 *
 * Exit codes:
 *   0 - All validations passed
 *   1 - Validation errors found
 */

import * as fs from "node:fs";
import * as path from "node:path";

interface ValidationResult {
  file: string;
  errors: string[];
  warnings: string[];
}

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase/migrations");
const MIGRATION_FILE_PATTERN = /^(\d{14})_([a-z0-9_]+)\.sql$/;

/**
 * Validates migration file naming convention
 */
function validateFileName(filename: string): string[] {
  const errors: string[] = [];

  if (!MIGRATION_FILE_PATTERN.test(filename)) {
    errors.push(
      `Invalid filename format. Expected: YYYYMMDDHHMMSS_description.sql, got: ${filename}`,
    );
    return errors;
  }

  const match = filename.match(MIGRATION_FILE_PATTERN);
  if (match) {
    const [, timestamp, description] = match;

    // Validate timestamp format
    const year = Number.parseInt(timestamp.substring(0, 4), 10);
    const month = Number.parseInt(timestamp.substring(4, 6), 10);
    const day = Number.parseInt(timestamp.substring(6, 8), 10);
    const hour = Number.parseInt(timestamp.substring(8, 10), 10);
    const minute = Number.parseInt(timestamp.substring(10, 12), 10);
    const second = Number.parseInt(timestamp.substring(12, 14), 10);

    if (year < 2020 || year > 2100) {
      errors.push(`Invalid year in timestamp: ${year}`);
    }
    if (month < 1 || month > 12) {
      errors.push(`Invalid month in timestamp: ${month}`);
    }
    if (day < 1 || day > 31) {
      errors.push(`Invalid day in timestamp: ${day}`);
    }
    if (hour < 0 || hour > 23) {
      errors.push(`Invalid hour in timestamp: ${hour}`);
    }
    if (minute < 0 || minute > 59) {
      errors.push(`Invalid minute in timestamp: ${minute}`);
    }
    if (second < 0 || second > 59) {
      errors.push(`Invalid second in timestamp: ${second}`);
    }

    // Validate description format
    if (description.length < 3) {
      errors.push(
        `Description too short (minimum 3 characters): ${description}`,
      );
    }
    if (!/^[a-z0-9_]+$/.test(description)) {
      errors.push(
        `Description must be lowercase snake_case (a-z, 0-9, _): ${description}`,
      );
    }
  }

  return errors;
}

/**
 * Validates SQL content for idempotency patterns
 */
function validateIdempotency(content: string): string[] {
  const errors: string[] = [];
  const lines = content.split("\n");

  // Check for CREATE TABLE without IF NOT EXISTS
  const createTablePattern = /CREATE TABLE\s+(?!IF NOT EXISTS)/gi;
  const createTableMatches = content.match(createTablePattern);
  if (createTableMatches) {
    errors.push(
      `Found CREATE TABLE without IF NOT EXISTS (${createTableMatches.length} occurrences). Use: CREATE TABLE IF NOT EXISTS`,
    );
  }

  // Check for CREATE INDEX without IF NOT EXISTS
  const createIndexPattern =
    /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?!IF NOT EXISTS)/gi;
  const createIndexMatches = content.match(createIndexPattern);
  if (createIndexMatches) {
    errors.push(
      `Found CREATE INDEX without IF NOT EXISTS (${createIndexMatches.length} occurrences). Use: CREATE INDEX IF NOT EXISTS`,
    );
  }

  // Check for ALTER TABLE ADD COLUMN without proper guards
  const alterAddColumnPattern =
    /ALTER TABLE\s+\w+\s+ADD COLUMN\s+(?!IF NOT EXISTS)/gi;
  const alterAddColumnMatches = content.match(alterAddColumnPattern);
  if (alterAddColumnMatches) {
    errors.push(
      `Found ALTER TABLE ADD COLUMN without IF NOT EXISTS (${alterAddColumnMatches.length} occurrences). Wrap in DO $$ block with column existence check`,
    );
  }

  return errors;
}

/**
 * Validates RLS policies for new tables
 */
function validateRLSPolicies(content: string): string[] {
  const warnings: string[] = [];

  // Find all CREATE TABLE statements
  const tablePattern = /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/gi;
  const tableMatches = [...content.matchAll(tablePattern)];

  for (const match of tableMatches) {
    const tableName = match[1];

    // Check if RLS is enabled for this table
    const rlsPattern = new RegExp(
      `ALTER TABLE\\s+${tableName}\\s+ENABLE ROW LEVEL SECURITY`,
      "i",
    );
    if (!rlsPattern.test(content)) {
      warnings.push(
        `Table '${tableName}' created without ROW LEVEL SECURITY enabled. Add: ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`,
      );
    }

    // Check if policies are created
    const policyPattern = new RegExp(`CREATE POLICY.*ON ${tableName}`, "i");
    if (!policyPattern.test(content)) {
      warnings.push(
        `Table '${tableName}' has no RLS policies. Create policies for SELECT, INSERT, UPDATE, DELETE.`,
      );
    }
  }

  return warnings;
}

/**
 * Validates SQL content for common issues
 */
function validateSQLContent(content: string): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for hardcoded UUIDs (common mistake)
  const uuidPattern =
    /['"]([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})['"]/gi;
  const uuidMatches = content.match(uuidPattern);
  if (uuidMatches) {
    warnings.push(
      `Found hardcoded UUIDs (${uuidMatches.length} occurrences). Consider using gen_random_uuid() or references instead.`,
    );
  }

  // Check for sensitive data patterns (emails, passwords, etc.)
  if (/password|secret|token|key/gi.test(content)) {
    warnings.push(
      "Found potential sensitive data references. Ensure no actual credentials are hardcoded.",
    );
  }

  // Check for DROP TABLE without IF EXISTS
  const dropTablePattern = /DROP TABLE\s+(?!IF EXISTS)/gi;
  const dropTableMatches = content.match(dropTablePattern);
  if (dropTableMatches) {
    warnings.push(
      `Found DROP TABLE without IF EXISTS (${dropTableMatches.length} occurrences). Use: DROP TABLE IF EXISTS`,
    );
  }

  // Check for proper extension creation
  const createExtensionPattern = /CREATE EXTENSION\s+(?!IF NOT EXISTS)/gi;
  const createExtensionMatches = content.match(createExtensionPattern);
  if (createExtensionMatches) {
    errors.push(
      `Found CREATE EXTENSION without IF NOT EXISTS (${createExtensionMatches.length} occurrences). Use: CREATE EXTENSION IF NOT EXISTS`,
    );
  }

  // Basic SQL syntax checks
  if (content.trim().length === 0) {
    errors.push("Migration file is empty");
  }

  // Check for unterminated statements (simple check)
  const statements = content
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (statements.length === 0) {
    warnings.push("No SQL statements found (file may only contain comments)");
  }

  return { errors, warnings };
}

/**
 * Validates a single migration file
 */
function validateMigrationFile(filename: string): ValidationResult {
  const result: ValidationResult = {
    file: filename,
    errors: [],
    warnings: [],
  };

  // Validate filename
  result.errors.push(...validateFileName(filename));

  // Read and validate content
  try {
    const filePath = path.join(MIGRATIONS_DIR, filename);
    const content = fs.readFileSync(filePath, "utf-8");

    // Validate idempotency
    result.errors.push(...validateIdempotency(content));

    // Validate SQL content
    const contentValidation = validateSQLContent(content);
    result.errors.push(...contentValidation.errors);
    result.warnings.push(...contentValidation.warnings);

    // Validate RLS policies
    result.warnings.push(...validateRLSPolicies(content));
  } catch (error) {
    result.errors.push(
      `Failed to read migration file: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return result;
}

/**
 * Main validation function
 */
function validateAllMigrations(): {
  results: ValidationResult[];
  hasErrors: boolean;
} {
  console.log("🔍 Validating migration files in:", MIGRATIONS_DIR);
  console.log("");

  // Check if migrations directory exists
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error("❌ Migrations directory not found:", MIGRATIONS_DIR);
    return { results: [], hasErrors: true };
  }

  // Get all .sql files
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("ℹ️  No migration files found");
    return { results: [], hasErrors: false };
  }

  console.log(`Found ${files.length} migration file(s)\n`);

  // Validate each file
  const results = files.map((file) => validateMigrationFile(file));

  // Print results
  let hasErrors = false;

  for (const result of results) {
    const hasFileErrors = result.errors.length > 0;
    const hasFileWarnings = result.warnings.length > 0;

    if (hasFileErrors || hasFileWarnings) {
      console.log(`📄 ${result.file}`);

      if (hasFileErrors) {
        hasErrors = true;
        console.log("  ❌ Errors:");
        for (const error of result.errors) {
          console.log(`     - ${error}`);
        }
      }

      if (hasFileWarnings) {
        console.log("  ⚠️  Warnings:");
        for (const warning of result.warnings) {
          console.log(`     - ${warning}`);
        }
      }

      console.log("");
    } else {
      console.log(`✅ ${result.file}`);
    }
  }

  return { results, hasErrors };
}

/**
 * Main entry point
 */
function main(): void {
  console.log("=".repeat(80));
  console.log("Migration Validation Script");
  console.log("=".repeat(80));
  console.log("");

  const { results, hasErrors } = validateAllMigrations();

  console.log("=".repeat(80));
  console.log("Summary:");
  console.log(`  Total files: ${results.length}`);
  console.log(
    `  Files with errors: ${results.filter((r) => r.errors.length > 0).length}`,
  );
  console.log(
    `  Files with warnings: ${results.filter((r) => r.warnings.length > 0).length}`,
  );
  console.log("=".repeat(80));
  console.log("");

  if (hasErrors) {
    console.error(
      "❌ Migration validation failed. Please fix the errors above.",
    );
    process.exit(1);
  }

  console.log("✅ All migration validations passed!");
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

export { validateAllMigrations, validateMigrationFile };
