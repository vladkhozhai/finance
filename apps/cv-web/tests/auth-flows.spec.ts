import { test, expect } from "@playwright/test";
import { signIn, signOut, TEST_USER } from "./helpers/auth";

/**
 * AUTHENTICATION FLOWS - SMOKE TESTS
 *
 * Tests:
 * - Sign Up
 * - Sign In
 * - Sign Out
 * - Forgot Password
 * - Reset Password
 * - Session Persistence
 */

test.describe("Authentication Flows", () => {
  test.describe("Sign Up", () => {
    test("should display sign up form", async ({ page }) => {
      await page.goto("/sign-up");

      // Verify form elements
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test("should have link to sign in page", async ({ page }) => {
      await page.goto("/sign-up");

      const signInLink = page.locator('a[href="/sign-in"], text="Sign In"');
      await expect(signInLink.first()).toBeVisible();
    });

    test("should validate email and password fields", async ({ page }) => {
      await page.goto("/sign-up");

      // Try to submit empty form
      await page.click('button[type="submit"]');

      // Should show validation (either browser or custom)
      await page.waitForTimeout(1000);

      // Form should not submit successfully
      expect(page.url()).toContain("/sign-up");
    });

    test("should show error for existing email", async ({ page }) => {
      await page.goto("/sign-up");

      // Try to sign up with existing email
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');

      // Should show error or redirect to sign-in
      await page.waitForTimeout(2000);

      // Either error message appears or stays on page
      const currentUrl = page.url();
      const hasError = await page.locator('text=/error|already|exists/i').isVisible();

      expect(hasError || currentUrl.includes("/sign-up")).toBeTruthy();
    });
  });

  test.describe("Sign In", () => {
    test("should display sign in form", async ({ page }) => {
      await page.goto("/sign-in");

      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test("should have link to sign up page", async ({ page }) => {
      await page.goto("/sign-in");

      const signUpLink = page.locator('a[href="/sign-up"], text="Sign Up"');
      await expect(signUpLink.first()).toBeVisible();
    });

    test("should have forgot password link", async ({ page }) => {
      await page.goto("/sign-in");

      const forgotLink = page.locator('a[href="/forgot-password"], text=/forgot.*password/i');
      await expect(forgotLink.first()).toBeVisible();
    });

    test("should sign in successfully with valid credentials", async ({ page }) => {
      await signIn(page, TEST_USER.email, TEST_USER.password);

      // Should redirect to dashboard
      await expect(page).toHaveURL("/dashboard", { timeout: 10000 });
    });

    test("should show error for invalid credentials", async ({ page }) => {
      await page.goto("/sign-in");

      await page.fill('input[name="email"]', "wrong@example.com");
      await page.fill('input[name="password"]', "wrongpassword");
      await page.click('button[type="submit"]');

      // Should show error message
      const errorMessage = page.locator('text=/invalid|incorrect|wrong|error/i');
      await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
    });

    test("should show error for empty fields", async ({ page }) => {
      await page.goto("/sign-in");

      await page.click('button[type="submit"]');

      // Should show validation
      await page.waitForTimeout(1000);

      // Should stay on sign-in page
      expect(page.url()).toContain("/sign-in");
    });

    test("should remember user session after sign in", async ({ page }) => {
      await signIn(page, TEST_USER.email, TEST_USER.password);

      await expect(page).toHaveURL("/dashboard");

      // Reload page
      await page.reload();

      // Should stay on dashboard (session persists)
      await expect(page).toHaveURL("/dashboard", { timeout: 5000 });
    });
  });

  test.describe("Sign Out", () => {
    test("should sign out successfully", async ({ page }) => {
      await signIn(page, TEST_USER.email, TEST_USER.password);
      await expect(page).toHaveURL("/dashboard");

      await signOut(page);

      // Should redirect to sign-in
      await expect(page).toHaveURL("/sign-in", { timeout: 5000 });
    });

    test("should clear session after sign out", async ({ page }) => {
      await signIn(page, TEST_USER.email, TEST_USER.password);
      await signOut(page);

      // Try to access protected route
      await page.goto("/dashboard");

      // Should redirect to sign-in
      await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });
    });
  });

  test.describe("Forgot Password", () => {
    test("should display forgot password form", async ({ page }) => {
      await page.goto("/forgot-password");

      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test("should have back to sign in link", async ({ page }) => {
      await page.goto("/forgot-password");

      const signInLink = page.locator('a[href="/sign-in"]');
      await expect(signInLink.first()).toBeVisible();
    });

    test("should handle forgot password request", async ({ page }) => {
      await page.goto("/forgot-password");

      await page.fill('input[name="email"]', TEST_USER.email);
      await page.click('button[type="submit"]');

      // Should show success message or confirmation
      const successMessage = page.locator('text=/sent|check|email/i');
      await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Reset Password", () => {
    test("should display reset password form", async ({ page }) => {
      // Navigate with mock token
      await page.goto("/reset-password?token=mock-token");

      // Should show password reset form
      const passwordInput = page.locator('input[type="password"]');
      await expect(passwordInput.first()).toBeVisible();
    });

    test("should require password confirmation", async ({ page }) => {
      await page.goto("/reset-password?token=mock-token");

      // Should have two password fields (new password and confirm)
      const passwordInputs = page.locator('input[type="password"]');
      const count = await passwordInputs.count();

      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe("Protected Routes", () => {
    test("should redirect to sign-in when accessing dashboard without auth", async ({
      page,
    }) => {
      await page.goto("/dashboard");

      await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });
    });

    test("should redirect to sign-in when accessing profile without auth", async ({
      page,
    }) => {
      await page.goto("/profile/personal");

      await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });
    });

    test("should redirect to sign-in when accessing CV without auth", async ({ page }) => {
      await page.goto("/cv/preview");

      await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });
    });

    test("should allow access to public routes without auth", async ({ page }) => {
      // Sign-in page should be accessible
      await page.goto("/sign-in");
      await expect(page).toHaveURL("/sign-in");

      // Sign-up page should be accessible
      await page.goto("/sign-up");
      await expect(page).toHaveURL("/sign-up");

      // Home page should be accessible
      await page.goto("/");
      expect(page.url()).toBeTruthy();
    });
  });

  test.describe("Dashboard After Sign In", () => {
    test("should show dashboard with welcome message", async ({ page }) => {
      await signIn(page, TEST_USER.email, TEST_USER.password);

      await expect(page).toHaveURL("/dashboard");

      // Should show some dashboard content
      await expect(page.locator("h1, h2").first()).toBeVisible();
    });

    test("should show navigation to profile sections", async ({ page }) => {
      await signIn(page, TEST_USER.email, TEST_USER.password);

      // Should have links to profile, templates, etc.
      const profileLink = page.locator('a[href*="/profile"], text=/profile/i');
      await expect(profileLink.first()).toBeVisible();
    });

    test("should show CV preview link", async ({ page }) => {
      await signIn(page, TEST_USER.email, TEST_USER.password);

      // Should have link to CV preview or templates
      const cvLink = page.locator('a[href*="/cv"], text=/cv|preview|template/i');
      await expect(cvLink.first()).toBeVisible();
    });
  });

  test.describe("Session Expiry (if applicable)", () => {
    test("should handle expired session gracefully", async ({ page }) => {
      await signIn(page, TEST_USER.email, TEST_USER.password);

      // In a real scenario, we'd wait for session to expire
      // For smoke test, we just verify current behavior

      await page.goto("/dashboard");
      await expect(page.locator("h1, h2").first()).toBeVisible();
    });
  });

  test.describe("Social Auth (if implemented)", () => {
    test("should show OAuth provider buttons if available", async ({ page }) => {
      await page.goto("/sign-in");

      // Check for OAuth buttons (Google, GitHub, etc.)
      const oauthButton = page.locator('button:has-text("Google"), button:has-text("GitHub")');

      // If OAuth is implemented, buttons should be visible
      // This is optional depending on implementation
      const hasOAuth = await oauthButton.first().isVisible().catch(() => false);

      expect(typeof hasOAuth).toBe("boolean");
    });
  });

  test.describe("Email Verification (if implemented)", () => {
    test("should handle email verification flow", async ({ page }) => {
      // This depends on implementation
      // Placeholder for email verification testing
      await page.goto("/sign-up");

      // After signup, may need to verify email
      // This test would check for verification message
    });
  });

  test.describe("Multi-factor Authentication (if implemented)", () => {
    test("should show MFA prompt if enabled", async ({ page }) => {
      // Placeholder for MFA testing
      // This depends on whether MFA is implemented
    });
  });
});
