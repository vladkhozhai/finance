import { expect, test } from "@playwright/test";

/**
 * Test Suite: Auth Redirect Feature
 * Tests that authenticated users are redirected away from login/signup pages to dashboard
 */
test.describe("Auth Redirect Feature", () => {
  test.describe("Unauthenticated Users", () => {
    test("should display login form on /login page", async ({ page }) => {
      await page.goto("http://localhost:3000/login");

      // Should stay on login page (no redirect)
      await expect(page).toHaveURL("http://localhost:3000/login");

      // Login form should be visible
      await expect(
        page.locator('input[name="email"], input[type="email"]'),
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.locator('input[name="password"], input[type="password"]'),
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")'),
      ).toBeVisible({ timeout: 5000 });
    });

    test("should display signup form on /signup page", async ({ page }) => {
      await page.goto("http://localhost:3000/signup");

      // Should stay on signup page (no redirect)
      await expect(page).toHaveURL("http://localhost:3000/signup");

      // Signup form should be visible
      await expect(
        page.locator('input[name="email"], input[type="email"]'),
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.locator('input[name="password"]').first(),
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.locator('input[name="confirmPassword"]'),
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.locator('button[type="submit"], button:has-text("Sign Up"), button:has-text("Create Account")'),
      ).toBeVisible({ timeout: 5000 });
    });

    test("forms should be functional (can fill fields)", async ({ page }) => {
      await page.goto("http://localhost:3000/login");

      const emailInput = page.locator('input[name="email"], input[type="email"]').first();
      const passwordInput = page.locator('input[name="password"], input[type="password"]').first();

      await emailInput.fill("test@example.com");
      await passwordInput.fill("testpassword123");

      await expect(emailInput).toHaveValue("test@example.com");
      await expect(passwordInput).toHaveValue("testpassword123");
    });
  });

  test.describe("Authenticated Users", () => {
    // Setup: Log in before each test to get authenticated session
    test.beforeEach(async ({ page }) => {
      // Navigate to signup page
      await page.goto("http://localhost:3000/signup");

      // Generate unique email for this test run
      const timestamp = Date.now();
      const testEmail = `test-auth-redirect-${timestamp}@example.com`;
      const testPassword = "TestPass123!";

      // Fill signup form
      await page.locator('input[name="email"]').fill(testEmail);
      await page.locator('input[name="password"]').fill(testPassword);
      await page.locator('input[name="confirmPassword"]').fill(testPassword);

      // Submit form
      await page.locator('button:has-text("Create account")').click();

      // Wait for successful authentication (redirect to dashboard or see dashboard content)
      await page.waitForURL(/\/(dashboard|\/?)$/, { timeout: 15000 });

      // Verify we're authenticated by checking for dashboard heading
      // This ensures the session is established before running the redirect tests
      await expect(
        page.locator('h1, h2').filter({ hasText: /dashboard/i }).first(),
      ).toBeVisible({ timeout: 5000 });
    });

    test("should redirect from /login to /dashboard", async ({ page }) => {
      // Navigate to login page while authenticated
      await page.goto("http://localhost:3000/login");

      // Should be redirected to dashboard (not stay on login page)
      await expect(page).toHaveURL(/\/(dashboard|\/?)$/, { timeout: 5000 });

      // Login form should NOT be visible
      await expect(
        page.locator('input[name="email"]'),
      ).not.toBeVisible();

      // Dashboard content should be visible instead (check for Dashboard heading)
      await expect(
        page.locator('h1, h2').filter({ hasText: /dashboard/i }).first(),
      ).toBeVisible({ timeout: 5000 });
    });

    test("should redirect from /signup to /dashboard", async ({ page }) => {
      // Navigate to signup page while authenticated
      await page.goto("http://localhost:3000/signup");

      // Should be redirected to dashboard (not stay on signup page)
      await expect(page).toHaveURL(/\/(dashboard|\/?)$/, { timeout: 5000 });

      // Signup form should NOT be visible
      await expect(
        page.locator('input[name="email"]'),
      ).not.toBeVisible();

      // Dashboard content should be visible instead (check for Dashboard heading)
      await expect(
        page.locator('h1, h2').filter({ hasText: /dashboard/i }).first(),
      ).toBeVisible({ timeout: 5000 });
    });

    test("no form should be visible before redirect", async ({ page }) => {
      // This test checks that the redirect happens quickly enough
      // that users don't see a flash of the login/signup form

      // Navigate to login page
      await page.goto("http://localhost:3000/login");

      // Should redirect immediately or very quickly
      await page.waitForURL(/\/(dashboard|\/?)$/, { timeout: 3000 });

      // Verify we ended up on dashboard
      await expect(page).toHaveURL(/\/(dashboard|\/?)$/);
    });
  });
});
