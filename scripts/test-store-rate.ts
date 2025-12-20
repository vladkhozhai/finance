/**
 * Script to test storeRate() method manually
 * Simulates what the service should do
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseKey = "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz";
const API_PROVIDER = "exchangerate-api.com";
const CACHE_TTL_HOURS = 24;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStoreRate() {
  console.log("🧪 Testing Rate Storage\n");

  const fromCurrency = "USD";
  const toCurrency = "EUR";
  const rate = 0.92;

  console.log(`Attempting to store: ${fromCurrency}→${toCurrency} = ${rate}`);

  try {
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + CACHE_TTL_HOURS * 60 * 60 * 1000,
    );
    const today = now.toISOString().split("T")[0];

    const rateData = {
      from_currency: fromCurrency,
      to_currency: toCurrency,
      rate: rate,
      date: today,
      source: "API",
      api_provider: API_PROVIDER,
      last_fetched_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      is_stale: false,
      fetch_error_count: 0,
    };

    console.log("\n1. Attempting upsert with data:");
    console.log(JSON.stringify(rateData, null, 2));

    const { data, error } = await supabase
      .from("exchange_rates")
      .upsert(rateData, {
        onConflict: "from_currency,to_currency,date",
      })
      .select()
      .single();

    if (error) {
      console.error("\n❌ UPSERT FAILED:");
      console.error("   Error code:", error.code);
      console.error("   Error message:", error.message);
      console.error("   Error details:", error.details);
      console.error("   Error hint:", error.hint);
    } else {
      console.log("\n✅ UPSERT SUCCEEDED:");
      console.log("   Stored rate:", data);
    }

    // 2. Verify it's in the database
    const { data: verifyData, error: verifyError } = await supabase
      .from("exchange_rates")
      .select("*")
      .eq("from_currency", fromCurrency)
      .eq("to_currency", toCurrency)
      .eq("source", "API")
      .single();

    if (verifyError) {
      console.error("\n❌ VERIFICATION FAILED:");
      console.error("   Could not find rate after insert");
    } else {
      console.log("\n✅ VERIFICATION SUCCEEDED:");
      console.log("   Found rate in database:", verifyData);
    }
  } catch (error) {
    console.error("\n❌ EXCEPTION:", error);
  }
}

testStoreRate().catch(console.error);
