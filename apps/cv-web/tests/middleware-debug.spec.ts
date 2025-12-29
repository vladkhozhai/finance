import { test, expect } from "@playwright/test";

/**
 * MIDDLEWARE DEBUG TEST
 *
 * This test helps debug why middleware redirects are not working.
 */

test.describe("Middleware Debug", () => {
  test("should show dashboard response for unauthenticated user", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Capture network requests
    const requests: Array<{ url: string; status: number | null }> = [];
    page.on("response", (response) => {
      requests.push({
        url: response.url(),
        status: response.status(),
      });
    });

    // Navigate to dashboard
    const response = await page.goto("/dashboard");

    console.log(`\n=== Dashboard Response ===`);
    console.log(`Status: ${response?.status()}`);
    console.log(`URL after load: ${page.url()}`);
    console.log(`\nAll requests:`);
    requests.forEach((req) => {
      console.log(`  ${req.status} - ${req.url}`);
    });

    // Check cookies
    const cookies = await context.cookies();
    console.log(`\nCookies (${cookies.length}):`);
    cookies.forEach((cookie) => {
      console.log(`  ${cookie.name}: ${cookie.value.substring(0, 50)}...`);
    });

    // Take screenshot
    await page.screenshot({ path: "test-results/middleware-debug-dashboard.png" });

    await context.close();
  });

  test("should show sign-in page response", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const response = await page.goto("/sign-in");

    console.log(`\n=== Sign-In Response ===`);
    console.log(`Status: ${response?.status()}`);
    console.log(`URL after load: ${page.url()}`);

    await context.close();
  });
});
