/**
 * Test script for email validation
 * Run with: npx tsx scripts/test-email-validation.ts
 */

import { signInSchema } from "../src/lib/validations/auth";

const testEmails = [
  // Should pass - test TLDs (RFC 2606)
  { email: "test@example.test", expected: true, description: ".test TLD" },
  {
    email: "user@localhost.test",
    expected: true,
    description: ".test subdomain",
  },
  {
    email: "admin@domain.example",
    expected: true,
    description: ".example TLD",
  },
  { email: "qa@financeflow.test", expected: true, description: ".test for QA" },
  { email: "dev@app.localhost", expected: true, description: ".localhost TLD" },
  {
    email: "invalid@email.invalid",
    expected: true,
    description: ".invalid TLD",
  },

  // Should pass - standard TLDs
  { email: "user@gmail.com", expected: true, description: "Standard .com" },
  { email: "test@example.org", expected: true, description: "Standard .org" },
  {
    email: "admin@company.co.uk",
    expected: true,
    description: "Multi-level TLD",
  },
  { email: "user+tag@domain.net", expected: true, description: "Email with +" },

  // Should fail - invalid formats
  { email: "notanemail", expected: false, description: "No @ symbol" },
  { email: "@example.com", expected: false, description: "Missing local part" },
  { email: "user@", expected: false, description: "Missing domain" },
  { email: "user@domain", expected: false, description: "Missing TLD" },
  { email: "", expected: false, description: "Empty string" },
  { email: "user @domain.com", expected: false, description: "Space in email" },
];

console.log("Testing Email Validation Schema\n");
console.log("=".repeat(80));

let passed = 0;
let failed = 0;

for (const testCase of testEmails) {
  const result = signInSchema.safeParse({
    email: testCase.email,
    password: "testpassword",
  });

  const success = result.success;
  const matches = success === testCase.expected;

  if (matches) {
    passed++;
    console.log(`✅ PASS: ${testCase.description}`);
    console.log(
      `   Email: "${testCase.email}" - ${success ? "Valid" : "Invalid"}`,
    );
  } else {
    failed++;
    console.log(`❌ FAIL: ${testCase.description}`);
    console.log(`   Email: "${testCase.email}"`);
    console.log(`   Expected: ${testCase.expected ? "Valid" : "Invalid"}`);
    console.log(`   Got: ${success ? "Valid" : "Invalid"}`);
    if (!result.success) {
      console.log(`   Error: ${result.error.issues[0]?.message}`);
    }
  }
  console.log();
}

console.log("=".repeat(80));
console.log(
  `\nResults: ${passed} passed, ${failed} failed out of ${testEmails.length} tests`,
);

if (failed === 0) {
  console.log("\n✅ All tests passed!");
  process.exit(0);
} else {
  console.log("\n❌ Some tests failed!");
  process.exit(1);
}
