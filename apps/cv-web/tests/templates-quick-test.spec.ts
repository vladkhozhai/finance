import { test, expect } from "@playwright/test";
import { setupAuthenticatedSession } from "./helpers/auth";

test.describe("Bug #71 - Templates Page Loading Fix", () => {
  test("should display 3 templates on /cv/templates page", async ({ page }) => {
    // Set up authenticated session
    await setupAuthenticatedSession(page);

    // Navigate to templates page
    await page.goto("/cv/templates");

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Verify page title contains "Template"
    await expect(page.locator("h1, h2").filter({ hasText: /template/i }).first()).toBeVisible({ timeout: 5000 });

    // Check page content for all 3 template names
    const pageText = await page.locator("body").textContent();
    expect(pageText).toContain("Modern");
    expect(pageText).toContain("Professional");
    expect(pageText).toContain("Creative");

    // Verify Preview and Use buttons exist
    const previewButtons = page.locator('button').filter({ hasText: 'Preview' });
    const useButtons = page.locator('button').filter({ hasText: 'Use' });

    const previewCount = await previewButtons.count();
    const useCount = await useButtons.count();

    // Should have at least 3 of each button
    expect(previewCount).toBeGreaterThanOrEqual(3);
    expect(useCount).toBeGreaterThanOrEqual(3);

    // Verify no error messages on page
    const errorMessages = page.locator("text=/error|failed|404|500/i");
    expect(await errorMessages.count()).toBe(0);

    // Take a screenshot for documentation
    await page.screenshot({ path: "/tmp/templates-page.png" });

    console.log("PASS: Templates page loaded successfully with all 3 templates visible");
  });
});
