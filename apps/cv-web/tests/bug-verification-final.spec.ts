import { test, expect } from "@playwright/test";
import { signIn, signOut, TEST_USER } from "./helpers/auth";

/**
 * FINAL BUG VERIFICATION
 *
 * This test suite verifies all bugs reported in the QA handoff:
 *
 * P0 (Critical):
 * - BUG-001: Sign-in redirects to /dashboard ✅ (already passed)
 * - BUG-002: Protected routes redirect instantly (<1s) for unauthenticated users
 * - BUG-003: Error messages on failed sign-in ✅ (already passed)
 *
 * P1 (High):
 * - BUG-004: /profile/personal loads without error
 * - BUG-005: /profile/social loads
 * - BUG-006: /profile/experience loads
 *
 * Additional:
 * - Sign Out should complete in <2 seconds
 */

test.describe("FINAL BUG VERIFICATION", () => {
  test.describe("P0 (Critical) - BUG-002: Protected Route Redirect Speed", () => {
    test("should redirect unauthenticated user from /dashboard in <1s", async ({
      browser,
    }) => {
      // Create a fresh context with no cookies to ensure unauthenticated state
      const context = await browser.newContext();
      const page = await context.newPage();

      const startTime = Date.now();

      await page.goto("/dashboard");

      // Wait for redirect to sign-in
      await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });

      const endTime = Date.now();
      const redirectTime = endTime - startTime;

      console.log(`⏱️  BUG-002 Dashboard redirect time: ${redirectTime}ms`);

      // PASS CRITERIA: Should redirect in less than 1000ms
      expect(redirectTime).toBeLessThan(1000);

      await context.close();
    });

    test("should redirect unauthenticated user from /profile/personal in <1s", async ({
      browser,
    }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      const startTime = Date.now();

      await page.goto("/profile/personal");

      await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });

      const endTime = Date.now();
      const redirectTime = endTime - startTime;

      console.log(`⏱️  BUG-002 Profile redirect time: ${redirectTime}ms`);

      expect(redirectTime).toBeLessThan(1000);

      await context.close();
    });

    test("should redirect unauthenticated user from /cv/preview in <1s", async ({
      browser,
    }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      const startTime = Date.now();

      await page.goto("/cv/preview");

      await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });

      const endTime = Date.now();
      const redirectTime = endTime - startTime;

      console.log(`⏱️  BUG-002 CV Preview redirect time: ${redirectTime}ms`);

      expect(redirectTime).toBeLessThan(1000);

      await context.close();
    });

    test("should redirect unauthenticated user from /cv/templates in <1s", async ({
      browser,
    }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      const startTime = Date.now();

      await page.goto("/cv/templates");

      await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });

      const endTime = Date.now();
      const redirectTime = endTime - startTime;

      console.log(`⏱️  BUG-002 CV Templates redirect time: ${redirectTime}ms`);

      expect(redirectTime).toBeLessThan(1000);

      await context.close();
    });
  });

  test.describe("P1 (High) - BUG-004: Profile Personal Page Loads", () => {
    test("should load /profile/personal without errors for authenticated user", async ({
      page,
    }) => {
      // Track console errors
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      // Track uncaught exceptions
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => {
        pageErrors.push(error.message);
      });

      // Sign in
      await signIn(page, TEST_USER.email, TEST_USER.password);
      await expect(page).toHaveURL("/dashboard");

      // Navigate to profile personal
      await page.goto("/profile/personal");

      // Wait for page to load
      await page.waitForLoadState("networkidle");

      // Verify URL is correct
      await expect(page).toHaveURL("/profile/personal");

      // Verify page renders (should have form elements or content)
      const pageContent = await page.locator("body").textContent();
      expect(pageContent).toBeTruthy();

      // Log any errors for debugging
      if (consoleErrors.length > 0) {
        console.log(`⚠️  BUG-004 Console errors: ${consoleErrors.join(", ")}`);
      }
      if (pageErrors.length > 0) {
        console.log(`⚠️  BUG-004 Page errors: ${pageErrors.join(", ")}`);
      }

      // PASS CRITERIA: No "Server error" or uncaught exceptions
      const hasServerError = consoleErrors.some((err) =>
        err.toLowerCase().includes("server error")
      );
      const hasUncaughtError = pageErrors.length > 0;

      expect(hasServerError).toBe(false);
      expect(hasUncaughtError).toBe(false);

      console.log(`✅ BUG-004: /profile/personal loaded successfully`);
    });

    test("should display personal information form fields", async ({ page }) => {
      await signIn(page, TEST_USER.email, TEST_USER.password);
      await page.goto("/profile/personal");

      // Wait for page to load
      await page.waitForLoadState("networkidle");

      // Check for common form fields (based on PRD)
      const bodyText = await page.locator("body").textContent();

      // Should have personal info section
      const hasPersonalFields =
        bodyText?.toLowerCase().includes("name") ||
        bodyText?.toLowerCase().includes("personal");

      expect(hasPersonalFields).toBe(true);
    });
  });

  test.describe("P1 (High) - BUG-005: Profile Social Page Loads", () => {
    test("should load /profile/social without errors for authenticated user", async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      const pageErrors: string[] = [];
      page.on("pageerror", (error) => {
        pageErrors.push(error.message);
      });

      await signIn(page, TEST_USER.email, TEST_USER.password);
      await page.goto("/profile/social");

      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL("/profile/social");

      const pageContent = await page.locator("body").textContent();
      expect(pageContent).toBeTruthy();

      if (consoleErrors.length > 0) {
        console.log(`⚠️  BUG-005 Console errors: ${consoleErrors.join(", ")}`);
      }
      if (pageErrors.length > 0) {
        console.log(`⚠️  BUG-005 Page errors: ${pageErrors.join(", ")}`);
      }

      const hasServerError = consoleErrors.some((err) =>
        err.toLowerCase().includes("server error")
      );
      const hasUncaughtError = pageErrors.length > 0;

      expect(hasServerError).toBe(false);
      expect(hasUncaughtError).toBe(false);

      console.log(`✅ BUG-005: /profile/social loaded successfully`);
    });
  });

  test.describe("P1 (High) - BUG-006: Profile Experience Page Loads", () => {
    test("should load /profile/experience without errors for authenticated user", async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      const pageErrors: string[] = [];
      page.on("pageerror", (error) => {
        pageErrors.push(error.message);
      });

      await signIn(page, TEST_USER.email, TEST_USER.password);
      await page.goto("/profile/experience");

      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL("/profile/experience");

      const pageContent = await page.locator("body").textContent();
      expect(pageContent).toBeTruthy();

      if (consoleErrors.length > 0) {
        console.log(`⚠️  BUG-006 Console errors: ${consoleErrors.join(", ")}`);
      }
      if (pageErrors.length > 0) {
        console.log(`⚠️  BUG-006 Page errors: ${pageErrors.join(", ")}`);
      }

      const hasServerError = consoleErrors.some((err) =>
        err.toLowerCase().includes("server error")
      );
      const hasUncaughtError = pageErrors.length > 0;

      expect(hasServerError).toBe(false);
      expect(hasUncaughtError).toBe(false);

      console.log(`✅ BUG-006: /profile/experience loaded successfully`);
    });
  });

  test.describe("Additional - Sign Out Performance", () => {
    test("should complete sign out in <2 seconds", async ({ page }) => {
      await signIn(page, TEST_USER.email, TEST_USER.password);
      await expect(page).toHaveURL("/dashboard");

      const startTime = Date.now();

      await signOut(page);

      // Wait for redirect to sign-in
      await expect(page).toHaveURL("/sign-in", { timeout: 5000 });

      const endTime = Date.now();
      const signOutTime = endTime - startTime;

      console.log(`⏱️  Sign Out time: ${signOutTime}ms`);

      // PASS CRITERIA: Should complete in less than 2000ms
      expect(signOutTime).toBeLessThan(2000);

      console.log(`✅ Sign Out completed in ${signOutTime}ms (under 2s threshold)`);
    });

    test("should clear session after sign out", async ({ page }) => {
      await signIn(page, TEST_USER.email, TEST_USER.password);
      await signOut(page);

      // Try to access protected route
      await page.goto("/dashboard");

      // Should redirect to sign-in
      await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });

      console.log(`✅ Session cleared after sign out`);
    });
  });

  test.describe("Already Passing - BUG-001 & BUG-003", () => {
    test("BUG-001: Sign-in redirects to /dashboard", async ({ page }) => {
      await signIn(page, TEST_USER.email, TEST_USER.password);

      await expect(page).toHaveURL("/dashboard", { timeout: 10000 });

      console.log(`✅ BUG-001: Sign-in redirects to /dashboard`);
    });

    test("BUG-003: Error messages on failed sign-in", async ({ page }) => {
      await page.goto("/sign-in");

      await page.fill('input[name="email"]', "wrong@example.com");
      await page.fill('input[name="password"]', "wrongpassword");
      await page.click('button[type="submit"]');

      const errorMessage = page.locator('text=/invalid|incorrect|wrong|error/i');
      await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });

      console.log(`✅ BUG-003: Error messages shown on failed sign-in`);
    });
  });
});
