import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { AuthPage } from "./helpers/page-objects";
import { generateTestUser } from "./helpers/test-user";

test.describe("Accessibility", () => {
  test("login page should have no accessibility violations", async ({
    page,
  }) => {
    await page.goto("/login");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("signup page should have no accessibility violations", async ({
    page,
  }) => {
    await page.goto("/signup");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("dashboard should have no accessibility violations", async ({
    page,
  }) => {
    const authPage = new AuthPage(page);
    const testUser = generateTestUser();

    // Login first
    await authPage.gotoSignup();
    await authPage.fillSignupForm(
      testUser.email,
      testUser.password,
      testUser.password,
      testUser.currency,
    );
    await authPage.submitForm();
    await page.waitForURL("/", { timeout: 10000 });

    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("form inputs should have proper labels", async ({ page }) => {
    await page.goto("/login");

    // Check email input has label
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible();

    // Input should have associated label (either wrapping or via for/id)
    const emailLabel = page.locator(
      'label:has(input[name="email"]), label[for="email"]',
    );
    await expect(emailLabel).toBeVisible();

    // Check password input has label
    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toBeVisible();

    const passwordLabel = page.locator(
      'label:has(input[name="password"]), label[for="password"]',
    );
    await expect(passwordLabel).toBeVisible();
  });

  test("buttons should have accessible names", async ({ page }) => {
    await page.goto("/login");

    // Submit button should have text or aria-label
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();

    // Button should have accessible name
    const buttonText = await submitButton.textContent();
    const ariaLabel = await submitButton.getAttribute("aria-label");

    expect(buttonText || ariaLabel).toBeTruthy();
  });

  test("should support keyboard navigation", async ({ page }) => {
    await page.goto("/login");

    // Tab through form fields
    await page.keyboard.press("Tab");
    let focusedElement = await page.evaluate(
      () => document.activeElement?.tagName,
    );

    // Should focus on input or button
    expect(["INPUT", "BUTTON", "A"]).toContain(focusedElement);

    // Should be able to submit form with Enter key
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password");
    await page.keyboard.press("Enter");

    // Form should attempt to submit (even if credentials are invalid)
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/login");

    // Check for heading
    const headings = await page.locator("h1, h2, h3, h4, h5, h6").all();

    expect(headings.length).toBeGreaterThan(0);

    // First heading should be h1 or h2
    const firstHeading = headings[0];
    const tagName = await firstHeading.evaluate((el) => el.tagName);

    expect(["H1", "H2"]).toContain(tagName);
  });

  test("should have sufficient color contrast", async ({ page }) => {
    await page.goto("/login");

    // Axe checks color contrast, but we can also manually verify
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2aa", "wcag21aa"])
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter((v) =>
      v.id.includes("color-contrast"),
    );

    expect(contrastViolations).toEqual([]);
  });
});
