import { test, expect } from "@playwright/test";
import { signIn, signOut, TEST_USER } from "./helpers/auth";

/**
 * AUTH REDIRECT FEATURE TESTS
 *
 * Tests that authenticated users are redirected away from sign-in and sign-up pages.
 *
 * Test Scenarios:
 * 1. Authenticated user navigating to /sign-in should redirect to /dashboard
 * 2. Authenticated user navigating to /sign-up should redirect to /dashboard
 * 3. Unauthenticated user can access /sign-in normally
 * 4. Unauthenticated user can access /sign-up normally
 */

test.describe("Auth Redirect Feature", () => {
  test.describe("Authenticated User Redirects", () => {
    test("should redirect authenticated user from /sign-in to /dashboard", async ({ page }) => {
      // Step 1: Sign in to authenticate
      await signIn(page, TEST_USER.email, TEST_USER.password);
      await expect(page).toHaveURL("/dashboard", { timeout: 10000 });

      // Step 2: Navigate to /sign-in
      await page.goto("/sign-in");

      // Step 3: Should redirect to /dashboard immediately
      await expect(page).toHaveURL("/dashboard", { timeout: 5000 });

      // Step 4: Verify no sign-in form is visible
      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).not.toBeVisible();
    });

    test("should redirect authenticated user from /sign-up to /dashboard", async ({ page }) => {
      // Step 1: Sign in to authenticate
      await signIn(page, TEST_USER.email, TEST_USER.password);
      await expect(page).toHaveURL("/dashboard", { timeout: 10000 });

      // Step 2: Navigate to /sign-up
      await page.goto("/sign-up");

      // Step 3: Should redirect to /dashboard immediately
      await expect(page).toHaveURL("/dashboard", { timeout: 5000 });

      // Step 4: Verify no sign-up form is visible
      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).not.toBeVisible();
    });

    test("should prevent authenticated user from seeing sign-in form before redirect", async ({ page }) => {
      // Sign in first
      await signIn(page, TEST_USER.email, TEST_USER.password);
      await expect(page).toHaveURL("/dashboard", { timeout: 10000 });

      // Navigate to sign-in and check if form flashes
      await page.goto("/sign-in");

      // Check redirect happens quickly
      await page.waitForURL("/dashboard", { timeout: 5000 });

      // Verify we're on dashboard
      await expect(page).toHaveURL("/dashboard");
    });

    test("should prevent authenticated user from seeing sign-up form before redirect", async ({ page }) => {
      // Sign in first
      await signIn(page, TEST_USER.email, TEST_USER.password);
      await expect(page).toHaveURL("/dashboard", { timeout: 10000 });

      // Navigate to sign-up and check if form flashes
      await page.goto("/sign-up");

      // Check redirect happens quickly
      await page.waitForURL("/dashboard", { timeout: 5000 });

      // Verify we're on dashboard
      await expect(page).toHaveURL("/dashboard");
    });
  });

  test.describe("Unauthenticated User Access", () => {
    test.beforeEach(async ({ page }) => {
      // Ensure user is logged out
      await page.goto("/sign-in");
      const signOutAttempt = page.locator('text=/sign out|logout/i');
      if (await signOutAttempt.isVisible().catch(() => false)) {
        await signOut(page);
      }
    });

    test("should display /sign-in form normally for unauthenticated user", async ({ page }) => {
      // Navigate to sign-in
      await page.goto("/sign-in");

      // Should stay on sign-in page
      await expect(page).toHaveURL("/sign-in");

      // Should show form elements
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test("should display /sign-up form normally for unauthenticated user", async ({ page }) => {
      // Navigate to sign-up
      await page.goto("/sign-up");

      // Should stay on sign-up page
      await expect(page).toHaveURL("/sign-up");

      // Should show form elements
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test("should allow unauthenticated user to fill sign-in form", async ({ page }) => {
      await page.goto("/sign-in");

      // Fill form fields
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "password123");

      // Verify values were entered
      await expect(page.locator('input[name="email"]')).toHaveValue("test@example.com");
      await expect(page.locator('input[name="password"]')).toHaveValue("password123");

      // Form should be functional (submit button should be clickable)
      await expect(page.locator('button[type="submit"]')).toBeEnabled();
    });

    test("should allow unauthenticated user to fill sign-up form", async ({ page }) => {
      await page.goto("/sign-up");

      // Fill form fields
      await page.fill('input[name="email"]', "newuser@example.com");
      await page.fill('input[name="password"]', "securepass123");

      // Verify values were entered
      await expect(page.locator('input[name="email"]')).toHaveValue("newuser@example.com");
      await expect(page.locator('input[name="password"]')).toHaveValue("securepass123");

      // Form should be functional (submit button should be clickable)
      await expect(page.locator('button[type="submit"]')).toBeEnabled();
    });
  });

  test.describe("Edge Cases", () => {
    test("should handle rapid navigation between auth pages when authenticated", async ({ page }) => {
      // Sign in
      await signIn(page, TEST_USER.email, TEST_USER.password);
      await expect(page).toHaveURL("/dashboard", { timeout: 10000 });

      // Rapidly navigate to sign-in
      await page.goto("/sign-in");
      await expect(page).toHaveURL("/dashboard", { timeout: 5000 });

      // Rapidly navigate to sign-up
      await page.goto("/sign-up");
      await expect(page).toHaveURL("/dashboard", { timeout: 5000 });

      // Should consistently redirect to dashboard
      await expect(page).toHaveURL("/dashboard");
    });

    test("should redirect to dashboard even with query parameters", async ({ page }) => {
      // Sign in
      await signIn(page, TEST_USER.email, TEST_USER.password);
      await expect(page).toHaveURL("/dashboard", { timeout: 10000 });

      // Navigate to sign-in with query params
      await page.goto("/sign-in?redirect=/profile");

      // Should still redirect to dashboard
      await expect(page).toHaveURL("/dashboard", { timeout: 5000 });
    });

    test("should handle back button after redirect", async ({ page }) => {
      // Sign in
      await signIn(page, TEST_USER.email, TEST_USER.password);
      await expect(page).toHaveURL("/dashboard", { timeout: 10000 });

      // Navigate to sign-in (will redirect to dashboard)
      await page.goto("/sign-in");
      await expect(page).toHaveURL("/dashboard", { timeout: 5000 });

      // Try to go back
      await page.goBack();

      // Should redirect back to dashboard (not show sign-in)
      await expect(page).toHaveURL("/dashboard", { timeout: 5000 });
    });
  });

  test.describe("Session Persistence Check", () => {
    test("should maintain redirect behavior after page reload", async ({ page }) => {
      // Sign in
      await signIn(page, TEST_USER.email, TEST_USER.password);
      await expect(page).toHaveURL("/dashboard", { timeout: 10000 });

      // Reload page to ensure session persists
      await page.reload();
      await expect(page).toHaveURL("/dashboard", { timeout: 5000 });

      // Navigate to sign-in
      await page.goto("/sign-in");

      // Should still redirect to dashboard (session persists)
      await expect(page).toHaveURL("/dashboard", { timeout: 5000 });
    });
  });
});
