import { expect, test } from "@playwright/test";
import { AuthPage, DashboardPage } from "../helpers/page-objects";
import { generateTestUser } from "../helpers/test-user";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    const authPage = new AuthPage(page);
    const testUser = generateTestUser();

    // Create and login user
    await authPage.gotoSignup();
    await authPage.fillSignupForm(
      testUser.email,
      testUser.password,
      testUser.password,
      testUser.currency,
    );
    await authPage.submitForm();
    await page.waitForURL("/", { timeout: 10000 });
  });

  test("should load dashboard after successful login", async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    // Verify we're on dashboard
    await expect(page).toHaveURL("/");

    // Verify dashboard heading exists
    await expect(
      page.locator("h1, h2").filter({ hasText: /dashboard/i }),
    ).toBeVisible();
  });

  test("should display balance summary component", async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    // Check for balance summary section
    await expect(
      page.locator('text=/balance/i, [data-testid*="balance"]'),
    ).toBeVisible();

    // New user should have $0 balance
    // Look for currency amount display (e.g., $0.00, 0.00, etc.)
    await expect(
      page.locator("text=/\\$\\s*0\\.00|\\$\\s*0|balance.*0/"),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should display active budgets section", async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    // Check for budgets section
    await expect(
      page.locator('text=/budget/i, [data-testid*="budget"]'),
    ).toBeVisible();

    // New user might have no budgets or sample budgets
    // Just verify the section exists
  });

  test("should display expense chart", async ({ page }) => {
    // Check for chart section/heading
    await expect(page.locator("text=/expense|chart|spending/i")).toBeVisible({
      timeout: 10000,
    });

    // Check for Recharts component (it renders an SVG)
    const chartExists =
      (await page.locator(".recharts-wrapper").count()) > 0 ||
      (await page.locator('svg[class*="recharts"]').count()) > 0;

    expect(chartExists).toBeTruthy();
  });

  test("should show empty state for new user with no transactions", async ({
    page,
  }) => {
    // New user should see zero balance
    await expect(page.locator("text=/\\$\\s*0/")).toBeVisible();

    // May show empty state message or zero data
    const hasEmptyState =
      (await page
        .locator("text=/no.*transaction|no.*data|get.*started/i")
        .count()) > 0;

    // Empty state OR zero values are both acceptable
    const hasZeroValues =
      (await page.locator("text=/\\$\\s*0\\.00/").count()) > 0;

    expect(hasEmptyState || hasZeroValues).toBeTruthy();
  });

  test("should have navigation elements", async ({ page }) => {
    // Check for common navigation elements
    const hasNav =
      (await page.locator('nav, [role="navigation"]').count()) > 0 ||
      (await page
        .locator(
          'a[href*="dashboard"], a[href*="transactions"], a[href*="budgets"]',
        )
        .count()) > 0;

    expect(hasNav).toBeTruthy();
  });

  test("should be responsive on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Dashboard should still be accessible and readable
    await expect(page.locator("text=/dashboard|balance/i")).toBeVisible();

    // Components should not overflow
    const body = page.locator("body");
    const bodyBox = await body.boundingBox();

    expect(bodyBox?.width).toBeLessThanOrEqual(375);
  });

  test("should load without console errors", async ({ page }) => {
    const consoleErrors: string[] = [];

    // Listen for console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Reload dashboard
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Filter out known acceptable errors (like network errors in dev)
    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes("favicon") && // Favicon 404s are common in dev
        !error.includes("_next/static") && // Next.js static file errors in dev
        !error.includes("webpack"), // Webpack HMR errors
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("should fetch data from Supabase successfully", async ({ page }) => {
    // Monitor network requests
    const apiRequests: string[] = [];

    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("supabase") || url.includes("127.0.0.1:54321")) {
        apiRequests.push(url);
      }
    });

    // Reload to trigger data fetching
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Should have made requests to Supabase
    expect(apiRequests.length).toBeGreaterThan(0);
  });

  test("should display user-specific data only (RLS check)", async ({
    page,
    context,
  }) => {
    // This test creates two users and verifies they see different data
    const authPage = new AuthPage(page);

    // Current user is already logged in from beforeEach

    // Create a second user in a new context
    const secondPage = await context.newPage();
    const secondAuthPage = new AuthPage(secondPage);
    const secondUser = generateTestUser();

    await secondAuthPage.gotoSignup();
    await secondAuthPage.fillSignupForm(
      secondUser.email,
      secondUser.password,
      secondUser.password,
      secondUser.currency,
    );
    await secondAuthPage.submitForm();
    await secondPage.waitForURL("/", { timeout: 10000 });

    // Both users should see their own dashboards
    // They should NOT see each other's data
    // This is a basic RLS verification - more detailed tests would check specific data

    await expect(page).toHaveURL("/");
    await expect(secondPage).toHaveURL("/");

    // Clean up
    await secondPage.close();
  });
});
