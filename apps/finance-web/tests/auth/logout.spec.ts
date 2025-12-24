import { expect, test } from "@playwright/test";
import { AuthPage } from "../helpers/page-objects";
import { generateTestUser } from "../helpers/test-user";

test.describe("User Logout", () => {
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

  test("should successfully logout and redirect to login page", async ({
    page,
  }) => {
    // Verify we're logged in on dashboard
    await expect(page).toHaveURL("/");

    // Look for logout button (adjust selector based on actual implementation)
    const logoutButton = page.locator(
      'button:has-text("Logout"), button:has-text("Sign out"), button:has-text("Log out")',
    );

    // If logout is in a dropdown menu, may need to click user menu first
    const userMenuButton = page.locator(
      'button[aria-label*="user"], button[aria-label*="account"], button[aria-label*="menu"]',
    );

    // Try to find and click user menu first if it exists
    if ((await userMenuButton.count()) > 0) {
      await userMenuButton.first().click();
      await page.waitForTimeout(500); // Wait for menu to open
    }

    // Click logout
    await logoutButton.first().click();

    // Should redirect to login page
    await page.waitForURL("/login", { timeout: 10000 });
    await expect(page).toHaveURL("/login");
  });

  test("should not be able to access protected routes after logout", async ({
    page,
  }) => {
    // Logout
    const logoutButton = page.locator(
      'button:has-text("Logout"), button:has-text("Sign out"), button:has-text("Log out")',
    );

    const userMenuButton = page.locator(
      'button[aria-label*="user"], button[aria-label*="account"], button[aria-label*="menu"]',
    );

    if ((await userMenuButton.count()) > 0) {
      await userMenuButton.first().click();
      await page.waitForTimeout(500);
    }

    await logoutButton.first().click();
    await page.waitForURL("/login", { timeout: 10000 });

    // Try to access dashboard directly
    await page.goto("/");

    // Should be redirected back to login
    await expect(page).toHaveURL("/login");
  });

  test("should clear session after logout", async ({ page }) => {
    // Logout
    const logoutButton = page.locator(
      'button:has-text("Logout"), button:has-text("Sign out"), button:has-text("Log out")',
    );

    const userMenuButton = page.locator(
      'button[aria-label*="user"], button[aria-label*="account"], button[aria-label*="menu"]',
    );

    if ((await userMenuButton.count()) > 0) {
      await userMenuButton.first().click();
      await page.waitForTimeout(500);
    }

    await logoutButton.first().click();
    await page.waitForURL("/login", { timeout: 10000 });

    // Check that session cookies are cleared
    const cookies = await page.context().cookies();
    const sessionCookies = cookies.filter(
      (cookie) =>
        cookie.name.includes("supabase") || cookie.name.includes("session"),
    );

    // Session cookies should be expired or removed
    for (const cookie of sessionCookies) {
      if (cookie.value) {
        // Cookie might be present but should be expired or have empty value
        expect(cookie.expires).toBeLessThanOrEqual(Date.now() / 1000);
      }
    }
  });
});
