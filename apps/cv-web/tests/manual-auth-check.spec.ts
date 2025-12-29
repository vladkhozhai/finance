import { test, expect } from "@playwright/test";

/**
 * Manual authentication check - runs in isolated browser contexts
 * to verify middleware redirects work correctly
 */

test.describe("Manual Auth Verification", () => {
  test("fresh browser context should redirect dashboard to sign-in", async ({
    browser,
  }) => {
    // Create a completely fresh browser context with no state
    const context = await browser.newContext({
      storageState: undefined,
    });
    const page = await context.newPage();

    // Navigate to dashboard
    await page.goto("/dashboard");

    // Should be redirected to sign-in
    await page.waitForURL(/\/sign-in/, { timeout: 5000 });

    // Verify we're on sign-in page
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(
      page.locator('text="Welcome to CVFlow"'),
    ).toBeVisible();

    await context.close();
  });

  test("fresh browser context should redirect profile to sign-in", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: undefined,
    });
    const page = await context.newPage();

    await page.goto("/profile/personal");
    await page.waitForURL(/\/sign-in/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/sign-in/);

    await context.close();
  });
});
