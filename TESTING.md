# Testing Guide - FinanceFlow

Complete guide for running and maintaining E2E tests.

---

## Quick Start

```bash
# Run all tests
npm test

# Run tests with UI (interactive mode)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Debug specific test
npm run test:debug tests/auth/signup.spec.ts

# View last test report
npm run test:report
```

---

## Test Structure

```
tests/
├── auth/                        # Authentication tests
│   ├── signup.spec.ts          # User registration (6 tests)
│   ├── login.spec.ts           # User login (6 tests)
│   ├── logout.spec.ts          # User logout (3 tests)
│   └── protected-routes.spec.ts # Route protection (4 tests)
├── dashboard/
│   └── dashboard.spec.ts       # Dashboard functionality (10 tests)
├── accessibility.spec.ts       # WCAG compliance (8 tests)
└── helpers/
    ├── test-user.ts           # Test data generators
    └── page-objects.ts        # Page Object Models
```

**Total Tests**: 37

---

## Running Specific Tests

```bash
# Run single test file
npx playwright test tests/auth/signup.spec.ts

# Run single test by name
npx playwright test -g "should successfully sign up"

# Run tests in specific directory
npx playwright test tests/auth/

# Run only failed tests
npx playwright test --last-failed

# Run with specific browser
npx playwright test --project=chromium
```

---

## Test Modes

### Headless Mode (Default)
```bash
npm test
```
- Runs in background
- Faster execution
- Good for CI/CD

### Headed Mode
```bash
npm run test:headed
```
- Shows browser window
- Watch tests execute
- Good for debugging

### UI Mode (Interactive)
```bash
npm run test:ui
```
- Interactive test runner
- Time-travel debugging
- Watch mode with hot reload

### Debug Mode
```bash
npm run test:debug
```
- Playwright Inspector
- Step through tests
- Set breakpoints

---

## Test Reports

### HTML Report
```bash
# Generate and view report
npm run test:report

# Report location
open playwright-report/index.html
```

**Report includes**:
- Test results summary
- Screenshots of failures
- Video recordings
- Network logs
- Console logs
- Test traces

### Console Report
Tests output to console during execution:
```
✓ tests/auth/signup.spec.ts:6 › should successfully sign up
✗ tests/auth/login.spec.ts:29 › should login with valid credentials
```

---

## Writing New Tests

### Basic Test Structure

```typescript
import { expect, test } from "@playwright/test";

test.describe("Feature Name", () => {
  test("should do something", async ({ page }) => {
    // Navigate
    await page.goto("/path");

    // Interact
    await page.fill('input[name="email"]', "test@example.com");
    await page.click('button[type="submit"]');

    // Assert
    await expect(page).toHaveURL("/expected-url");
  });
});
```

### Using Page Objects

```typescript
import { AuthPage } from "../helpers/page-objects";
import { generateTestUser } from "../helpers/test-user";

test("should signup with page object", async ({ page }) => {
  const authPage = new AuthPage(page);
  const testUser = generateTestUser();

  await authPage.gotoSignup();
  await authPage.fillSignupForm(
    testUser.email,
    testUser.password,
    testUser.password,
    testUser.currency
  );
  await authPage.submitForm();

  await expect(page).toHaveURL("/");
});
```

### Generating Test Users

```typescript
import { generateTestUser } from "../helpers/test-user";

// Single user
const user = generateTestUser();
// { email: "test-1733868000000@example.com", password: "SecurePass123!", currency: "USD" }

// Multiple users
const users = generateTestUsers(3);
```

---

## Best Practices

### 1. Use Unique Test Data
```typescript
// ✅ Good - unique email per test
const testUser = generateTestUser();

// ❌ Bad - hardcoded email causes conflicts
const email = "test@example.com";
```

### 2. Wait for Navigation
```typescript
// ✅ Good - wait for URL change
await page.click('button[type="submit"]');
await page.waitForURL("/dashboard");

// ❌ Bad - race condition
await page.click('button[type="submit"]');
await expect(page).toHaveURL("/dashboard");
```

### 3. Use Semantic Selectors
```typescript
// ✅ Good - accessible selectors
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByLabel('Email').fill('test@example.com');

// ❌ Bad - brittle CSS selectors
await page.click('.btn-primary');
await page.fill('#input-123');
```

### 4. Clean Up Test Data
```typescript
test.afterEach(async ({ page }) => {
  // Logout after each test
  await page.goto("/logout");
});
```

