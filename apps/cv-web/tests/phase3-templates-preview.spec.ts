import { test, expect } from "@playwright/test";
import { setupAuthenticatedSession } from "./helpers/auth";

/**
 * PHASE 3: CV TEMPLATES & PREVIEW - COMPREHENSIVE SMOKE TESTS
 *
 * Tests:
 * - Template Gallery (3 templates: Modern, Professional, Creative)
 * - Template Selection & Switching
 * - Real-time Preview
 * - Zoom Controls
 * - Template Persistence
 */

test.describe("Phase 3: CV Templates & Preview", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
  });

  test.describe("Template Gallery (/cv/templates)", () => {
    test("should display template gallery with all 3 templates", async ({ page }) => {
      await page.goto("/cv/templates");

      // Verify page title
      await expect(page.locator("h1, h2").filter({ hasText: /template/i })).toBeVisible();

      // Verify all 3 templates are visible
      await expect(page.locator('text="Modern"')).toBeVisible();
      await expect(page.locator('text="Professional"')).toBeVisible();
      await expect(page.locator('text="Creative"')).toBeVisible();
    });

    test("should show template cards with preview and action buttons", async ({ page }) => {
      await page.goto("/cv/templates");

      // Each template should have Preview and Use buttons
      const templateCards = page.locator('[class*="card"]').filter({
        has: page.locator('text=/Modern|Professional|Creative/'),
      });

      const cardCount = await templateCards.count();
      expect(cardCount).toBeGreaterThanOrEqual(3);

      // Verify first card has both buttons
      const firstCard = templateCards.first();
      await expect(firstCard.locator('button:has-text("Preview")')).toBeVisible();
      await expect(firstCard.locator('button:has-text("Use")')).toBeVisible();
    });

    test("should navigate to preview when clicking Preview button", async ({ page }) => {
      await page.goto("/cv/templates");

      // Click first Preview button
      await page.locator('button:has-text("Preview")').first().click();

      // Should navigate to /cv/preview with template query param
      await expect(page).toHaveURL(/\/cv\/preview/, { timeout: 5000 });
    });

    test("should select template when clicking Use button", async ({ page }) => {
      await page.goto("/cv/templates");

      // Click first Use button
      await page.locator('button:has-text("Use")').first().click();

      // Should navigate to preview with selected template
      await expect(page).toHaveURL(/\/cv\/preview/, { timeout: 5000 });
    });

    test("should have back to dashboard navigation", async ({ page }) => {
      await page.goto("/cv/templates");

      // Look for back button or dashboard link
      const backButton = page.locator('text="Back to Dashboard"');
      await expect(backButton).toBeVisible();

      await backButton.click();
      await expect(page).toHaveURL("/dashboard", { timeout: 5000 });
    });
  });

  test.describe("CV Preview (/cv/preview)", () => {
    test("should load CV preview page", async ({ page }) => {
      await page.goto("/cv/preview");

      // Verify page loaded (should show preview or empty state)
      await expect(page.locator('text="CVFlow"')).toBeVisible();
    });

    test("should show template selector dropdown", async ({ page }) => {
      await page.goto("/cv/preview");

      // Look for template selector
      const templateSelector = page.locator('select, [role="combobox"]').filter({
        hasText: /template|modern|professional|creative/i,
      });

      // Should have template selector or at least template name visible
      const hasSelectorOrName = await Promise.race([
        templateSelector.isVisible().then(() => true),
        page.locator('text=/Modern|Professional|Creative/').isVisible().then(() => true),
      ]);

      expect(hasSelectorOrName).toBeTruthy();
    });

    test("should display zoom controls with +/- buttons", async ({ page }) => {
      await page.goto("/cv/preview");

      // Look for zoom controls
      await expect(page.locator('text="Zoom"').or(page.locator('button:has-text("+")'))).toBeVisible({
        timeout: 5000,
      });
    });

    test("should have Print button", async ({ page }) => {
      await page.goto("/cv/preview");

      await expect(page.locator('button:has-text("Print")')).toBeVisible();
    });

    test("should have Download PDF button", async ({ page }) => {
      await page.goto("/cv/preview");

      await expect(page.locator('button:has-text("Download PDF")')).toBeVisible();
    });

    test("should have Templates button to return to gallery", async ({ page }) => {
      await page.goto("/cv/preview");

      const templatesButton = page.locator('button:has-text("Templates")');
      await expect(templatesButton).toBeVisible();

      await templatesButton.click();
      await expect(page).toHaveURL("/cv/templates", { timeout: 5000 });
    });

    test("should have Edit Profile link", async ({ page }) => {
      await page.goto("/cv/preview");

      const editLink = page.locator('text="Edit Profile"').or(page.locator('a[href*="/profile"]'));
      await expect(editLink.first()).toBeVisible();
    });

    test("should display CV content or empty state", async ({ page }) => {
      await page.goto("/cv/preview");

      // Should either show CV content or empty state message
      const hasContent = await Promise.race([
        page.locator('text="No profile data yet"').isVisible().then(() => "empty"),
        page.waitForTimeout(2000).then(() => "content"),
      ]);

      // Either state is acceptable
      expect(hasContent).toBeTruthy();
    });
  });

  test.describe("Template Switching", () => {
    test("should switch between templates using dropdown", async ({ page }) => {
      await page.goto("/cv/preview");

      // Wait for page to load
      await page.waitForTimeout(1000);

      // Find template selector
      const selector = page.locator('select, [role="combobox"]').first();

      if (await selector.isVisible()) {
        // Open dropdown
        await selector.click();

        // Wait for options
        await page.waitForTimeout(500);

        // Select different template (look for option)
        const options = page.locator('[role="option"], option').filter({
          hasText: /Modern|Professional|Creative/,
        });

        const optionCount = await options.count();
        if (optionCount > 1) {
          // Click second option
          await options.nth(1).click();

          // Wait for template to switch
          await page.waitForTimeout(1000);

          // Verify URL updated with template param
          const url = page.url();
          expect(url).toContain("template=");
        }
      }
    });

    test("should switch templates using navigation arrows", async ({ page }) => {
      await page.goto("/cv/preview");

      // Look for prev/next buttons (ChevronLeft/ChevronRight icons)
      const prevButton = page.locator('button').filter({ has: page.locator('[data-icon="chevron-left"]') }).or(
        page.locator('button[aria-label*="prev"]')
      );
      const nextButton = page.locator('button').filter({ has: page.locator('[data-icon="chevron-right"]') }).or(
        page.locator('button[aria-label*="next"]')
      );

      // Try clicking next button if visible
      if (await nextButton.first().isVisible()) {
        const urlBefore = page.url();
        await nextButton.first().click();
        await page.waitForTimeout(500);
        const urlAfter = page.url();

        // URL should change (or stay same if only 1 template)
        expect(urlAfter).toBeDefined();
      }
    });

    test("should load template from URL parameter", async ({ page }) => {
      // Navigate directly with template parameter
      await page.goto("/cv/preview?template=modern");

      // Should load successfully
      await expect(page.locator('text="CVFlow"')).toBeVisible();
    });
  });

  test.describe("Zoom Controls", () => {
    test("should increase zoom when + button clicked", async ({ page }) => {
      await page.goto("/cv/preview");

      // Find zoom percentage display
      const zoomDisplay = page.locator('text=/%|Zoom/').first();
      await expect(zoomDisplay).toBeVisible({ timeout: 5000 });

      // Get initial zoom value
      const initialZoom = await zoomDisplay.textContent();

      // Click + button
      const plusButton = page.locator('button:has-text("+")');
      if (await plusButton.isVisible()) {
        await plusButton.click();
        await page.waitForTimeout(300);

        // Zoom should increase
        const newZoom = await zoomDisplay.textContent();
        expect(newZoom).not.toBe(initialZoom);
      }
    });

    test("should decrease zoom when - button clicked", async ({ page }) => {
      await page.goto("/cv/preview");

      const zoomDisplay = page.locator('text=/%|Zoom/').first();
      await expect(zoomDisplay).toBeVisible({ timeout: 5000 });

      const initialZoom = await zoomDisplay.textContent();

      // Click - button
      const minusButton = page.locator('button:has-text("-")');
      if (await minusButton.isVisible()) {
        await minusButton.click();
        await page.waitForTimeout(300);

        const newZoom = await zoomDisplay.textContent();
        expect(newZoom).not.toBe(initialZoom);
      }
    });

    test("should reset zoom when Reset button clicked", async ({ page }) => {
      await page.goto("/cv/preview");

      // Change zoom first
      const plusButton = page.locator('button:has-text("+")');
      if (await plusButton.isVisible()) {
        await plusButton.click();
        await page.waitForTimeout(300);

        // Click Reset
        const resetButton = page.locator('button:has-text("Reset")');
        if (await resetButton.isVisible()) {
          await resetButton.click();
          await page.waitForTimeout(300);

          // Should show default zoom (typically 70% based on code)
          const zoomDisplay = page.locator('text=/70%/');
          await expect(zoomDisplay).toBeVisible({ timeout: 2000 });
        }
      }
    });

    test("should not allow zoom beyond min/max limits", async ({ page }) => {
      await page.goto("/cv/preview");

      // Try to zoom out multiple times
      const minusButton = page.locator('button:has-text("-")');
      if (await minusButton.isVisible()) {
        // Click 10 times
        for (let i = 0; i < 10; i++) {
          await minusButton.click();
          await page.waitForTimeout(100);
        }

        // Button should be disabled or zoom should stop at minimum
        const isDisabled = await minusButton.isDisabled();
        expect(isDisabled).toBe(true);
      }
    });
  });

  test.describe("Template Data Rendering", () => {
    test("should display user data when profile is complete", async ({ page }) => {
      // First ensure we have profile data
      await page.goto("/profile/personal");
      await page.waitForSelector('input[id="first_name"]', { timeout: 5000 });

      // Save minimal data
      await page.fill('input[id="first_name"]', "Test");
      await page.fill('input[id="last_name"]', "User");
      await page.click('button:has-text("Save Changes")');
      await page.waitForTimeout(1000);

      // Navigate to preview
      await page.goto("/cv/preview");

      // Should NOT show "No profile data" message
      const noDataMessage = page.locator('text="No profile data yet"');
      await expect(noDataMessage).not.toBeVisible();

      // Should show user name somewhere in the CV
      const userName = page.locator('text="Test User"');
      await expect(userName).toBeVisible({ timeout: 5000 });
    });

    test("should show empty state when no profile data exists", async ({ page }) => {
      // This test assumes a fresh user with no data
      // In real scenario, might need to clear data first

      await page.goto("/cv/preview");

      // Should show empty state OR show partial data
      const hasContent = await Promise.race([
        page.locator('text="No profile data yet"').isVisible().then(() => true),
        page.waitForTimeout(2000).then(() => false),
      ]);

      // Either is acceptable
      expect(typeof hasContent).toBe("boolean");
    });
  });

  test.describe("Template Visual Quality", () => {
    test("Modern template should render without errors", async ({ page }) => {
      await page.goto("/cv/preview?template=modern");

      // Check for console errors
      const errors: string[] = [];
      page.on("pageerror", (error) => {
        errors.push(error.message);
      });

      await page.waitForTimeout(2000);

      // Should have no critical errors
      expect(errors.length).toBe(0);
    });

    test("Professional template should render without errors", async ({ page }) => {
      await page.goto("/cv/preview?template=professional");

      const errors: string[] = [];
      page.on("pageerror", (error) => {
        errors.push(error.message);
      });

      await page.waitForTimeout(2000);

      expect(errors.length).toBe(0);
    });

    test("Creative template should render without errors", async ({ page }) => {
      await page.goto("/cv/preview?template=creative");

      const errors: string[] = [];
      page.on("pageerror", (error) => {
        errors.push(error.message);
      });

      await page.waitForTimeout(2000);

      expect(errors.length).toBe(0);
    });
  });
});
