/**
 * Card #26 Retest: Profile UX Architecture Refactor
 * Testing P0 and P1 bug fixes:
 * - P0: Preferences save functionality (default_payment_method_id removed)
 * - P1: Backward compatibility for query parameter redirects
 */

import { expect, test } from "@playwright/test";
import { AuthPage } from "../helpers/page-objects";
import { generateTestUser } from "../helpers/test-user";

test.describe("Card #26 Retest - Profile UX Refactor", () => {
  let testUser: any;

  test.beforeEach(async ({ page }) => {
    const authPage = new AuthPage(page);
    testUser = generateTestUser();

    // Create and login test user
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

  test.describe("P0 Fix: Preferences Save Functionality", () => {
    test("should save currency preferences without errors", async ({
      page,
    }) => {
      // Navigate to preferences page
      await page.goto("/profile/preferences");
      await page.waitForLoadState("networkidle");

      // Verify preferences page loads
      await expect(page).toHaveURL("/profile/preferences");
      await expect(
        page.locator("h1, h2").filter({ hasText: /default currency/i }),
      ).toBeVisible();

      // Click Shadcn Select trigger to open dropdown
      const selectTrigger = page.locator('button[role="combobox"]#currency');
      await selectTrigger.click();

      // Wait for dropdown to open
      await page.waitForTimeout(500);

      // Click EUR option
      const eurOption = page.locator('[role="option"]', {
        hasText: "EUR - Euro",
      });
      await eurOption.click();

      // Wait for dropdown to close
      await page.waitForTimeout(500);

      // Find and click save button
      const saveButton = page.locator('button[type="submit"]', {
        hasText: /save/i,
      });
      await saveButton.click();

      // Wait for success toast
      const successToast = page
        .locator('[role="status"]')
        .or(page.locator("text=/success|saved/i"));
      await expect(successToast.first()).toBeVisible({ timeout: 5000 });

      // Verify no error toasts appeared
      const errorToast = page.locator("text=/could not find.*column|error/i");
      await expect(errorToast).not.toBeVisible();

      // Reload page and verify currency persisted
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Verify currency dropdown shows EUR
      const selectValue = page.locator('button[role="combobox"]#currency');
      await expect(selectValue).toContainText("EUR");
    });

    test("should save preferences multiple times without errors", async ({
      page,
    }) => {
      await page.goto("/profile/preferences");
      await page.waitForLoadState("networkidle");

      const selectTrigger = page.locator('button[role="combobox"]#currency');
      const saveButton = page.locator('button[type="submit"]', {
        hasText: /save/i,
      });

      // Save EUR
      await selectTrigger.click();
      await page.waitForTimeout(300);
      await page.locator('[role="option"]', { hasText: "EUR - Euro" }).click();
      await page.waitForTimeout(300);
      await saveButton.click();
      await page.waitForTimeout(1500);

      // Save GBP
      await selectTrigger.click();
      await page.waitForTimeout(300);
      await page
        .locator('[role="option"]', { hasText: "GBP - British Pound" })
        .click();
      await page.waitForTimeout(300);
      await saveButton.click();
      await page.waitForTimeout(1500);

      // Save USD
      await selectTrigger.click();
      await page.waitForTimeout(300);
      await page
        .locator('[role="option"]', { hasText: "USD - US Dollar" })
        .click();
      await page.waitForTimeout(300);
      await saveButton.click();
      await page.waitForTimeout(1500);

      // Verify no "could not find column" errors appeared
      const errorToast = page.locator(
        "text=/could not find.*column|database error/i",
      );
      await expect(errorToast).not.toBeVisible();

      // Final currency should be USD
      await page.reload();
      await page.waitForLoadState("networkidle");
      const selectValue = page.locator('button[role="combobox"]#currency');
      await expect(selectValue).toContainText("USD");
    });
  });

  test.describe("P1 Fix: Backward Compatibility - Query Parameter Redirects", () => {
    test("should redirect /profile?tab=payment-methods to /profile/payment-methods", async ({
      page,
    }) => {
      await page.goto("/profile?tab=payment-methods");
      await page.waitForURL("/profile/payment-methods", { timeout: 5000 });
      expect(page.url()).toContain("/profile/payment-methods");
      expect(page.url()).not.toContain("?tab=");
    });

    test("should redirect /profile?tab=categories to /profile/categories", async ({
      page,
    }) => {
      await page.goto("/profile?tab=categories");
      await page.waitForURL("/profile/categories", { timeout: 5000 });
      expect(page.url()).toContain("/profile/categories");
      expect(page.url()).not.toContain("?tab=");
    });

    test("should redirect /profile?tab=tags to /profile/tags", async ({
      page,
    }) => {
      await page.goto("/profile?tab=tags");
      await page.waitForURL("/profile/tags", { timeout: 5000 });
      expect(page.url()).toContain("/profile/tags");
      expect(page.url()).not.toContain("?tab=");
    });

    test("should redirect /profile?tab=preferences to /profile/preferences", async ({
      page,
    }) => {
      await page.goto("/profile?tab=preferences");
      await page.waitForURL("/profile/preferences", { timeout: 5000 });
      expect(page.url()).toContain("/profile/preferences");
      expect(page.url()).not.toContain("?tab=");
    });

    test("should redirect /profile?tab=overview to /profile/overview", async ({
      page,
    }) => {
      await page.goto("/profile?tab=overview");
      await page.waitForURL("/profile/overview", { timeout: 5000 });
      expect(page.url()).toContain("/profile/overview");
      expect(page.url()).not.toContain("?tab=");
    });

    test("should redirect unknown tab to /profile/overview", async ({
      page,
    }) => {
      await page.goto("/profile?tab=nonexistent");
      await page.waitForURL("/profile/overview", { timeout: 5000 });
      expect(page.url()).toContain("/profile/overview");
      expect(page.url()).not.toContain("?tab=");
    });

    test("should redirect /profile without query to /profile/overview", async ({
      page,
    }) => {
      await page.goto("/profile");
      await page.waitForURL("/profile/overview", { timeout: 5000 });
      expect(page.url()).toContain("/profile/overview");
    });
  });

  test.describe("Regression: Navigation and UI", () => {
    test("should navigate directly to all profile sections", async ({
      page,
    }) => {
      // Test direct navigation to each profile section
      await page.goto("/profile/overview");
      await expect(page).toHaveURL("/profile/overview");

      await page.goto("/profile/payment-methods");
      await expect(page).toHaveURL("/profile/payment-methods");

      await page.goto("/profile/categories");
      await expect(page).toHaveURL("/profile/categories");

      await page.goto("/profile/tags");
      await expect(page).toHaveURL("/profile/tags");

      await page.goto("/profile/preferences");
      await expect(page).toHaveURL("/profile/preferences");
    });

    test("should display profile overview page with user info", async ({
      page,
    }) => {
      await page.goto("/profile/overview");
      await page.waitForLoadState("networkidle");

      // Verify page loaded
      await expect(page).toHaveURL("/profile/overview");

      // Check for "Overview" heading or email display
      const pageContent = page.locator("main, [role='main']");
      await expect(pageContent).toBeVisible();

      // The page should have some profile-related content
      const hasProfileContent =
        (await page.locator("text=/email|profile|account/i").count()) > 0;
      expect(hasProfileContent).toBeTruthy();
    });

    test("should render on mobile viewport without errors", async ({
      page,
    }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto("/profile/overview");
      await page.waitForLoadState("networkidle");

      // Verify page loads on mobile
      await expect(page).toHaveURL("/profile/overview");

      // Verify main content is visible
      const mainContent = page.locator("main, [role='main']");
      await expect(mainContent).toBeVisible();

      // No layout errors - page should render
      const pageBody = page.locator("body");
      await expect(pageBody).toBeVisible();
    });
  });
});
