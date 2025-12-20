import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseServiceKey = "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testBudgetsConstraints() {
  console.log("🧪 Testing Budgets Table Constraints\n");
  console.log("=".repeat(80) + "\n");

  // Create a test user
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: "test@example.com",
      password: "testpassword123",
      email_confirm: true,
    });

  if (authError || !authData.user) {
    console.error("❌ Failed to create test user:", authError);
    return;
  }

  const userId = authData.user.id;
  console.log("✅ Created test user:", userId);

  // Create a test category
  const { data: category, error: catError } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: "Food",
      color: "#FF5733",
      type: "expense",
    })
    .select()
    .single();

  if (catError || !category) {
    console.error("❌ Failed to create test category:", catError);
    return;
  }

  console.log("✅ Created test category:", category.id);

  // Create a test tag
  const { data: tag, error: tagError } = await supabase
    .from("tags")
    .insert({
      user_id: userId,
      name: "coffee",
    })
    .select()
    .single();

  if (tagError || !tag) {
    console.error("❌ Failed to create test tag:", tagError);
    return;
  }

  console.log("✅ Created test tag:", tag.id + "\n");

  // Test 1: Valid budget with category_id
  console.log("Test 1: Create budget with category_id only");
  const { data: budget1, error: error1 } = await supabase
    .from("budgets")
    .insert({
      user_id: userId,
      category_id: category.id,
      amount: 500,
      period: "2025-01-01",
    })
    .select()
    .single();

  if (error1) {
    console.log("❌ FAILED:", error1.message);
  } else {
    console.log("✅ SUCCESS: Created budget with category_id");
  }

  // Test 2: Valid budget with tag_id
  console.log("\nTest 2: Create budget with tag_id only");
  const { data: budget2, error: error2 } = await supabase
    .from("budgets")
    .insert({
      user_id: userId,
      tag_id: tag.id,
      amount: 200,
      period: "2025-01-01",
    })
    .select()
    .single();

  if (error2) {
    console.log("❌ FAILED:", error2.message);
  } else {
    console.log("✅ SUCCESS: Created budget with tag_id");
  }

  // Test 3: Invalid - both category_id and tag_id
  console.log(
    "\nTest 3: Try to create budget with BOTH category_id and tag_id (should FAIL)",
  );
  const { error: error3 } = await supabase.from("budgets").insert({
    user_id: userId,
    category_id: category.id,
    tag_id: tag.id,
    amount: 300,
    period: "2025-02-01",
  });

  if (error3) {
    console.log("✅ CORRECTLY REJECTED:", error3.message);
  } else {
    console.log("❌ ERROR: Should have been rejected but wasn't!");
  }

  // Test 4: Invalid - neither category_id nor tag_id
  console.log(
    "\nTest 4: Try to create budget with NEITHER category_id nor tag_id (should FAIL)",
  );
  const { error: error4 } = await supabase.from("budgets").insert({
    user_id: userId,
    amount: 400,
    period: "2025-02-01",
  });

  if (error4) {
    console.log("✅ CORRECTLY REJECTED:", error4.message);
  } else {
    console.log("❌ ERROR: Should have been rejected but wasn't!");
  }

  // Test 5: Invalid - duplicate category budget for same period
  console.log(
    "\nTest 5: Try to create duplicate category budget for same period (should FAIL)",
  );
  const { error: error5 } = await supabase.from("budgets").insert({
    user_id: userId,
    category_id: category.id,
    amount: 600,
    period: "2025-01-01",
  });

  if (error5) {
    console.log("✅ CORRECTLY REJECTED:", error5.message);
  } else {
    console.log("❌ ERROR: Should have been rejected but wasn't!");
  }

  // Test 6: Invalid - period not first day of month
  console.log(
    "\nTest 6: Try to create budget with period not on first day of month (should FAIL)",
  );
  const { error: error6 } = await supabase.from("budgets").insert({
    user_id: userId,
    category_id: category.id,
    amount: 500,
    period: "2025-03-15",
  });

  if (error6) {
    console.log("✅ CORRECTLY REJECTED:", error6.message);
  } else {
    console.log("❌ ERROR: Should have been rejected but wasn't!");
  }

  // Test 7: Invalid - negative amount
  console.log(
    "\nTest 7: Try to create budget with negative amount (should FAIL)",
  );
  const { error: error7 } = await supabase.from("budgets").insert({
    user_id: userId,
    category_id: category.id,
    amount: -100,
    period: "2025-04-01",
  });

  if (error7) {
    console.log("✅ CORRECTLY REJECTED:", error7.message);
  } else {
    console.log("❌ ERROR: Should have been rejected but wasn't!");
  }

  // Test 8: Test budget_progress view
  console.log("\nTest 8: Query budget_progress view");
  const { data: budgetProgress, error: error8 } = await supabase
    .from("budget_progress")
    .select("*");

  if (error8) {
    console.log("❌ FAILED:", error8.message);
  } else {
    console.log("✅ SUCCESS: Retrieved budget progress data");
    console.log("Budget Progress Records:", budgetProgress?.length);
    if (budgetProgress && budgetProgress.length > 0) {
      console.log("Sample:", JSON.stringify(budgetProgress[0], null, 2));
    }
  }

  // Cleanup
  console.log("\n" + "=".repeat(80));
  console.log("🧹 Cleaning up test data...");

  await supabase.auth.admin.deleteUser(userId);
  console.log("✅ Test complete!\n");
}

testBudgetsConstraints().catch(console.error);
