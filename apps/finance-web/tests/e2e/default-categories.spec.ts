import { expect, test } from "@playwright/test";

/**
 * E2E Test: Default Categories on User Signup
 *
 * Tests that new users automatically receive 15 default categories
 * (11 expense + 4 income) when they sign up, allowing them to
 * immediately create transactions without manual category setup.
 *
 * This test verifies Card #37 implementation.
 */

test.describe("Default Categories on Signup", () => {
  const timestamp = Date.now();
  const testEmail = `test-default-categories-${timestamp}@example.com`;
  const testPassword = "TestPassword123!";

  test("should automatically create 15 default categories for new user", async ({
    page,
  }) => {
    // Step 1: Navigate to signup page
    await page.goto("/signup");
    await expect(page).toHaveURL("/signup");

    // Step 2: Fill in signup form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);

    // Step 3: Submit signup form
    await page.click('button[type="submit"]');

    // Step 4: Wait for redirect to dashboard or success page
    // (Adjust timeout if email confirmation is required)
    await page.waitForURL("/dashboard", { timeout: 10000 });

    // Step 5: Navigate to categories page
    await page.goto("/profile");
    await page.click('a[href="/profile/categories"]');
    await expect(page).toHaveURL("/profile/categories");

    // Step 6: Verify all expense categories exist
    const expenseCategories = [
      "Food & Dining",
      "Transportation",
      "Shopping",
      "Entertainment",
      "Bills & Utilities",
      "Healthcare",
      "Education",
      "Home & Garden",
      "Travel",
      "Personal Care",
      "Other Expenses",
    ];

    for (const categoryName of expenseCategories) {
      await expect(page.getByText(categoryName)).toBeVisible();
    }

    // Step 7: Verify all income categories exist
    const incomeCategories = [
      "Salary",
      "Freelance",
      "Investments",
      "Other Income",
    ];

    for (const categoryName of incomeCategories) {
      await expect(page.getByText(categoryName)).toBeVisible();
    }

    // Step 8: Verify total count of categories is 15
    const categoryCards = page.locator('[data-testid="category-card"]');
    await expect(categoryCards).toHaveCount(15);

    // Step 9: Test that transactions page has categories available
    await page.goto("/transactions");
    await page.click('button:has-text("Add Transaction")');

    // Open category dropdown
    await page.click('[data-testid="category-select"]');

    // Verify at least one category is available
    await expect(
      page.locator('[role="option"]:has-text("Food & Dining")')
    ).toBeVisible();

    // Step 10: Test creating a transaction with a default category
    await page.selectOption('[data-testid="category-select"]', {
      label: "Food & Dining",
    });
    await page.fill('input[name="amount"]', "25.50");
    await page.fill('input[name="date"]', "2025-12-22");
    await page.fill('input[name="description"]', "Test transaction with default category");

    await page.click('button[type="submit"]:has-text("Create")');

    // Verify transaction was created successfully
    await expect(page.getByText("Transaction created successfully")).toBeVisible({
      timeout: 5000,
    });

    // Verify transaction appears in the list
    await expect(page.getByText("Test transaction with default category")).toBeVisible();
    await expect(page.getByText("Food & Dining")).toBeVisible();
  });

  test("should create categories with correct types and colors", async ({
    page,
  }) => {
    // This test uses the same user from the previous test
    // Login with the test user
    await page.goto("/login");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // Navigate to categories page
    await page.goto("/profile/categories");

    // Verify expense categories have correct type
    const foodCategory = page.locator('[data-testid="category-card"]:has-text("Food & Dining")');
    await expect(foodCategory.locator('[data-testid="category-type"]')).toHaveText("expense");

    // Verify income categories have correct type
    const salaryCategory = page.locator('[data-testid="category-card"]:has-text("Salary")');
    await expect(salaryCategory.locator('[data-testid="category-type"]')).toHaveText("income");

    // Verify categories have color badges
    await expect(foodCategory.locator('[data-testid="category-color"]')).toBeVisible();
    await expect(salaryCategory.locator('[data-testid="category-color"]')).toBeVisible();
  });

  test("should allow user to create transactions immediately after signup", async ({
    page,
  }) => {
    // Create another new user
    const newTimestamp = Date.now();
    const newEmail = `test-immediate-tx-${newTimestamp}@example.com`;

    await page.goto("/signup");
    await page.fill('input[name="email"]', newEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');

    await page.waitForURL("/dashboard");

    // Navigate directly to transactions page
    await page.goto("/transactions");

    // Create a transaction without visiting categories page first
    await page.click('button:has-text("Add Transaction")');

    // Verify categories are available in dropdown
    await page.click('[data-testid="category-select"]');
    await expect(page.locator('[role="option"]')).toHaveCount(15, { timeout: 5000 });

    // Successfully create a transaction
    await page.selectOption('[data-testid="category-select"]', { label: "Transportation" });
    await page.fill('input[name="amount"]', "45.00");
    await page.fill('input[name="date"]', "2025-12-22");
    await page.click('button[type="submit"]:has-text("Create")');

    // Verify success
    await expect(page.getByText("Transaction created successfully")).toBeVisible();
  });

  test("should not affect existing users", async ({ page }) => {
    // This test verifies that existing users (created before the migration)
    // are not affected by the trigger and still have their original categories

    // Note: This test assumes there's at least one existing user
    // In a real scenario, you'd have a pre-seeded test user

    // For now, we'll skip this test if no existing users exist
    test.skip(true, "Requires pre-existing user for testing backward compatibility");
  });

  test("should handle concurrent signups correctly", async ({ browser }) => {
    // Test that multiple users signing up simultaneously each get their own categories

    const users = [
      `concurrent-user-1-${Date.now()}@example.com`,
      `concurrent-user-2-${Date.now()}@example.com`,
      `concurrent-user-3-${Date.now()}@example.com`,
    ];

    // Create 3 browser contexts (simulating 3 different users)
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);

    const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()));

    // Sign up all users concurrently
    await Promise.all(
      pages.map(async (page, index) => {
        await page.goto("/signup");
        await page.fill('input[name="email"]', users[index]);
        await page.fill('input[name="password"]', testPassword);
        await page.fill('input[name="confirmPassword"]', testPassword);
        await page.click('button[type="submit"]');
        await page.waitForURL("/dashboard", { timeout: 15000 });
      })
    );

    // Verify each user has their own 15 categories
    await Promise.all(
      pages.map(async (page) => {
        await page.goto("/profile/categories");
        const categoryCards = page.locator('[data-testid="category-card"]');
        await expect(categoryCards).toHaveCount(15);
      })
    );

    // Cleanup
    await Promise.all(contexts.map((ctx) => ctx.close()));
  });
});

/**
 * Database-level test: Verify trigger behavior
 *
 * Note: This requires direct database access and should be run separately
 * from E2E tests. For reference only.
 */
test.describe("Database Trigger Verification (Manual)", () => {
  test.skip("should verify trigger creates exactly 15 categories", async () => {
    // This test would require direct Supabase client access
    // Run this SQL manually to verify:
    /*
      -- Create a test user profile directly
      INSERT INTO profiles (id, currency)
      VALUES ('test-uuid-123', 'USD');

      -- Verify 15 categories were created
      SELECT COUNT(*) FROM categories WHERE user_id = 'test-uuid-123';
      -- Expected: 15

      -- Verify breakdown: 11 expense + 4 income
      SELECT type, COUNT(*)
      FROM categories
      WHERE user_id = 'test-uuid-123'
      GROUP BY type;
      -- Expected: expense: 11, income: 4

      -- Cleanup
      DELETE FROM categories WHERE user_id = 'test-uuid-123';
      DELETE FROM profiles WHERE id = 'test-uuid-123';
    */
  });
});
