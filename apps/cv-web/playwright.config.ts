import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration for CVFlow (cv-web)
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  // Run tests in files in parallel
  fullyParallel: true,
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  // Reporter to use
  reporter: [["html"], ["list"]],

  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: "http://localhost:3001",
    // Collect trace when retrying the failed test
    trace: "on-first-retry",
    // Take screenshot only on failure
    screenshot: "only-on-failure",
    // Record video only on failure
    video: "retain-on-failure",
  },

  // Configure projects for major browsers and viewports
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-tablet",
      use: { ...devices["iPad Pro"] },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["iPhone 12"] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});