### 5. Use Page Object Model
```typescript
// ✅ Good - reusable page objects
const authPage = new AuthPage(page);
await authPage.gotoSignup();
await authPage.fillSignupForm(...);

// ❌ Bad - duplicated selectors
await page.goto("/signup");
await page.fill('input[name="email"]', email);
await page.fill('input[name="password"]', password);
```

---

## Debugging Tests

### 1. Run in Headed Mode
```bash
npm run test:headed tests/auth/signup.spec.ts
```

### 2. Use Playwright Inspector
```bash
npm run test:debug tests/auth/signup.spec.ts
```

### 3. Add Debug Statements
```typescript
test("debug test", async ({ page }) => {
  await page.goto("/signup");

  // Pause execution
  await page.pause();

  // Take screenshot
  await page.screenshot({ path: "debug.png" });

  // Log page content
  console.log(await page.content());
});
```

### 4. Check Console Logs
```typescript
page.on("console", msg => console.log(msg.text()));
```

### 5. Check Network Requests
```typescript
page.on("request", request =>
  console.log(request.url())
);
```

---

## Common Issues

### Test Timeouts

**Problem**: Test times out waiting for element
```
Error: Timeout 30000ms exceeded
```

**Solutions**:
```typescript
// Increase timeout for specific action
await page.waitForURL("/", { timeout: 60000 });

// Wait for network idle
await page.waitForLoadState("networkidle");

// Wait for specific element
await page.waitForSelector("text=Dashboard");
```

### Element Not Found

**Problem**: Cannot find element
```
Error: locator.click: Target closed
```

**Solutions**:
```typescript
// Wait for element to be visible
await page.waitForSelector('button[type="submit"]', { state: "visible" });

// Check if element exists
const exists = await page.locator('button').count() > 0;

// Use more flexible selector
await page.getByRole('button', { name: /submit|create/i }).click();
```

### Flaky Tests

**Problem**: Test passes sometimes, fails other times

**Solutions**:
```typescript
// Add explicit waits
await page.waitForTimeout(1000); // Last resort

// Wait for animations
await page.waitForLoadState("networkidle");

// Use retry logic
await expect(async () => {
  const text = await page.textContent(".balance");
  expect(text).toBe("$0.00");
}).toPass({ timeout: 5000 });
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Test Data Management

### Creating Test Users
```typescript
// In test setup
const testUser = generateTestUser();

// Signup creates user in database
await authPage.gotoSignup();
await authPage.fillSignupForm(...);
await authPage.submitForm();
```

### Cleaning Up
```typescript
// Option 1: Logout after tests
test.afterEach(async ({ page }) => {
  await page.goto("/logout");
});

// Option 2: Reset database (for local testing)
test.beforeAll(async () => {
  // Run migration reset
  // execSync("supabase db reset");
});
```

---

## Accessibility Testing

### Running Accessibility Tests
```bash
npx playwright test tests/accessibility.spec.ts
```

### Adding Accessibility Checks
```typescript
import AxeBuilder from "@axe-core/playwright";

test("should have no a11y violations", async ({ page }) => {
  await page.goto("/login");

  const results = await new AxeBuilder({ page }).analyze();

  expect(results.violations).toEqual([]);
});
```

---

## Performance Testing

### Measuring Load Time
```typescript
test("dashboard loads quickly", async ({ page }) => {
  const start = Date.now();

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const loadTime = Date.now() - start;
  expect(loadTime).toBeLessThan(3000); // 3 seconds
});
```

### Checking Network Requests
```typescript
test("makes minimal API calls", async ({ page }) => {
  const requests: string[] = [];

  page.on("request", req => requests.push(req.url()));

  await page.goto("/");

  const apiCalls = requests.filter(url => url.includes("/api/"));
  expect(apiCalls.length).toBeLessThan(10);
});
```

---

## Test Maintenance

### When to Update Tests

1. **UI Changes**: Update selectors when UI changes
2. **New Features**: Add tests for new functionality
3. **Bug Fixes**: Add regression tests for fixed bugs
4. **Refactoring**: Update page objects when structure changes

### Keeping Tests Maintainable

1. Use Page Object Model
2. Centralize test data generation
3. Avoid hardcoded values
4. Use meaningful test names
5. Group related tests
6. Document complex test logic

---

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Reports](playwright-report/index.html)
- [Bug Tracking](BUGS.md)
- [Test Report](TEST_REPORT.md)

---

**Questions?** Contact QA Engineer (Agent 05)