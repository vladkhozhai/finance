/**
 * Script to simulate refreshAllRates() with detailed logging
 * Tests the exact same logic as the service
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseKey = "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz";
const API_URL = "https://open.er-api.com/v6/latest/USD";
const API_PROVIDER = "exchangerate-api.com";
const CACHE_TTL_HOURS = 24;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchRateFromApi(
  fromCurrency: string,
  toCurrency: string,
): Promise<number | null> {
  try {
    console.log(`    Fetching ${fromCurrency}→${toCurrency} from API...`);

    const response = await fetch(API_URL, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.log(`      ❌ API request failed: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.result !== "success" || !data.rates) {
      console.log("      ❌ API returned error or no rates");
      return null;
    }

    const rates = data.rates;

    // Handle direct conversion from USD
    if (fromCurrency === "USD") {
      const rate = rates[toCurrency] || null;
      console.log(`      ✅ USD→${toCurrency} = ${rate}`);
      return rate;
    }

    // Handle conversion to USD
    if (toCurrency === "USD") {
      const fromRate = rates[fromCurrency];
      const rate = fromRate ? 1 / fromRate : null;
      console.log(`      ✅ ${fromCurrency}→USD = ${rate} (inverse)`);
      return rate;
    }

    // Handle triangulation
    const fromToUsd = rates[fromCurrency];
    const toFromUsd = rates[toCurrency];

    if (!fromToUsd || !toFromUsd) {
      console.log(`      ❌ Missing rates for triangulation`);
      return null;
    }

    const rate = toFromUsd / fromToUsd;
    console.log(
      `      ✅ ${fromCurrency}→${toCurrency} = ${rate} (triangulated)`,
    );
    return rate;
  } catch (error) {
    console.log(`      ❌ Exception:`, error);
    return null;
  }
}

async function storeRate(
  fromCurrency: string,
  toCurrency: string,
  rate: number,
): Promise<void> {
  try {
    console.log(`      Storing ${fromCurrency}→${toCurrency} = ${rate}...`);

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

    const { data, error } = await supabase
      .from("exchange_rates")
      .upsert(rateData, {
        onConflict: "from_currency,to_currency,date",
      })
      .select()
      .single();

    if (error) {
      console.log(`        ❌ Store failed:`, error.message);
      throw error;
    }

    console.log(`        ✅ Stored successfully (id: ${data.id})`);

    // Store inverse
    const inverseRateData = {
      from_currency: toCurrency,
      to_currency: fromCurrency,
      rate: 1 / rate,
      date: today,
      source: "API",
      api_provider: API_PROVIDER,
      last_fetched_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      is_stale: false,
      fetch_error_count: 0,
    };

    const { data: inverseData, error: inverseError } = await supabase
      .from("exchange_rates")
      .upsert(inverseRateData, {
        onConflict: "from_currency,to_currency,date",
      })
      .select()
      .single();

    if (inverseError) {
      console.log(`        ❌ Inverse store failed:`, inverseError.message);
      throw inverseError;
    }

    console.log(`        ✅ Inverse stored (id: ${inverseData.id})`);
  } catch (error) {
    console.log(`      ❌ Exception in storeRate:`, error);
    throw error;
  }
}

async function simulateRefreshAll() {
  console.log("🔄 Simulating refreshAllRates()\n");

  // 1. Get active currencies
  const { data: activeCurrencies, error: currError } = await supabase.rpc(
    "get_active_currencies",
  );

  if (currError || !activeCurrencies) {
    console.error("❌ Failed to get active currencies:", currError);
    return;
  }

  let targetCurrencies = activeCurrencies;

  // Always include USD
  if (!targetCurrencies.includes("USD")) {
    targetCurrencies.push("USD");
  }

  console.log(`1. Target currencies: ${targetCurrencies.join(", ")}\n`);

  // 2. Fetch rates for all pairs
  const promises: Promise<void>[] = [];
  let successCount = 0;
  let failCount = 0;

  console.log("2. Fetching rates for all currency pairs:\n");

  for (const fromCurrency of targetCurrencies) {
    for (const toCurrency of targetCurrencies) {
      if (fromCurrency !== toCurrency) {
        promises.push(
          (async () => {
            try {
              console.log(`  ${fromCurrency}→${toCurrency}:`);
              const rate = await fetchRateFromApi(fromCurrency, toCurrency);

              if (rate !== null) {
                await storeRate(fromCurrency, toCurrency, rate);
                successCount++;
              } else {
                failCount++;
              }
            } catch (err) {
              console.log(
                `    ❌ Failed to refresh ${fromCurrency}→${toCurrency}:`,
                err,
              );
              failCount++;
            }
          })(),
        );
      }
    }
  }

  await Promise.all(promises);

  console.log(`\n3. Results:`);
  console.log(`   ✅ Success: ${successCount} rates`);
  console.log(`   ❌ Failed: ${failCount} rates`);

  // 4. Mark stale rates
  console.log("\n4. Marking stale rates...");
  const { data: staleCount, error: staleError } =
    await supabase.rpc("mark_stale_rates");

  if (staleError) {
    console.error("   ❌ Mark stale failed:", staleError);
  } else {
    console.log(`   ✅ Marked ${staleCount} rates as stale`);
  }

  // 5. Verify rates in database
  const { data: apiRates, count } = await supabase
    .from("exchange_rates")
    .select("*", { count: "exact" })
    .eq("source", "API");

  console.log(`\n5. Final verification:`);
  console.log(`   Total API-sourced rates in DB: ${count || 0}`);
}

simulateRefreshAll().catch(console.error);
