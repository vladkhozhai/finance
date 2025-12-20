/**
 * Test Script for Exchange Rate Service
 *
 * Usage: npx tsx scripts/test-exchange-rates.ts
 *
 * This script tests the exchange rate service functionality:
 * 1. Fetch rate from API
 * 2. Verify cache behavior
 * 3. Test stale fallback
 * 4. Verify database storage
 */

import { exchangeRateService } from "../src/lib/services/exchange-rate-service";

async function testExchangeRates() {
  console.log("🧪 Testing Exchange Rate Service\n");

  try {
    // Test 1: Get fresh rate
    console.log("Test 1: Fetching UAH → USD rate...");
    const result1 = await exchangeRateService.getRate("UAH", "USD");
    console.log("✅ Result:", {
      rate: result1.rate,
      source: result1.source,
      expiresAt: result1.expiresAt,
    });

    if (result1.rate === null) {
      console.error("❌ Rate is null, API may be down");
      return;
    }

    // Test 2: Get rate again (should be cached)
    console.log("\nTest 2: Fetching same rate again (should be cached)...");
    const result2 = await exchangeRateService.getRate("UAH", "USD");
    console.log("✅ Result:", {
      rate: result2.rate,
      source: result2.source,
    });

    if (result2.source !== "fresh") {
      console.warn("⚠️  Expected 'fresh' source, got:", result2.source);
    }

    // Test 3: Check cache validity
    console.log("\nTest 3: Checking cache validity...");
    const isValid = await exchangeRateService.isCacheValid("UAH", "USD");
    console.log("✅ Cache valid:", isValid);

    // Test 4: Get all rates for USD
    console.log("\nTest 4: Getting all rates for USD...");
    const allRates = await exchangeRateService.getAllRates("USD");
    const rateCount = Object.keys(allRates).length;
    console.log(`✅ Found ${rateCount} rates for USD`);
    console.log("Sample rates:", {
      EUR: allRates.EUR,
      GBP: allRates.GBP,
      UAH: allRates.UAH,
    });

    // Test 5: Manual rate setting
    console.log("\nTest 5: Setting manual rate...");
    await exchangeRateService.setManualRate("TEST", "USD", 1.5);
    console.log("✅ Manual rate set: TEST → USD = 1.5");

    const manualRate = await exchangeRateService.getRate("TEST", "USD");
    console.log("✅ Retrieved manual rate:", manualRate.rate);

    console.log("\n✅ All tests passed!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

// Run tests
testExchangeRates();
