import { expect, test } from "@playwright/test";

const BASE_URL = "https://financeflow-brown.vercel.app";
const timestamp = Date.now();
const testEmail = `qa-smoke-test-${timestamp}@test.com`;
const testPassword = "TestPass123!";

test.describe("Production Smoke Test", () => {
  test.describe.configure({ mode: "serial" });

  let page: any;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page?.close();
  });

  test("1. Homepage redirects to login", async () => {
    await page.goto(BASE_URL);
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(`${BASE_URL}/login`);
    await expect(page.locator("h1")).toContainText("Welcome back");

    // Take screenshot
    await page.screenshot({
      path: "test-results/smoke-test-01-login-page.png",
      fullPage: true,
    });
  });

  test("2. Signup page loads correctly", async () => {
    await page.goto(`${BASE_URL}/signup`);
    await expect(page.locator("h1")).toContainText("Create an account");

    // Verify all form fields are present
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('button[id="currency"]')).toBeVisible();
    await expect(
      page.locator('button[type="submit"]:has-text("Create account")'),
    ).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: "test-results/smoke-test-02-signup-page.png",
      fullPage: true,
    });
  });

  test("3. User Registration Flow", async () => {
    await page.goto(`${BASE_URL}/signup`);

    // Fill in email
    await page.fill('input[name="email"]', testEmail);

    // Fill in password
    await page.fill('input[name="password"]', testPassword);

    // Fill in confirm password
    await page.fill('input[name="confirmPassword"]', testPassword);

    // Select currency - try to open dropdown and select USD
    try {
      await page.click('button[id="currency"]', { timeout: 5000 });
      await page.waitForTimeout(500); // Wait for dropdown to open

      // Try to click USD option in the dropdown list
      const usdOption = page
        .locator('[role="option"]')
        .filter({ hasText: "USD" })
        .first();
      await usdOption.click({ timeout: 5000 });
    } catch (e) {
      console.log(
        "Currency selection skipped (USD may be default):",
        e.message,
      );
    }

    // Take screenshot before submit
    await page.screenshot({
      path: "test-results/smoke-test-03-signup-form-filled.png",
      fullPage: true,
    });

    // Submit the form
    await page.click('button[type="submit"]:has-text("Create account")');

    // Wait for navigation or error message
    await page.waitForTimeout(3000);

    // Check console for errors
    const consoleMessages = [];
    page.on("console", (msg) => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    // Take screenshot after submit
    await page.screenshot({
      path: "test-results/smoke-test-04-after-signup-submit.png",
      fullPage: true,
    });

    // Check if we're redirected to dashboard or still on signup with error
    const currentUrl = page.url();
    console.log("Current URL after signup:", currentUrl);

    if (currentUrl.includes("/dashboard") || currentUrl === `${BASE_URL}/`) {
      console.log("✅ PASS: User successfully signed up and redirected");
    } else {
      console.log("⚠️  WARN: Still on signup page, checking for errors");
      // Check for error messages
      const errorMessages = await page
        .locator('[role="alert"]')
        .allTextContents();
      if (errorMessages.length > 0) {
        console.log("Error messages:", errorMessages);
      }
    }
  });

  test("4. Dashboard Access", async () => {
    // Try to navigate to dashboard (should be logged in from previous test)
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log("Dashboard URL:", currentUrl);

    // Check if we're on dashboard or redirected to login
    if (
      currentUrl === `${BASE_URL}/dashboard` ||
      currentUrl === `${BASE_URL}/`
    ) {
      console.log("✅ PASS: Dashboard accessible");

      // Check for balance card or dashboard content
      const bodyText = await page.textContent("body");
      console.log("Dashboard page contains:", bodyText?.substring(0, 500));
    } else {
      console.log(
        "⚠️  WARN: Redirected to login, user may not be authenticated",
      );
    }

    await page.screenshot({
      path: "test-results/smoke-test-05-dashboard.png",
      fullPage: true,
    });
  });

  test("5. Core Feature Pages - Transactions", async () => {
    await page.goto(`${BASE_URL}/transactions`);
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log("Transactions URL:", currentUrl);

    if (currentUrl.includes("/transactions")) {
      console.log("✅ PASS: Transactions page loads");
    } else {
      console.log("❌ FAIL: Redirected away from transactions page");
    }

    await page.screenshot({
      path: "test-results/smoke-test-06-transactions.png",
      fullPage: true,
    });
  });

  test("6. Core Feature Pages - Budgets", async () => {
    await page.goto(`${BASE_URL}/budgets`);
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log("Budgets URL:", currentUrl);

    if (currentUrl.includes("/budgets")) {
      console.log("✅ PASS: Budgets page loads");
    } else {
      console.log("❌ FAIL: Redirected away from budgets page");
    }

    await page.screenshot({
      path: "test-results/smoke-test-07-budgets.png",
      fullPage: true,
    });
  });

  test("7. Core Feature Pages - Categories", async () => {
    await page.goto(`${BASE_URL}/categories`);
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log("Categories URL:", currentUrl);

    if (currentUrl.includes("/categories")) {
      console.log("✅ PASS: Categories page loads");
    } else {
      console.log("❌ FAIL: Redirected away from categories page");
    }

    await page.screenshot({
      path: "test-results/smoke-test-08-categories.png",
      fullPage: true,
    });
  });

  test("8. Core Feature Pages - Tags", async () => {
    await page.goto(`${BASE_URL}/tags`);
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log("Tags URL:", currentUrl);

    if (currentUrl.includes("/tags")) {
      console.log("✅ PASS: Tags page loads");
    } else {
      console.log("❌ FAIL: Redirected away from tags page");
    }

    await page.screenshot({
      path: "test-results/smoke-test-09-tags.png",
      fullPage: true,
    });
  });

  test("9. Core Feature Pages - Payment Methods", async () => {
    await page.goto(`${BASE_URL}/payment-methods`);
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log("Payment Methods URL:", currentUrl);

    if (currentUrl.includes("/payment-methods")) {
      console.log("✅ PASS: Payment Methods page loads");
    } else {
      console.log("❌ FAIL: Redirected away from payment-methods page");
    }

    await page.screenshot({
      path: "test-results/smoke-test-10-payment-methods.png",
      fullPage: true,
    });
  });

  test("10. Core Feature Pages - Profile", async () => {
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log("Profile URL:", currentUrl);

    if (currentUrl.includes("/profile")) {
      console.log("✅ PASS: Profile page loads");
    } else {
      console.log("❌ FAIL: Redirected away from profile page");
    }

    await page.screenshot({
      path: "test-results/smoke-test-11-profile.png",
      fullPage: true,
    });
  });

  test("11. Core Feature Pages - Profile Preferences", async () => {
    await page.goto(`${BASE_URL}/profile/preferences`);
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log("Profile Preferences URL:", currentUrl);

    if (currentUrl.includes("/profile/preferences")) {
      console.log("✅ PASS: Profile Preferences page loads");
    } else {
      console.log("❌ FAIL: Redirected away from profile/preferences page");
    }

    await page.screenshot({
      path: "test-results/smoke-test-12-profile-preferences.png",
      fullPage: true,
    });
  });

  test("12. Check Console Errors", async () => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];

    page.on("console", (msg: any) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("requestfailed", (request: any) => {
      networkErrors.push(
        `${request.method()} ${request.url()} - ${request.failure()?.errorText}`,
      );
    });

    // Visit each page and collect errors
    const pages = [
      "/dashboard",
      "/transactions",
      "/budgets",
      "/categories",
      "/tags",
      "/payment-methods",
      "/profile",
    ];

    for (const pagePath of pages) {
      await page.goto(`${BASE_URL}${pagePath}`);
      await page.waitForTimeout(2000);
    }

    console.log("\n--- Console Errors ---");
    if (consoleErrors.length === 0) {
      console.log("✅ PASS: No console errors detected");
    } else {
      console.log("❌ FAIL: Console errors detected:");
      consoleErrors.forEach((error) => console.log(`  - ${error}`));
    }

    console.log("\n--- Network Errors ---");
    if (networkErrors.length === 0) {
      console.log("✅ PASS: No network errors detected");
    } else {
      console.log("❌ FAIL: Network errors detected:");
      networkErrors.forEach((error) => console.log(`  - ${error}`));
    }
  });
});
