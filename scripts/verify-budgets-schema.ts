import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseKey = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyBudgetsSchema() {
  console.log("🔍 Verifying Budgets Table Schema\n");
  console.log("=".repeat(80));

  // Check table structure
  const { data: columns, error: columnsError } = await supabase
    .from("information_schema.columns")
    .select("column_name, data_type, is_nullable, column_default")
    .eq("table_name", "budgets")
    .order("ordinal_position");

  if (columnsError) {
    console.error("❌ Error fetching columns:", columnsError);
  } else {
    console.log("\n📋 Table Structure:");
    console.table(columns);
  }

  // Check constraints
  const { data: constraints, error: constraintsError } = await supabase.rpc(
    "get_table_constraints",
    {
      p_table: "budgets",
    },
  );

  if (constraintsError) {
    console.error("❌ Error fetching constraints:", constraintsError.message);
  } else if (constraints) {
    console.log("\n🔒 Constraints:");
    console.table(constraints);
  }

  // Check indexes
  const { data: indexes, error: indexesError } = await supabase
    .from("pg_indexes")
    .select("indexname, indexdef")
    .eq("tablename", "budgets")
    .order("indexname");

  if (indexesError) {
    console.error("❌ Error fetching indexes:", indexesError.message);
  } else {
    console.log("\n📊 Indexes:");
    if (indexes && indexes.length > 0) {
      indexes.forEach((idx) => {
        console.log(`  • ${idx.indexname}`);
        console.log(`    ${idx.indexdef}\n`);
      });
    }
  }

  // Check RLS policies
  const { data: policies, error: policiesError } = await supabase
    .from("pg_policies")
    .select("policyname, cmd, qual, with_check")
    .eq("tablename", "budgets")
    .order("policyname");

  if (policiesError) {
    console.error("❌ Error fetching policies:", policiesError.message);
  } else {
    console.log("\n🛡️  RLS Policies:");
    if (policies && policies.length > 0) {
      policies.forEach((policy) => {
        console.log(`  • ${policy.policyname} (${policy.cmd})`);
      });
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("✅ Schema verification complete!\n");
}

verifyBudgetsSchema().catch(console.error);
