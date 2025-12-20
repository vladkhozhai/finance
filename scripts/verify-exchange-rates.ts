/**
 * Script to verify exchange rates in database
 * Tests bug fix for Card #21 - Exchange Rate Management
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz";

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyExchangeRates() {
  console.log("🔍 Verifying Exchange Rates After Bug Fix\n");

  // 1. Check total API-sourced rates
  const { data: apiRates, error: countError } = await supabase
    .from("exchange_rates")
    .select("*", { count: "exact" })
    .eq("source", "API");

  if (countError) {
    console.error("❌ Error counting rates:", countError);
    return;
  }

  console.log(`✅ Total API-sourced rates: ${apiRates?.length || 0}`);

  if (!apiRates || apiRates.length === 0) {
    console.log("❌ BUG NOT FIXED: No rates found with source='API'");
    console.log(
      "This means the API response is still not being parsed correctly.",
    );
    return;
  }

  console.log("✅ BUG FIXED: Rates are being fetched from API!\n");

  // 2. Show recent rates
  console.log("📊 Recent API-sourced rates:");
  const recentRates = apiRates.slice(0, 10);
  recentRates.forEach((rate) => {
    console.log(
      `  ${rate.from_currency} → ${rate.to_currency}: ${rate.rate} (${rate.api_provider}, fetched: ${rate.last_fetched_at})`,
    );
  });

  // 3. Check key currency pairs
  console.log("\n🔑 Key Currency Pairs:");
  const keyCurrencies = ["USD-EUR", "EUR-USD", "USD-UAH", "UAH-USD"];

  for (const pair of keyCurrencies) {
    const [from, to] = pair.split("-");
    const rate = apiRates.find(
      (r) => r.from_currency === from && r.to_currency === to,
    );

    if (rate) {
      console.log(`  ✅ ${pair}: ${rate.rate}`);
    } else {
      console.log(`  ⚠️  ${pair}: Not found`);
    }
  }

  // 4. Check cache freshness
  const now = new Date();
  const oldestRate = apiRates.sort(
    (a, b) =>
      new Date(a.last_fetched_at).getTime() -
      new Date(b.last_fetched_at).getTime(),
  )[0];
  const newestRate = apiRates.sort(
    (a, b) =>
      new Date(b.last_fetched_at).getTime() -
      new Date(a.last_fetched_at).getTime(),
  )[0];

  console.log("\n⏱️  Cache Freshness:");
  console.log(`  Oldest rate: ${oldestRate.last_fetched_at}`);
  console.log(`  Newest rate: ${newestRate.last_fetched_at}`);

  const ageMinutes = Math.floor(
    (now.getTime() - new Date(newestRate.last_fetched_at).getTime()) / 60000,
  );
  console.log(`  Age: ${ageMinutes} minutes ago`);

  if (ageMinutes < 5) {
    console.log("  ✅ Rates are fresh (< 5 minutes old)");
  } else {
    console.log("  ⚠️  Rates are stale (> 5 minutes old)");
  }
}

verifyExchangeRates().catch(console.error);
