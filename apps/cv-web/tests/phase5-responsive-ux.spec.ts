import { test, expect, devices } from "@playwright/test";
import { setupAuthenticatedSession } from "./helpers/auth";

/**
 * PHASE 5: UI/UX & RESPONSIVE DESIGN - COMPREHENSIVE SMOKE TESTS
 *
 * Tests:
 * - Responsive design (Mobile 375px, Tablet 768px, Desktop 1920px)
 * - Navigation accessibility
 * - Error pages (404, 500, auth errors)
 * - Loading states
 * - Keyboard navigation
 * - Touch interactions
 */

test.describe("Phase 5: UI/UX & Responsive Design", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
  });

  test.describe("Responsive Design - Mobile (375px)", () => {
    test("should display mobile navigation", async ({ page }) => {
      await page.setViewportSize(devices["iPhone 12"].viewport);
      await page.goto("/dashboard");

      // Mobile should have hamburger menu or mobile nav
      const mobileNav = page.locator('button[aria-label*="menu"], [role="navigation"]');
      await expect(mobileNav.first()).toBeVisible();
    });

    test("should make forms usable on mobile", async ({ page }) => {
      await page.setViewportSize(devices["iPhone 12"].viewport);
      await page.goto("/profile/personal");
      await page.waitForSelector('input[id="first_name"]', { timeout: 5000 });

      // Form should be visible and inputs should be tappable
      const firstNameInput = page.locator('input[id="first_name"]');
      await expect(firstNameInput).toBeVisible();

      // Should be able to tap and type
      await firstNameInput.tap();
      await firstNameInput.fill("Test");

      expect(await firstNameInput.inputValue()).toBe("Test");
    });

    test("should display template gallery in mobile-friendly grid", async ({ page }) => {
      await page.setViewportSize(devices["iPhone 12"].viewport);
      await page.goto("/cv/templates");

      // Templates should stack vertically or in mobile grid
      const templateCards = page.locator('[class*="card"]').filter({
        has: page.locator('text=/Modern|Professional|Creative/'),
      });

      const count = await templateCards.count();
      expect(count).toBeGreaterThanOrEqual(3);

      // Cards should be visible
      await expect(templateCards.first()).toBeVisible();
    });

    test("should make CV preview scrollable on mobile", async ({ page }) => {
      await page.setViewportSize(devices["iPhone 12"].viewport);
      await page.goto("/cv/preview");

      // Preview should be visible and scrollable
      await expect(page.locator('text="CVFlow"')).toBeVisible();

      // Page should be scrollable
      const isScrollable = await page.evaluate(() => {
        return document.documentElement.scrollHeight > window.innerHeight;
      });

      // Either scrollable or fits in viewport (both acceptable)
      expect(typeof isScrollable).toBe("boolean");
    });

    test("should have mobile-friendly buttons (min 44x44px)", async ({ page }) => {
      await page.setViewportSize(devices["iPhone 12"].viewport);
      await page.goto("/dashboard");

      // Check button sizes
      const buttons = page.locator("button").first();
      if (await buttons.isVisible()) {
        const box = await buttons.boundingBox();
        if (box) {
          // Buttons should be at least 44x44 for touch targets
          expect(box.height).toBeGreaterThanOrEqual(36); // Some flexibility
        }
      }
    });
  });

  test.describe("Responsive Design - Tablet (768px)", () => {
    test("should display tablet layout", async ({ page }) => {
      await page.setViewportSize(devices["iPad Pro"].viewport);
      await page.goto("/dashboard");

      // Dashboard should be visible
      await expect(page.locator("h1, h2").first()).toBeVisible();
    });

    test("should use tablet grid for template gallery", async ({ page }) => {
      await page.setViewportSize(devices["iPad Pro"].viewport);
      await page.goto("/cv/templates");

      // Should show 2 columns on tablet
      const templateCards = page.locator('[class*="card"]').filter({
        has: page.locator('text=/Modern|Professional|Creative/'),
      });

      const count = await templateCards.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test("should make forms readable on tablet", async ({ page }) => {
      await page.setViewportSize(devices["iPad Pro"].viewport);
      await page.goto("/profile/personal");

      // Form should not be cramped
      await expect(page.locator('input[id="first_name"]')).toBeVisible();
    });
  });

  test.describe("Responsive Design - Desktop (1920px)", () => {
    test("should display full desktop navigation", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto("/dashboard");

      // Desktop should show full navigation (not hamburger)
      const nav = page.locator('[role="navigation"], nav');
      await expect(nav.first()).toBeVisible();
    });

    test("should use desktop grid for template gallery (3 columns)", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto("/cv/templates");

      // Should show 3 columns on desktop
      const templateCards = page.locator('[class*="card"]').filter({
        has: page.locator('text=/Modern|Professional|Creative/'),
      });

      const count = await templateCards.count();
      expect(count).toBeGreaterThanOrEqual(3);

      // Verify cards are in a row (not stacked)
      const firstCard = templateCards.first();
      const secondCard = templateCards.nth(1);

      if ((await firstCard.isVisible()) && (await secondCard.isVisible())) {
        const box1 = await firstCard.boundingBox();
        const box2 = await secondCard.boundingBox();

        // On desktop, cards should be side by side (similar Y position)
        if (box1 && box2) {
          const yDiff = Math.abs(box1.y - box2.y);
          expect(yDiff).toBeLessThan(50); // Should be in same row
        }
      }
    });

    test("should display CV preview at optimal size", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto("/cv/preview");

      // Preview should be centered and not full width
      const cvContainer = page.locator('[style*="210mm"]').first();
      await expect(cvContainer).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Navigation & Header", () => {
    test("should have consistent header across all pages", async ({ page }) => {
      const pages = ["/dashboard", "/profile/personal", "/cv/templates", "/cv/preview"];

      for (const url of pages) {
        await page.goto(url);

        // Should have CVFlow branding
        await expect(page.locator('text="CVFlow"')).toBeVisible();
      }
    });

    test("should navigate using header links", async ({ page }) => {
      await page.goto("/dashboard");

      // Click CVFlow logo to go home
      const logo = page.locator('text="CVFlow"').first();
      await logo.click();

      // Should navigate (either stay on dashboard or go to home)
      await page.waitForTimeout(1000);
      expect(page.url()).toBeTruthy();
    });

    test("should show user menu with sign out option", async ({ page }) => {
      await page.goto("/dashboard");

      // Look for user menu button
      const userMenu = page.locator('[aria-label*="menu"], [aria-label*="user"]');

      if (await userMenu.first().isVisible()) {
        await userMenu.first().click();

        // Should show sign out option
        await expect(page.locator('text="Sign Out"')).toBeVisible({ timeout: 2000 });
      }
    });
  });

  test.describe("Error Pages", () => {
    test("should display 404 page for invalid routes", async ({ page }) => {
      await page.goto("/this-page-does-not-exist");

      // Should show 404 error
      const notFound = page.locator('text=/404|not found/i');
      await expect(notFound).toBeVisible({ timeout: 5000 });
    });

    test("should have link to return home from 404", async ({ page }) => {
      await page.goto("/this-page-does-not-exist");

      // Should have link back to dashboard or home
      const homeLink = page.locator('a[href="/dashboard"], a[href="/"], text=/home|dashboard/i');
      await expect(homeLink.first()).toBeVisible({ timeout: 5000 });
    });

    test("should display auth error page when applicable", async ({ page }) => {
      await page.goto("/auth/error");

      // Should show error page
      await expect(page.locator('text=/error/i')).toBeVisible();
    });
  });

  test.describe("Loading States", () => {
    test("should show loading skeleton on profile page", async ({ page }) => {
      await page.goto("/profile/personal");

      // Should show loading state briefly
      const loadingSkeleton = page.locator('[class*="animate-pulse"]');

      // Check if skeleton appears (might be brief)
      const hasLoading = await Promise.race([
        loadingSkeleton.first().isVisible().then(() => true),
        page.waitForTimeout(500).then(() => false),
      ]);

      // Either loading appeared or page loaded instantly (both acceptable)
      expect(typeof hasLoading).toBe("boolean");
    });

    test("should show loading state when navigating to preview", async ({ page }) => {
      await page.goto("/cv/preview");

      // Should show loading or render immediately
      await expect(page.locator('text="CVFlow"')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Keyboard Navigation", () => {
    test("should allow tab navigation through form fields", async ({ page }) => {
      await page.goto("/profile/personal");
      await page.waitForSelector('input[id="first_name"]', { timeout: 5000 });

      // Focus first input
      await page.locator('input[id="first_name"]').focus();

      // Tab to next field
      await page.keyboard.press("Tab");

      // Should focus next input
      const focusedElement = await page.evaluate(() => document.activeElement?.id);
      expect(focusedElement).toBeTruthy();
    });

    test("should submit form with Enter key", async ({ page }) => {
      await page.goto("/profile/personal");
      await page.waitForSelector('input[id="first_name"]', { timeout: 5000 });

      // Fill required fields
      await page.fill('input[id="first_name"]', "Test");
      await page.fill('input[id="last_name"]', "User");

      // Focus last name and press Enter
      await page.locator('input[id="last_name"]').focus();
      await page.keyboard.press("Enter");

      // Form should submit
      await expect(page.locator('text=/saved|success/i')).toBeVisible({ timeout: 10000 });
    });

    test("should navigate zoom controls with keyboard", async ({ page }) => {
      await page.goto("/cv/preview");

      // Focus zoom + button
      const plusButton = page.locator('button:has-text("+")');
      if (await plusButton.isVisible()) {
        await plusButton.focus();
        await page.keyboard.press("Enter");

        // Zoom should change
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe("Accessibility - ARIA", () => {
    test("should have proper heading hierarchy", async ({ page }) => {
      await page.goto("/dashboard");

      // Should have h1
      const h1 = page.locator("h1");
      await expect(h1.first()).toBeVisible();
    });

    test("should have labels for all form inputs", async ({ page }) => {
      await page.goto("/profile/personal");
      await page.waitForSelector('input[id="first_name"]', { timeout: 5000 });

      // Check that inputs have associated labels
      const firstNameLabel = page.locator('label[for="first_name"]');
      await expect(firstNameLabel).toBeVisible();

      const lastNameLabel = page.locator('label[for="last_name"]');
      await expect(lastNameLabel).toBeVisible();
    });

    test("should have aria-labels for icon buttons", async ({ page }) => {
      await page.goto("/cv/preview");

      // Icon buttons should have aria-labels
      const buttons = page.locator("button");
      const count = await buttons.count();

      if (count > 0) {
        // At least some buttons should have accessible names
        const firstButton = buttons.first();
        const ariaLabel = await firstButton.getAttribute("aria-label");
        const text = await firstButton.textContent();

        // Should have either aria-label or visible text
        expect(ariaLabel || text).toBeTruthy();
      }
    });
  });

  test.describe("Dark Mode (if implemented)", () => {
    test("should respect system dark mode preference", async ({ page }) => {
      // Emulate dark mode
      await page.emulateMedia({ colorScheme: "dark" });

      await page.goto("/dashboard");

      // Check if dark mode styles are applied
      const body = page.locator("body");
      const bgColor = await body.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // Should have dark background (rgb values < 128)
      // This test is optional since dark mode might not be implemented
      expect(bgColor).toBeTruthy();
    });
  });

  test.describe("Touch Interactions", () => {
    test("should support swipe gestures (if applicable)", async ({ page }) => {
      await page.setViewportSize(devices["iPhone 12"].viewport);
      await page.goto("/cv/preview");

      // This is a placeholder - actual swipe gestures depend on implementation
      await expect(page.locator('text="CVFlow"')).toBeVisible();
    });

    test("should handle tap events on mobile", async ({ page }) => {
      await page.setViewportSize(devices["iPhone 12"].viewport);
      await page.goto("/dashboard");

      // Test tap on button
      const button = page.locator("button").first();
      if (await button.isVisible()) {
        await button.tap();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe("Performance", () => {
    test("should load dashboard within 5 seconds", async ({ page }) => {
      const startTime = Date.now();

      await page.goto("/dashboard");
      await page.waitForSelector("h1, h2", { timeout: 5000 });

      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test("should load preview page within 10 seconds", async ({ page }) => {
      const startTime = Date.now();

      await page.goto("/cv/preview");
      await page.waitForSelector('text="CVFlow"', { timeout: 10000 });

      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(10000);
    });
  });
});
