import { expect, test } from "@playwright/test";
import { AuthPage } from "../helpers/page-objects";
import { generateTestUser } from "../helpers/test-user";

/**
 * E2E Tests for Transaction Templates Feature (Card #46)
 *
 * Tests cover:
 * - Navigation and page load
 * - Creating fixed-price templates
 * - Creating variable-price templates
 * - Editing templates
 * - Deleting templates
 * - Toggling favorite status
 * - Using templates to create transactions
 * - Form validation
 * - Data persistence
 * - Responsive design
 */

test.describe("Transaction Templates", () => {
  let testUser: ReturnType<typeof generateTestUser>;

  test.beforeEach(async ({ page }) => {
    // Create and authenticate test user
    const authPage = new AuthPage(page);
    testUser = generateTestUser();

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

  test.describe("Navigation and Page Load", () => {
    test("should navigate to templates page via profile menu", async ({
      page,
    }) => {
      // Navigate to templates page
      await page.goto("/profile/templates");

      // Verify page loads
      await expect(page).toHaveURL("/profile/templates");
      await expect(
        page.locator("h1, h2").filter({ hasText: /templates/i }),
      ).toBeVisible();
    });

    test("should show empty state when no templates exist", async ({
      page,
    }) => {
      await page.goto("/profile/templates");

      // Check for empty state message
      await expect(
        page.locator("text=/no templates/i, text=/get started/i"),
      ).toBeVisible();
    });

    test("should load without console errors", async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto("/profile/templates");

      // Wait for page to fully load
      await page.waitForLoadState("networkidle");

      // No console errors should be present
      expect(consoleErrors).toHaveLength(0);
    });
  });

  test.describe("Create Fixed-Price Template", () => {
    test("should create a fixed-price template successfully", async ({
      page,
    }) => {
      await page.goto("/profile/templates");

      // Click Create Template button
      await page.click('button:has-text("Create Template"), button:has-text("Add Template")');

      // Fill in template details
      await page.fill('input[name="name"], input[placeholder*="name"]', "Morning Coffee");
      await page.fill('input[name="amount"], input[placeholder*="amount"]', "4.50");
      await page.fill('textarea[name="description"], textarea[placeholder*="description"]', "Daily coffee");

      // Submit form
      await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

      // Wait for success toast
      await page.waitForSelector("[data-sonner-toast]", { timeout: 5000 });

      // Verify template appears in list
      await expect(page.locator("text=Morning Coffee")).toBeVisible();
      await expect(page.locator("text=$4.50")).toBeVisible();
    });

    test("should create template with favorite flag", async ({ page }) => {
      await page.goto("/profile/templates");

      await page.click('button:has-text("Create Template"), button:has-text("Add Template")');

      await page.fill('input[name="name"], input[placeholder*="name"]', "Lunch Special");
      await page.fill('input[name="amount"], input[placeholder*="amount"]', "12.00");

      // Toggle favorite checkbox/switch
      await page.click('input[name="isFavorite"], [role="switch"]');

      await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

      await page.waitForSelector("[data-sonner-toast]", { timeout: 5000 });

      // Verify favorite star is shown
      const templateCard = page.locator("text=Lunch Special").locator("..");
      await expect(templateCard.locator('[data-favorite="true"], .favorite, [aria-label*="favorite"]')).toBeVisible();
    });
  });

  test.describe("Create Variable-Price Template", () => {
    test("should create a variable-price template", async ({ page }) => {
      await page.goto("/profile/templates");

      await page.click('button:has-text("Create Template"), button:has-text("Add Template")');

      await page.fill('input[name="name"], input[placeholder*="name"]', "Grocery Shopping");

      // Leave amount empty or toggle to variable
      // Look for a checkbox or toggle for variable pricing
      const variableToggle = page.locator(
        'input[name="isVariableAmount"], [role="switch"]:near(text="Variable")',
      );
      if (await variableToggle.isVisible()) {
        await variableToggle.click();
      }

      await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

      await page.waitForSelector("[data-sonner-toast]", { timeout: 5000 });

      // Verify template shows "Variable" instead of fixed amount
      await expect(page.locator("text=Grocery Shopping")).toBeVisible();
      await expect(page.locator("text=/variable/i")).toBeVisible();
    });
  });

  test.describe("Edit Template", () => {
    test("should edit existing template", async ({ page }) => {
      await page.goto("/profile/templates");

      // Create a template first
      await page.click('button:has-text("Create Template"), button:has-text("Add Template")');
      await page.fill('input[name="name"], input[placeholder*="name"]', "Test Template");
      await page.fill('input[name="amount"], input[placeholder*="amount"]', "10.00");
      await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');
      await page.waitForSelector("[data-sonner-toast]", { timeout: 5000 });

      // Click edit button
      await page.click('button[aria-label*="Edit"], button:has-text("Edit")');

      // Modify template
      await page.fill('input[name="name"], input[placeholder*="name"]', "Updated Template");
      await page.fill('input[name="amount"], input[placeholder*="amount"]', "15.00");

      // Save changes
      await page.click('button[type="submit"]:has-text("Save"), button:has-text("Update")');

      await page.waitForSelector("[data-sonner-toast]", { timeout: 5000 });

      // Verify updates
      await expect(page.locator("text=Updated Template")).toBeVisible();
      await expect(page.locator("text=$15.00")).toBeVisible();
    });
  });

  test.describe("Delete Template", () => {
    test("should delete template with confirmation", async ({ page }) => {
      await page.goto("/profile/templates");

      // Create a template first
      await page.click('button:has-text("Create Template"), button:has-text("Add Template")');
      await page.fill('input[name="name"], input[placeholder*="name"]', "Template to Delete");
      await page.fill('input[name="amount"], input[placeholder*="amount"]', "5.00");
      await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');
      await page.waitForSelector("[data-sonner-toast]", { timeout: 5000 });

      // Click delete button
      await page.click('button[aria-label*="Delete"], button:has-text("Delete")');

      // Confirm deletion in dialog
      await page.click('button:has-text("Confirm"), button:has-text("Delete"):visible');

      await page.waitForSelector("[data-sonner-toast]", { timeout: 5000 });

      // Verify template is removed
      await expect(page.locator("text=Template to Delete")).not.toBeVisible();
    });
  });

  test.describe("Toggle Favorite", () => {
    test("should toggle favorite status", async ({ page }) => {
      await page.goto("/profile/templates");

      // Create a template
      await page.click('button:has-text("Create Template"), button:has-text("Add Template")');
      await page.fill('input[name="name"], input[placeholder*="name"]', "Favorite Test");
      await page.fill('input[name="amount"], input[placeholder*="amount"]', "8.00");
      await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');
      await page.waitForSelector("[data-sonner-toast]", { timeout: 5000 });

      // Click favorite button/star
      const favoriteButton = page.locator(
        'button[aria-label*="favorite"], [data-testid="favorite-button"]',
      );
      await favoriteButton.first().click();

      await page.waitForSelector("[data-sonner-toast]", { timeout: 5000 });

      // Verify favorite status changed
      const templateCard = page.locator("text=Favorite Test").locator("..");
      await expect(
        templateCard.locator('[data-favorite="true"], .favorite-active'),
      ).toBeVisible();
    });
  });

  test.describe("Use Fixed-Price Template", () => {
    test("should create transaction from fixed-price template", async ({
      page,
    }) => {
      await page.goto("/profile/templates");

      // Create a fixed-price template
      await page.click('button:has-text("Create Template"), button:has-text("Add Template")');
      await page.fill('input[name="name"], input[placeholder*="name"]', "Coffee Template");
      await page.fill('input[name="amount"], input[placeholder*="amount"]', "5.50");
      await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');
      await page.waitForSelector("[data-sonner-toast]", { timeout: 5000 });

      // Click "Use" button
      await page.click('button:has-text("Use"), button[aria-label*="Use template"]');

      // Should show success toast
      await page.waitForSelector("[data-sonner-toast]", { timeout: 5000 });
      const toast = await page.locator("[data-sonner-toast]").first().textContent();
      expect(toast).toMatch(/transaction.*created|success/i);

      // Verify transaction was created by going to transactions page
      await page.goto("/transactions");
      await expect(page.locator("text=Coffee Template, text=$5.50")).toBeVisible();
    });
  });

  test.describe("Use Variable-Price Template", () => {
    test("should prompt for amount when using variable-price template", async ({
      page,
    }) => {
      await page.goto("/profile/templates");

      // Create a variable-price template
      await page.click('button:has-text("Create Template"), button:has-text("Add Template")');
      await page.fill('input[name="name"], input[placeholder*="name"]', "Variable Template");

      const variableToggle = page.locator(
        'input[name="isVariableAmount"], [role="switch"]:near(text="Variable")',
      );
      if (await variableToggle.isVisible()) {
        await variableToggle.click();
      }

      await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');
      await page.waitForSelector("[data-sonner-toast]", { timeout: 5000 });

      // Click "Use" button
      await page.click('button:has-text("Use"), button[aria-label*="Use template"]');

      // Should show amount input dialog
      await expect(
        page.locator('input[name="amount"], input[placeholder*="amount"]'),
      ).toBeVisible();

      // Enter amount
      await page.fill('input[name="amount"], input[placeholder*="amount"]', "75.00");

      // Submit
      await page.click('button[type="submit"]:has-text("Create"), button:has-text("Confirm")');

      // Should show success toast
      await page.waitForSelector("[data-sonner-toast]", { timeout: 5000 });

      // Verify transaction was created
      await page.goto("/transactions");
      await expect(page.locator("text=Variable Template")).toBeVisible();
      await expect(page.locator("text=$75.00")).toBeVisible();
    });
  });

  test.describe("Form Validation", () => {
    test("should show error when creating template with empty name", async ({
      page,
    }) => {
      await page.goto("/profile/templates");

      await page.click('button:has-text("Create Template"), button:has-text("Add Template")');

      // Try to submit without name
      await page.fill('input[name="amount"], input[placeholder*="amount"]', "10.00");
      await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

      // Should show validation error
      await expect(
        page.locator("text=/name.*required/i, text=/required/i"),
      ).toBeVisible();
    });

    test("should reject negative amounts", async ({ page }) => {
      await page.goto("/profile/templates");

      await page.click('button:has-text("Create Template"), button:has-text("Add Template")');

      await page.fill('input[name="name"], input[placeholder*="name"]', "Test");
      await page.fill('input[name="amount"], input[placeholder*="amount"]', "-10.00");
      await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

      // Should show validation error
      await expect(
        page.locator("text=/positive|greater than zero|invalid/i"),
      ).toBeVisible();
    });
  });

  test.describe("Data Persistence", () => {
    test("should persist template after page refresh", async ({ page }) => {
      await page.goto("/profile/templates");

      // Create a template
      await page.click('button:has-text("Create Template"), button:has-text("Add Template")');
      await page.fill('input[name="name"], input[placeholder*="name"]', "Persistent Template");
      await page.fill('input[name="amount"], input[placeholder*="amount"]', "20.00");
      await page.fill('textarea[name="description"], textarea[placeholder*="description"]', "Test persistence");
      await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');
      await page.waitForSelector("[data-sonner-toast]", { timeout: 5000 });

      // Refresh page
      await page.reload();

      // Verify template is still visible
      await expect(page.locator("text=Persistent Template")).toBeVisible();
      await expect(page.locator("text=$20.00")).toBeVisible();
    });
  });

  test.describe("Responsive Design", () => {
    test("should display correctly on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/profile/templates");

      // Verify page loads
      await expect(
        page.locator("h1, h2").filter({ hasText: /templates/i }),
      ).toBeVisible();

      // Verify buttons are accessible
      await expect(
        page.locator('button:has-text("Create Template"), button:has-text("Add Template")'),
      ).toBeVisible();
    });

    test("should display correctly on tablet viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/profile/templates");

      // Verify page loads
      await expect(
        page.locator("h1, h2").filter({ hasText: /templates/i }),
      ).toBeVisible();
    });

    test("should display correctly on desktop viewport", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto("/profile/templates");

      // Verify page loads
      await expect(
        page.locator("h1, h2").filter({ hasText: /templates/i }),
      ).toBeVisible();
    });
  });
});
