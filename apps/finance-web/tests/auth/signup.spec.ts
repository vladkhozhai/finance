import { expect, test } from "@playwright/test";
import { AuthPage } from "../helpers/page-objects";
import { generateTestUser, invalidTestUsers } from "../helpers/test-user";

test.describe("User Signup", () => {
  test("should successfully sign up with valid credentials", async ({
    page,
  }) => {
    const authPage = new AuthPage(page);
    const testUser = generateTestUser();

    await authPage.gotoSignup();

    // Verify signup page loads
    await expect(page).toHaveURL("/signup");
    await expect(
      page.locator("h1, h2").filter({ hasText: /sign up/i }),
    ).toBeVisible();

    // Fill signup form
    await authPage.fillSignupForm(
      testUser.email,
      testUser.password,
      testUser.password,
      testUser.currency,
    );

    // Submit form
    await authPage.submitForm();

    // Wait for redirect to dashboard (root page)
    await page.waitForURL("/", { timeout: 10000 });

    // Verify user is on dashboard
    await expect(page).toHaveURL("/");
  });

  test("should show error when passwords do not match", async ({ page }) => {
    const authPage = new AuthPage(page);
    const testUser = generateTestUser();

    await authPage.gotoSignup();

    // Fill form with mismatched passwords
    await authPage.fillSignupForm(
      testUser.email,
      testUser.password,
      "DifferentPassword123!",
      testUser.currency,
    );

    // Submit form
    await authPage.submitForm();

    // Should show validation error
    await expect(page.locator("text=/passwords.*match/i")).toBeVisible({
      timeout: 5000,
    });

    // Should still be on signup page
    await expect(page).toHaveURL("/signup");
  });

  test("should show error with invalid email format", async ({ page }) => {
    const authPage = new AuthPage(page);

    await authPage.gotoSignup();

    // Fill form with invalid email
    await authPage.fillSignupForm(
      invalidTestUsers.invalidEmail.email,
      invalidTestUsers.invalidEmail.password,
      invalidTestUsers.invalidEmail.password,
      invalidTestUsers.invalidEmail.currency,
    );

    // Submit form
    await authPage.submitForm();

    // Should show validation error
    await expect(
      page.locator("text=/invalid.*email/i, text=/valid.*email/i"),
    ).toBeVisible({ timeout: 5000 });
  });

  test("should show error with weak password", async ({ page }) => {
    const authPage = new AuthPage(page);
    const testUser = generateTestUser();

    await authPage.gotoSignup();

    // Fill form with weak password
    await authPage.fillSignupForm(
      testUser.email,
      invalidTestUsers.weakPassword.password,
      invalidTestUsers.weakPassword.password,
      testUser.currency,
    );

    // Submit form
    await authPage.submitForm();

    // Should show validation error for password strength
    await expect(
      page.locator("text=/password.*characters/i, text=/password.*strong/i"),
    ).toBeVisible({ timeout: 5000 });
  });

  test("should show error when required fields are empty", async ({ page }) => {
    const authPage = new AuthPage(page);

    await authPage.gotoSignup();

    // Try to submit empty form
    await authPage.submitForm();

    // Should show validation errors
    await expect(
      page.locator("text=/required/i, text=/email.*required/i"),
    ).toBeVisible({ timeout: 5000 });
  });

  test("should not allow signup with existing email", async ({ page }) => {
    const authPage = new AuthPage(page);
    const testUser = generateTestUser();

    // First signup - should succeed
    await authPage.gotoSignup();
    await authPage.fillSignupForm(
      testUser.email,
      testUser.password,
      testUser.password,
      testUser.currency,
    );
    await authPage.submitForm();
    await page.waitForURL("/", { timeout: 10000 });

    // Logout
    await page.goto("/login"); // Navigate away to clear session

    // Try to signup again with same email
    await authPage.gotoSignup();
    await authPage.fillSignupForm(
      testUser.email,
      testUser.password,
      testUser.password,
      testUser.currency,
    );
    await authPage.submitForm();

    // Should show error about existing user
    await authPage.waitForToast();
    const toastMessage = await authPage.getToastMessage();
    expect(toastMessage).toMatch(/already.*exist|already.*registered/i);
  });
});
