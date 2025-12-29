import { type Page, expect } from "@playwright/test";

/**
 * Test user credentials
 */
export const TEST_USER = {
  email: "cvflow.test.a@example.com",
  password: "TestPass123!",
  firstName: "Test",
  lastName: "User",
};

/**
 * Sign up a new user
 */
export async function signUp(page: Page, email: string, password: string) {
  await page.goto("/sign-up");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await expect(page).toHaveURL("/dashboard", { timeout: 10000 });
}

/**
 * Sign in with existing credentials
 */
export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await expect(page).toHaveURL("/dashboard", { timeout: 10000 });
}

/**
 * Sign out the current user
 */
export async function signOut(page: Page) {
  // Click sign out button (it's directly on the dashboard, not in a menu)
  await page.click('button:has-text("Sign out")');

  // Wait for redirect to sign-in
  await expect(page).toHaveURL("/sign-in", { timeout: 5000 });
}

/**
 * Check if user is authenticated (on dashboard)
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1", { timeout: 3000 });
    return page.url().includes("/dashboard");
  } catch {
    return false;
  }
}

/**
 * Setup authenticated session for tests
 * Use this in beforeEach to ensure user is logged in
 */
export async function setupAuthenticatedSession(page: Page) {
  const authenticated = await isAuthenticated(page);

  if (!authenticated) {
    try {
      await signIn(page, TEST_USER.email, TEST_USER.password);
    } catch {
      // If sign-in fails, user might not exist - try sign up
      await signUp(page, TEST_USER.email, TEST_USER.password);
    }
  }
}