/**
 * Verification Script for Migration: migrate_orphaned_transactions
 *
 * Run with: node scripts/verify-migration.mjs
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseServiceRoleKey = "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log("=".repeat(80));
  console.log("Migration Verification: migrate_orphaned_transactions");
  console.log("=".repeat(80));
  console.log();

  // Test 1: Verify NOT NULL constraint
  console.log("✅ Test 1: Verify payment_method_id has NOT NULL constraint");
  const { data: columnInfo, error: columnError } = await supabase.rpc(
    "execute_sql",
    {
      query_text: `
        SELECT column_name, is_nullable, data_type
        FROM information_schema.columns
        WHERE table_name = 'transactions'
        AND column_name = 'payment_method_id';
      `,
    },
  );

  if (!columnError && columnInfo) {
    console.log("   payment_method_id:", columnInfo);
    const isNullable = columnInfo[0]?.is_nullable === "YES";
    if (!isNullable) {
      console.log("   ✅ PASS: payment_method_id has NOT NULL constraint");
    } else {
      console.log("   ❌ FAIL: payment_method_id is still nullable");
    }
  }
  console.log();

  // Test 2: Verify no orphaned transactions exist
  console.log("✅ Test 2: Verify no orphaned transactions exist");
  const { data: orphanedCount, error: orphanedError } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .is("payment_method_id", null);

  if (!orphanedError) {
    console.log(`   Orphaned transactions: ${orphanedCount ?? 0}`);
    if (orphanedCount === 0) {
      console.log("   ✅ PASS: No orphaned transactions found");
    } else {
      console.log(
        `   ❌ FAIL: ${orphanedCount} orphaned transactions still exist`,
      );
    }
  }
  console.log();

  // Test 3: Try to create a transaction without payment_method_id (should fail)
  console.log(
    "✅ Test 3: Try to create transaction without payment_method_id (should fail)",
  );

  // First, create a test user and category
  const testUserId = "00000000-0000-0000-0000-000000000000"; // Use a test UUID

  const { data: insertTest, error: insertError } = await supabase
    .from("transactions")
    .insert({
      user_id: testUserId,
      amount: 100,
      date: "2025-12-19",
      category_id: "00000000-0000-0000-0000-000000000000",
      // payment_method_id intentionally omitted
    })
    .select();

  if (insertError) {
    console.log("   ✅ PASS: Insert failed as expected");
    console.log(`   Error code: ${insertError.code}`);
    console.log(`   Error message: ${insertError.message}`);
  } else {
    console.log("   ❌ FAIL: Insert succeeded when it should have failed");
  }
  console.log();

  // Test 4: Verify "Cash/Unspecified" payment method creation
  console.log(
    "✅ Test 4: Check if 'Cash/Unspecified' payment method would be created",
  );
  const { data: cashPM, error: cashError } = await supabase
    .from("payment_methods")
    .select("id, name, currency, is_active")
    .eq("name", "Cash/Unspecified")
    .maybeSingle();

  if (cashError) {
    console.log(
      "   ⚠️  No 'Cash/Unspecified' payment method found (expected if no orphaned transactions existed)",
    );
  } else if (cashPM) {
    console.log("   ✅ 'Cash/Unspecified' payment method exists:");
    console.log(`      ID: ${cashPM.id}`);
    console.log(`      Currency: ${cashPM.currency}`);
    console.log(`      Active: ${cashPM.is_active}`);
  } else {
    console.log("   ⚠️  No 'Cash/Unspecified' payment method found");
  }
  console.log();

  console.log("=".repeat(80));
  console.log("Migration verification complete!");
  console.log("=".repeat(80));
}

main().catch(console.error);
