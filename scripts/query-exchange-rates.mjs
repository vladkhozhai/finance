#!/usr/bin/env node
/**
 * Direct query of exchange_rates table
 * Uses direct Supabase client without Next.js context
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseKey = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

const supabase = createClient(supabaseUrl, supabaseKey);

async function queryRates() {
  console.log("\n=== Exchange Rates Database Query ===\n");

  // 1. Check API-fetched rates
  const { data: apiRates, error: apiError } = await supabase
    .from("exchange_rates")
    .select("*")
    .eq("source", "API")
    .order("last_fetched_at", { ascending: false })
    .limit(10);

  if (apiError) {
    console.error("❌ Error fetching API rates:", apiError);
  } else {
    console.log("✅ API-Fetched Rates:", apiRates.length, "found");
    console.table(
      apiRates.map((r) => ({
        from: r.from_currency,
        to: r.to_currency,
        rate: r.rate,
        provider: r.api_provider,
        fetched: r.last_fetched_at
          ? new Date(r.last_fetched_at).toLocaleString()
          : "N/A",
        expires: r.expires_at ? new Date(r.expires_at).toLocaleString() : "N/A",
        stale: r.is_stale,
      })),
    );

    // Calculate TTL for first rate
    if (apiRates.length > 0 && apiRates[0].expires_at) {
      const expiresAt = new Date(apiRates[0].expires_at);
      const now = new Date();
      const hoursUntilExpiration =
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      console.log(
        `\n⏰ Cache TTL: ${hoursUntilExpiration.toFixed(2)} hours until expiration`,
      );
    }
  }

  // 2. Check rate counts by source
  const { data: allRates, error: allError } = await supabase
    .from("exchange_rates")
    .select("source");

  if (!allError && allRates) {
    const counts = allRates.reduce((acc, r) => {
      acc[r.source] = (acc[r.source] || 0) + 1;
      return acc;
    }, {});
    console.log("\n📊 Rate Counts by Source:");
    console.table(counts);
  }

  // 3. Check inverse rates (USD ↔ EUR)
  const { data: inverseRates, error: invError } = await supabase
    .from("exchange_rates")
    .select("from_currency, to_currency, rate")
    .or(
      "and(from_currency.eq.USD,to_currency.eq.EUR),and(from_currency.eq.EUR,to_currency.eq.USD)",
    )
    .eq("source", "API")
    .order("from_currency");

  if (!invError && inverseRates && inverseRates.length >= 2) {
    console.log("\n🔄 Inverse Rate Verification (USD ↔ EUR):");
    console.table(inverseRates);
    const product =
      parseFloat(inverseRates[0].rate) * parseFloat(inverseRates[1].rate);
    console.log(
      `Product: ${product.toFixed(6)} (should be ≈ 1.0) - ${product >= 0.99 && product <= 1.01 ? "✅ PASS" : "❌ FAIL"}`,
    );
  }

  // 4. Check stale rates
  const { data: staleRates, error: staleError } = await supabase
    .from("exchange_rates")
    .select("from_currency, to_currency, expires_at, is_stale")
    .eq("is_stale", true);

  console.log(
    `\n⚠️  Stale Rates: ${staleRates?.length || 0} found ${staleRates?.length > 0 ? "" : "(Good!)"}`,
  );
  if (staleRates && staleRates.length > 0) {
    console.table(
      staleRates.slice(0, 5).map((r) => ({
        pair: `${r.from_currency} → ${r.to_currency}`,
        expires: r.expires_at ? new Date(r.expires_at).toLocaleString() : "N/A",
      })),
    );
  }

  // 5. Check UAH rates specifically
  const { data: uahRates, error: uahError } = await supabase
    .from("exchange_rates")
    .select("to_currency, rate, source, last_fetched_at")
    .eq("from_currency", "UAH")
    .order("last_fetched_at", { ascending: false })
    .limit(5);

  if (!uahError && uahRates) {
    console.log("\n💱 UAH Exchange Rates:");
    console.table(uahRates);
  }

  console.log("\n=== Query Complete ===\n");
}

queryRates().catch(console.error);
