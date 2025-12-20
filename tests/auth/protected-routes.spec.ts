import { expect, test } from "@playwright/test";

test.describe("Protected Routes", () => {
  test("should redirect to login when accessing dashboard without authentication", async ({
    page,
  }) => {
    // Try to access dashboard (root page) directly without being logged in
    await page.goto("/");

    // Should be redirected to login page
    await expect(page).toHaveURL("/login");
  });

  test("should redirect to login when accessing transactions without authentication", async ({
    page,
  }) => {
    // Try to access transactions page without being logged in
    await page.goto("/transactions");

    // Should be redirected to login page
    await expect(page).toHaveURL("/login");
  });

  test("should redirect to login when accessing budgets without authentication", async ({
    page,
  }) => {
    // Try to access budgets page without being logged in
    await page.goto("/budgets");

    // Should be redirected to login page
    await expect(page).toHaveURL("/login");
  });

  test("should allow access to public pages without authentication", async ({
    page,
  }) => {
    // Access login page
    await page.goto("/login");
    await expect(page).toHaveURL("/login");

    // Access signup page
    await page.goto("/signup");
    await expect(page).toHaveURL("/signup");
  });
});
