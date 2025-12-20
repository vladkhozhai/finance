/**
 * Script to check active currencies returned by get_active_currencies RPC
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseKey = "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkActiveCurrencies() {
  console.log("🔍 Checking Active Currencies\n");

  // 1. Check if payment_methods table has data
  const { data: paymentMethods, error: pmError } = await supabase
    .from("payment_methods")
    .select("*");

  console.log(`1. Payment Methods in database: ${paymentMethods?.length || 0}`);
  if (pmError) {
    console.error("   Error:", pmError);
  } else if (paymentMethods && paymentMethods.length > 0) {
    console.log("   Sample payment methods:");
    paymentMethods.slice(0, 5).forEach((pm) => {
      console.log(`   - ${pm.name} (${pm.currency}) - Active: ${pm.is_active}`);
    });
  }

  // 2. Call get_active_currencies RPC
  console.log("\n2. Calling get_active_currencies() RPC...");
  const { data: activeCurrencies, error: rpcError } = await supabase.rpc(
    "get_active_currencies",
  );

  if (rpcError) {
    console.error("   ❌ RPC Error:", rpcError);
    console.log("   This explains why no rates are being fetched!");
  } else if (!activeCurrencies || activeCurrencies.length === 0) {
    console.log(
      "   ⚠️  RPC returned empty array or null: " +
        JSON.stringify(activeCurrencies),
    );
    console.log(
      "   This means no active payment methods with currencies found",
    );
  } else {
    console.log(`   ✅ Active currencies: ${activeCurrencies.join(", ")}`);
  }

  // 3. Check what refreshAllRates() would use
  console.log("\n3. Fallback currencies (if RPC fails):");
  const fallback = ["USD", "EUR", "GBP", "UAH"];
  console.log(`   ${fallback.join(", ")}`);

  // 4. Check if any API-sourced rates exist at all
  const { data: apiRates, count } = await supabase
    .from("exchange_rates")
    .select("*", { count: "exact" })
    .eq("source", "API");

  console.log(`\n4. API-sourced rates in database: ${count || 0}`);

  if (apiRates && apiRates.length > 0) {
    console.log("   Recent rates:");
    apiRates.slice(0, 5).forEach((rate) => {
      console.log(`   ${rate.from_currency}→${rate.to_currency}: ${rate.rate}`);
    });
  }
}

checkActiveCurrencies().catch(console.error);
