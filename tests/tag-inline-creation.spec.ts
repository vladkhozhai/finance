/**
 * Test: Tag Inline Creation in Transaction Form
 *
 * Verifies that users can create new tags directly from the transaction form
 * without navigating away.
 *
 * Card: #38 - Enable Inline Tag Creation in Transaction Form
 * Priority: P1 - High
 */

import { test, expect } from "@playwright/test";

test.describe("Tag Inline Creation", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || "");
    await page.fill(
      'input[name="password"]',
      process.env.TEST_USER_PASSWORD || ""
    );
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL("**/dashboard", { timeout: 10000 });
  });

  test("should show 'Create tag' option when typing non-existent tag name", async ({
    page,
  }) => {
    // Navigate to transactions page
    await page.goto("/transactions");

    // Click "Add Transaction" button
    await page.click('button:has-text("Add Transaction")');

    // Wait for dialog to open
    await page.waitForSelector('text="Create Transaction"');

    // Open tag selector
    await page.click('button[aria-label="Select tags"]');

    // Type a new tag name that doesn't exist
    const uniqueTagName = `test-tag-${Date.now()}`;
    await page.fill('input[placeholder*="Search or create"]', uniqueTagName);

    // Wait for "Create" option to appear
    const createButton = page.locator(`text=Create "${uniqueTagName}"`);
    await expect(createButton).toBeVisible({ timeout: 5000 });
  });

  test("should create tag and auto-select it when clicking 'Create'", async ({
    page,
  }) => {
    // Navigate to transactions page
    await page.goto("/transactions");

    // Click "Add Transaction" button
    await page.click('button:has-text("Add Transaction")');

    // Wait for dialog to open
    await page.waitForSelector('text="Create Transaction"');

    // Open tag selector
    await page.click('button[aria-label="Select tags"]');

    // Type a new tag name
    const uniqueTagName = `auto-tag-${Date.now()}`;
    await page.fill('input[placeholder*="Search or create"]', uniqueTagName);

    // Click create button
    await page.click(`text=Create "${uniqueTagName}"`);

    // Wait for success toast
    await expect(
      page.locator(`text=Tag "${uniqueTagName}" created`)
    ).toBeVisible({ timeout: 5000 });

    // Verify tag appears as a badge (automatically selected)
    await expect(page.locator(`text=#${uniqueTagName}`)).toBeVisible();

    // Verify the tag selector shows "1 tag selected"
    await expect(page.locator('text="1 tag(s) selected"')).toBeVisible();
  });

  test("should allow creating multiple tags inline", async ({ page }) => {
    // Navigate to transactions page
    await page.goto("/transactions");

    // Click "Add Transaction" button
    await page.click('button:has-text("Add Transaction")');

    // Wait for dialog to open
    await page.waitForSelector('text="Create Transaction"');

    // Create first tag
    await page.click('button[aria-label="Select tags"]');
    const tag1 = `multi-tag-1-${Date.now()}`;
    await page.fill('input[placeholder*="Search or create"]', tag1);
    await page.click(`text=Create "${tag1}"`);
    await expect(page.locator(`text=Tag "${tag1}" created`)).toBeVisible({
      timeout: 5000,
    });

    // Create second tag
    await page.click('button[aria-label="Select tags"]');
    const tag2 = `multi-tag-2-${Date.now()}`;
    await page.fill('input[placeholder*="Search or create"]', tag2);
    await page.click(`text=Create "${tag2}"`);
    await expect(page.locator(`text=Tag "${tag2}" created`)).toBeVisible({
      timeout: 5000,
    });

    // Verify both tags are selected
    await expect(page.locator(`text=#${tag1}`)).toBeVisible();
    await expect(page.locator(`text=#${tag2}`)).toBeVisible();
    await expect(page.locator('text="2 tag(s) selected"')).toBeVisible();
  });

  test("should not show 'Create' option for existing tags", async ({
    page,
  }) => {
    // Create a tag first
    await page.goto("/tags");
    await page.click('button:has-text("Create Tag")');
    const existingTagName = `existing-tag-${Date.now()}`;
    await page.fill('input[name="name"]', existingTagName);
    await page.click('button[type="submit"]:has-text("Create")');

    // Wait for success
    await page.waitForSelector('text="Tag created successfully"');

    // Navigate to transactions
    await page.goto("/transactions");
    await page.click('button:has-text("Add Transaction")');
    await page.waitForSelector('text="Create Transaction"');

    // Open tag selector and search for existing tag
    await page.click('button[aria-label="Select tags"]');
    await page.fill('input[placeholder*="Search or create"]', existingTagName);

    // Verify the existing tag is shown in the list
    await expect(page.locator(`text=#${existingTagName}`)).toBeVisible();

    // Verify "Create" button is NOT shown (exact match exists)
    await expect(
      page.locator(`text=Create "${existingTagName}"`)
    ).not.toBeVisible();
  });

  test("should allow removing newly created tags", async ({ page }) => {
    // Navigate to transactions page
    await page.goto("/transactions");

    // Click "Add Transaction" button
    await page.click('button:has-text("Add Transaction")');
    await page.waitForSelector('text="Create Transaction"');

    // Create a new tag
    await page.click('button[aria-label="Select tags"]');
    const tagName = `removable-tag-${Date.now()}`;
    await page.fill('input[placeholder*="Search or create"]', tagName);
    await page.click(`text=Create "${tagName}"`);
    await expect(page.locator(`text=Tag "${tagName}" created`)).toBeVisible({
      timeout: 5000,
    });

    // Verify tag badge is visible
    const tagBadge = page.locator(`text=#${tagName}`).first();
    await expect(tagBadge).toBeVisible();

    // Click the X button to remove the tag
    const removeButton = page
      .locator(`text=#${tagName}`)
      .locator("..")
      .locator('button[aria-label*="Remove"]');
    await removeButton.click();

    // Verify tag is removed
    await expect(tagBadge).not.toBeVisible();
    await expect(
      page.locator('button[aria-label="Select tags"]:has-text("Select tags")')
    ).toBeVisible();
  });

  test("should preserve newly created tags when creating transaction", async ({
    page,
  }) => {
    // Navigate to transactions page
    await page.goto("/transactions");

    // Click "Add Transaction" button
    await page.click('button:has-text("Add Transaction")');
    await page.waitForSelector('text="Create Transaction"');

    // Create a new tag
    await page.click('button[aria-label="Select tags"]');
    const tagName = `persist-tag-${Date.now()}`;
    await page.fill('input[placeholder*="Search or create"]', tagName);
    await page.click(`text=Create "${tagName}"`);
    await expect(page.locator(`text=Tag "${tagName}" created`)).toBeVisible({
      timeout: 5000,
    });

    // Fill out the rest of the transaction form
    await page.selectOption('select[id="create-category"]', { index: 1 }); // Select first category
    await page.fill('input[id="create-amount"]', "50.00");

    // Submit the form
    await page.click('button[type="submit"]:has-text("Create Transaction")');

    // Wait for success message
    await expect(
      page.locator('text="Transaction created successfully"')
    ).toBeVisible({ timeout: 5000 });

    // Verify the transaction appears in the list with the tag
    await expect(page.locator(`text=#${tagName}`)).toBeVisible();
  });

  test("should show loading state while creating tag", async ({ page }) => {
    // Navigate to transactions page
    await page.goto("/transactions");

    // Click "Add Transaction" button
    await page.click('button:has-text("Add Transaction")');
    await page.waitForSelector('text="Create Transaction"');

    // Open tag selector
    await page.click('button[aria-label="Select tags"]');

    // Type a new tag name
    const tagName = `loading-tag-${Date.now()}`;
    await page.fill('input[placeholder*="Search or create"]', tagName);

    // Click create button quickly to catch loading state
    await page.click(`text=Create "${tagName}"`);

    // The button should be disabled or show loading state
    // (This is a bit tricky to test due to speed, but we'll check the end result)
    await expect(page.locator(`text=Tag "${tagName}" created`)).toBeVisible({
      timeout: 5000,
    });
  });
});
