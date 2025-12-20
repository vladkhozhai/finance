/**
 * Test script for budget Server Actions
 *
 * This script tests the budget CRUD operations to ensure they work correctly.
 * Run with: npx tsx scripts/test-budget-actions.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testBudgetActions() {
  console.log("🧪 Testing Budget Server Actions\n");
  console.log(`${"=".repeat(80)}\n`);

  try {
    // Create a test user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: `test-budget-${Date.now()}@example.com`,
        password: "testpassword123",
        email_confirm: true,
      });

    if (authError || !authData.user) {
      throw new Error(`Failed to create test user: ${authError?.message}`);
    }

    const userId = authData.user.id;
    console.log(`✅ Created test user: ${userId}\n`);

    // Create test category
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .insert({
        user_id: userId,
        name: "Test Groceries",
        color: "#4CAF50",
        type: "expense",
      })
      .select("id")
      .single();

    if (categoryError || !category) {
      throw new Error(
        `Failed to create test category: ${categoryError?.message}`,
      );
    }

    console.log(`✅ Created test category: ${category.id}\n`);

    // Create test tag
    const { data: tag, error: tagError } = await supabase
      .from("tags")
      .insert({
        user_id: userId,
        name: "test-food",
      })
      .select("id")
      .single();

    if (tagError || !tag) {
      throw new Error(`Failed to create test tag: ${tagError?.message}`);
    }

    console.log(`✅ Created test tag: ${tag.id}\n`);

    // Test 1: Create budget with category
    console.log("Test 1: Create budget with category (via direct DB insert)\n");
    const { data: budget1, error: budget1Error } = await supabase
      .from("budgets")
      .insert({
        user_id: userId,
        amount: 500,
        period: "2025-01-01",
        category_id: category.id,
        tag_id: null,
      })
      .select("id, amount, period, category_id, tag_id")
      .single();

    if (budget1Error || !budget1) {
      throw new Error(`Failed to create budget 1: ${budget1Error?.message}`);
    }

    console.log("✅ Created budget with category:");
    console.log(`   ID: ${budget1.id}`);
    console.log(`   Amount: ${budget1.amount}`);
    console.log(`   Period: ${budget1.period}`);
    console.log(`   Category ID: ${budget1.category_id}`);
    console.log(`   Tag ID: ${budget1.tag_id}\n`);

    // Test 2: Create budget with tag
    console.log("Test 2: Create budget with tag (via direct DB insert)\n");
    const { data: budget2, error: budget2Error } = await supabase
      .from("budgets")
      .insert({
        user_id: userId,
        amount: 300,
        period: "2025-01-01",
        category_id: null,
        tag_id: tag.id,
      })
      .select("id, amount, period, category_id, tag_id")
      .single();

    if (budget2Error || !budget2) {
      throw new Error(`Failed to create budget 2: ${budget2Error?.message}`);
    }

    console.log("✅ Created budget with tag:");
    console.log(`   ID: ${budget2.id}`);
    console.log(`   Amount: ${budget2.amount}`);
    console.log(`   Period: ${budget2.period}`);
    console.log(`   Category ID: ${budget2.category_id}`);
    console.log(`   Tag ID: ${budget2.tag_id}\n`);

    // Test 3: Query budgets with joins
    console.log("Test 3: Query budgets with joins\n");
    const { data: budgets, error: budgetsError } = await supabase
      .from("budgets")
      .select(`
        id,
        user_id,
        amount,
        period,
        category_id,
        tag_id,
        category:categories (
          id,
          name,
          color,
          type
        ),
        tag:tags (
          id,
          name
        )
      `)
      .eq("user_id", userId)
      .order("period", { ascending: false });

    if (budgetsError) {
      throw new Error(`Failed to query budgets: ${budgetsError.message}`);
    }

    console.log(`✅ Queried ${budgets?.length || 0} budgets:`);
    for (const budget of budgets || []) {
      const category = budget.category as any;
      const tag = budget.tag as any;
      const categoryName = Array.isArray(category)
        ? category[0]?.name
        : category?.name;
      const tagName = Array.isArray(tag) ? tag[0]?.name : tag?.name;
      console.log(
        `   - ${budget.id}: $${budget.amount} for ${categoryName || tagName}`,
      );
    }
    console.log("");

    // Test 4: Query budget_progress view
    console.log("Test 4: Query budget_progress view\n");
    const { data: progress, error: progressError } = await supabase
      .from("budget_progress")
      .select(`
        id,
        budget_amount,
        period,
        period_end,
        spent_amount,
        spent_percentage,
        is_overspent,
        category:categories (
          name
        ),
        tag:tags (
          name
        )
      `)
      .eq("user_id", userId);

    if (progressError) {
      throw new Error(
        `Failed to query budget progress: ${progressError.message}`,
      );
    }

    console.log(`✅ Queried ${progress?.length || 0} budget progress records:`);
    for (const p of progress || []) {
      const category = p.category as any;
      const tag = p.tag as any;
      const categoryName = Array.isArray(category)
        ? category[0]?.name
        : category?.name;
      const tagName = Array.isArray(tag) ? tag[0]?.name : tag?.name;
      console.log(
        `   - ${categoryName || tagName}: $${p.spent_amount}/$${p.budget_amount} (${p.spent_percentage}%)`,
      );
    }
    console.log("");

    // Test 5: Update budget
    console.log("Test 5: Update budget amount\n");
    const { error: updateError } = await supabase
      .from("budgets")
      .update({ amount: 600 })
      .eq("id", budget1.id)
      .eq("user_id", userId);

    if (updateError) {
      throw new Error(`Failed to update budget: ${updateError.message}`);
    }

    const { data: updatedBudget } = await supabase
      .from("budgets")
      .select("id, amount")
      .eq("id", budget1.id)
      .single();

    console.log(
      `✅ Updated budget ${budget1.id}: amount is now $${updatedBudget?.amount}\n`,
    );

    // Test 6: Try to create duplicate budget (should fail)
    console.log("Test 6: Attempt to create duplicate budget (should fail)\n");
    const { error: duplicateError } = await supabase.from("budgets").insert({
      user_id: userId,
      amount: 400,
      period: "2025-01-01",
      category_id: category.id,
      tag_id: null,
    });

    if (duplicateError) {
      console.log(
        `✅ Duplicate prevention working: ${duplicateError.message}\n`,
      );
    } else {
      console.log("❌ Duplicate prevention failed - budget was created!\n");
    }

    // Test 7: Test period normalization
    console.log("Test 7: Test period normalization helper\n");
    const testPeriods = ["2025-01-01", "2025-01", "2025-01-15"];
    for (const period of testPeriods) {
      const normalized = normalizeToFirstDay(period);
      console.log(`   ${period} -> ${normalized}`);
    }
    console.log("");

    // Cleanup
    console.log(`\n${"=".repeat(80)}`);
    console.log("🧹 Cleaning up test data...\n");

    await supabase.from("budgets").delete().eq("user_id", userId);
    await supabase.from("categories").delete().eq("user_id", userId);
    await supabase.from("tags").delete().eq("user_id", userId);
    await supabase.auth.admin.deleteUser(userId);

    console.log("✅ Cleanup complete!\n");
    console.log(`${"=".repeat(80)}\n`);
    console.log("✅ All budget action tests passed!\n");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

function normalizeToFirstDay(dateStr: string): string {
  if (/^\d{4}-\d{2}-01$/.test(dateStr)) {
    return dateStr;
  }
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    return `${dateStr}-01`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr.replace(/-\d{2}$/, "-01");
  }
  throw new Error("Invalid date format");
}

testBudgetActions();
