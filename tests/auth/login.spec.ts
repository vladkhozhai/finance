import { expect, test } from "@playwright/test";
import { AuthPage } from "../helpers/page-objects";
import { generateTestUser } from "../helpers/test-user";

test.describe("User Login", () => {
  // Setup: Create a user before login tests
  test.beforeEach(async ({ page }) => {
    const authPage = new AuthPage(page);
    const testUser = generateTestUser();

    // Store test user for use in tests
    (page as any).testUser = testUser;

    // Create user account
    await authPage.gotoSignup();
    await authPage.fillSignupForm(
      testUser.email,
      testUser.password,
      testUser.password,
      testUser.currency,
    );
    await authPage.submitForm();
    await page.waitForURL("/", { timeout: 10000 });

    // Logout to start fresh
    await page.goto("/login");
  });

  test("should successfully login with valid credentials", async ({ page }) => {
    const authPage = new AuthPage(page);
    const testUser = (page as any).testUser;

    await authPage.gotoLogin();

    // Verify login page loads
    await expect(page).toHaveURL("/login");
    await expect(
      page.locator("h1, h2").filter({ hasText: /log in|sign in/i }),
    ).toBeVisible();

    // Fill login form
    await authPage.fillLoginForm(testUser.email, testUser.password);

    // Submit form
    await authPage.submitForm();

    // Wait for redirect to dashboard
    await page.waitForURL("/", { timeout: 10000 });

    // Verify user is logged in
    await expect(page).toHaveURL("/");
  });

  test("should show error with incorrect password", async ({ page }) => {
    const authPage = new AuthPage(page);
    const testUser = (page as any).testUser;

    await authPage.gotoLogin();

    // Fill form with wrong password
    await authPage.fillLoginForm(testUser.email, "WrongPassword123!");

    // Submit form
    await authPage.submitForm();

    // Should show error toast
    await authPage.waitForToast();
    const toastMessage = await authPage.getToastMessage();
    expect(toastMessage).toMatch(/invalid.*credentials|incorrect.*password/i);

    // Should still be on login page
    await expect(page).toHaveURL("/login");
  });

  test("should show error with non-existent email", async ({ page }) => {
    const authPage = new AuthPage(page);

    await authPage.gotoLogin();

    // Fill form with non-existent email
    await authPage.fillLoginForm("nonexistent@example.com", "SomePassword123!");

    // Submit form
    await authPage.submitForm();

    // Should show error toast
    await authPage.waitForToast();
    const toastMessage = await authPage.getToastMessage();
    expect(toastMessage).toMatch(/invalid.*credentials|user.*not.*found/i);

    // Should still be on login page
    await expect(page).toHaveURL("/login");
  });

  test("should show error when email field is empty", async ({ page }) => {
    const authPage = new AuthPage(page);

    await authPage.gotoLogin();

    // Fill only password
    await page.fill('input[name="password"]', "SomePassword123!");

    // Submit form
    await authPage.submitForm();

    // Should show validation error
    await expect(
      page.locator("text=/email.*required/i, text=/required/i"),
    ).toBeVisible({ timeout: 5000 });
  });

  test("should show error when password field is empty", async ({ page }) => {
    const authPage = new AuthPage(page);

    await authPage.gotoLogin();

    // Fill only email
    await page.fill('input[name="email"]', "test@example.com");

    // Submit form
    await authPage.submitForm();

    // Should show validation error
    await expect(
      page.locator("text=/password.*required/i, text=/required/i"),
    ).toBeVisible({ timeout: 5000 });
  });

  test("should have link to signup page", async ({ page }) => {
    await page.goto("/login");

    // Look for link to signup
    const signupLink = page.locator(
      'a[href*="signup"], text=/sign up|create.*account/i',
    );
    await expect(signupLink).toBeVisible();

    // Click link and verify navigation
    await signupLink.click();
    await expect(page).toHaveURL("/signup");
  });
});
