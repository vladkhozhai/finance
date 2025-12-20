/**
 * Debug script to test API fetching directly
 * Simulates what refreshAllRates() does
 */

const API_URL = "https://open.er-api.com/v6/latest/USD";

async function testApiFetch() {
  console.log("🔍 Testing Exchange Rate API Fetch\n");
  console.log(`API URL: ${API_URL}\n`);

  try {
    console.log("1. Fetching from API...");
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error("❌ API request failed");
      return;
    }

    console.log("\n2. Parsing JSON response...");
    const data = await response.json();

    console.log(`   Result: ${data.result}`);
    console.log(`   Base Code: ${data.base_code}`);
    console.log(`   Has 'rates' field: ${!!data.rates}`);
    console.log(`   Has 'conversion_rates' field: ${!!data.conversion_rates}`);

    if (data.rates) {
      console.log(
        `   ✅ Found 'rates' field with ${Object.keys(data.rates).length} currencies`,
      );
      console.log("\n3. Sample rates from 'rates' field:");
      const samples = ["EUR", "GBP", "UAH", "JPY", "CAD"];
      samples.forEach((curr) => {
        const rate = data.rates[curr];
        if (rate) {
          console.log(`   ${curr}: ${rate}`);
        } else {
          console.log(`   ${curr}: NOT FOUND`);
        }
      });
    }

    if (data.conversion_rates) {
      console.log(
        `   ⚠️  Found 'conversion_rates' field with ${Object.keys(data.conversion_rates).length} currencies`,
      );
      console.log("\n4. Sample rates from 'conversion_rates' field:");
      const samples = ["EUR", "GBP", "UAH", "JPY", "CAD"];
      samples.forEach((curr) => {
        const rate = data.conversion_rates[curr];
        if (rate) {
          console.log(`   ${curr}: ${rate}`);
        } else {
          console.log(`   ${curr}: NOT FOUND`);
        }
      });
    }

    console.log("\n5. Full response structure:");
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testApiFetch().catch(console.error);
