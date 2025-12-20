#!/usr/bin/env node

/**
 * Script to create test data for Card #23 Testing
 * Creates budget and multi-currency transactions for testing payment method breakdown
 */

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz";

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTestData() {
  try {
    console.log("🔍 Fetching current user...");

    // Get the first user
    const { data: users, error: userError } =
      await supabase.auth.admin.listUsers();

    if (userError) {
      console.error("❌ Error fetching users:", userError);
      return;
    }

    if (!users.users || users.users.length === 0) {
      console.error("❌ No users found. Please create a user first.");
      return;
    }

    const userId = users.users[0].id;
    console.log(`✅ Found user: ${users.users[0].email} (${userId})`);

    // Get or create Food category
    console.log("\n📁 Setting up Food category...");
    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select("id, name")
      .eq("user_id", userId)
      .eq("name", "Food");

    let categoryId;
    if (categories && categories.length > 0) {
      categoryId = categories[0].id;
      console.log(`✅ Found existing Food category: ${categoryId}`);
    } else {
      const { data: newCat, error: createCatError } = await supabase
        .from("categories")
        .insert({
          user_id: userId,
          name: "Food",
          color: "#10B981",
          type: "expense",
        })
        .select()
        .single();

      if (createCatError) {
        console.error("❌ Error creating category:", createCatError);
        return;
      }
      categoryId = newCat.id;
      console.log(`✅ Created Food category: ${categoryId}`);
    }

    // Get payment methods
    console.log("\n💳 Fetching payment methods...");
    const { data: paymentMethods, error: pmError } = await supabase
      .from("payment_methods")
      .select("id, name, currency")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (pmError || !paymentMethods || paymentMethods.length === 0) {
      console.error(
        "❌ No active payment methods found. Please create payment methods first.",
      );
      return;
    }

    console.log(`✅ Found ${paymentMethods.length} payment methods:`);
    paymentMethods.forEach((pm) =>
      console.log(`   - ${pm.name} (${pm.currency})`),
    );

    // Create budget for December 2024
    console.log("\n💰 Creating test budget...");
    const { data: existingBudget } = await supabase
      .from("budgets")
      .select("id")
      .eq("user_id", userId)
      .eq("category_id", categoryId)
      .eq("period", "2024-12-01")
      .single();

    let budgetId;
    if (existingBudget) {
      budgetId = existingBudget.id;
      console.log(`✅ Using existing budget: ${budgetId}`);
    } else {
      const { data: newBudget, error: budgetError } = await supabase
        .from("budgets")
        .insert({
          user_id: userId,
          category_id: categoryId,
          amount: 500.0,
          period: "2024-12-01",
        })
        .select()
        .single();

      if (budgetError) {
        console.error("❌ Error creating budget:", budgetError);
        return;
      }
      budgetId = newBudget.id;
      console.log(`✅ Created budget: $500 for Food (December 2024)`);
    }

    // Create test transactions across different payment methods
    console.log("\n📝 Creating test transactions...");

    const transactions = [
      // USD payment method
      {
        user_id: userId,
        category_id: categoryId,
        amount: 50.0,
        native_amount: 50.0,
        exchange_rate: 1.0,
        base_currency: "USD",
        date: "2024-12-05",
        description: "Grocery shopping (USD)",
        type: "expense",
        payment_method_id:
          paymentMethods.find((pm) => pm.currency === "USD")?.id ||
          paymentMethods[0].id,
      },
      {
        user_id: userId,
        category_id: categoryId,
        amount: 75.0,
        native_amount: 75.0,
        exchange_rate: 1.0,
        base_currency: "USD",
        date: "2024-12-15",
        description: "Restaurant (USD)",
        type: "expense",
        payment_method_id:
          paymentMethods.find((pm) => pm.currency === "USD")?.id ||
          paymentMethods[0].id,
      },
      // EUR payment method (if exists)
      {
        user_id: userId,
        category_id: categoryId,
        amount: 21.74,
        native_amount: 20.0,
        exchange_rate: 1.087,
        base_currency: "USD",
        date: "2024-12-10",
        description: "Coffee shop (EUR)",
        type: "expense",
        payment_method_id:
          paymentMethods.find((pm) => pm.currency === "EUR")?.id ||
          paymentMethods[0].id,
      },
      {
        user_id: userId,
        category_id: categoryId,
        amount: 43.48,
        native_amount: 40.0,
        exchange_rate: 1.087,
        base_currency: "USD",
        date: "2024-12-20",
        description: "Supermarket (EUR)",
        type: "expense",
        payment_method_id:
          paymentMethods.find((pm) => pm.currency === "EUR")?.id ||
          paymentMethods[0].id,
      },
      // UAH payment method (if exists)
      {
        user_id: userId,
        category_id: categoryId,
        amount: 24.39,
        native_amount: 1000.0,
        exchange_rate: 0.02439,
        base_currency: "USD",
        date: "2024-12-18",
        description: "Market (UAH)",
        type: "expense",
        payment_method_id:
          paymentMethods.find((pm) => pm.currency === "UAH")?.id ||
          paymentMethods[0].id,
      },
    ];

    for (const tx of transactions) {
      const { error: txError } = await supabase.from("transactions").insert(tx);

      if (txError) {
        console.error(`❌ Error creating transaction:`, txError);
      } else {
        console.log(`✅ Created: ${tx.description} - $${tx.amount}`);
      }
    }

    console.log("\n🎉 Test data created successfully!");
    console.log(`\n📊 Summary:`);
    console.log(`   Budget ID: ${budgetId}`);
    console.log(`   Category: Food`);
    console.log(`   Period: December 2024`);
    console.log(`   Limit: $500.00`);
    console.log(
      `   Transactions: 5 across ${paymentMethods.length} payment methods`,
    );
    console.log(`   Total Spent: $214.61`);
    console.log(`\n🔗 Visit: http://localhost:3000/budgets`);
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

createTestData();
