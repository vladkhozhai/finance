/**
 * Script to clear all API-sourced rates
 * Used for testing
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseKey = "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz";

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearApiRates() {
  console.log("🗑️  Clearing all API-sourced rates\n");

  const { error, count } = await supabase
    .from("exchange_rates")
    .delete()
    .eq("source", "API");

  if (error) {
    console.error("❌ Error:", error);
  } else {
    console.log(`✅ Deleted ${count} API-sourced rates`);
  }

  // Verify
  const { count: remaining } = await supabase
    .from("exchange_rates")
    .select("*", { count: "exact" })
    .eq("source", "API");

  console.log(`\n📊 Remaining API rates: ${remaining || 0}`);
}

clearApiRates().catch(console.error);
