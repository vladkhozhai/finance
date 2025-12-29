# CVFlow Test Suite - Quick Reference

## Overview

Comprehensive Playwright test suite for CVFlow (cv-web) application covering all 6 development phases.

**Total Tests**: 147
**Framework**: Playwright
**Language**: TypeScript
**Test Environment**: http://localhost:3001

---

## Quick Start

### Install Dependencies
```bash
cd /Users/vladislav.khozhai/WebstormProjects/finance/apps/cv-web
npx playwright install
```

### Run All Tests
```bash
npx playwright test
```

### Run in UI Mode (Recommended)
```bash
npx playwright test --ui
```

### Run Specific Phase
```bash
npx playwright test tests/auth-flows.spec.ts
npx playwright test tests/phase2-profile-management.spec.ts
npx playwright test tests/phase3-templates-preview.spec.ts
npx playwright test tests/phase4-pdf-export.spec.ts
npx playwright test tests/phase5-responsive-ux.spec.ts
npx playwright test tests/phase6-security-rls.spec.ts
```

### Debug Tests
```bash
npx playwright test --debug
npx playwright test --headed
```

### Generate Report
```bash
npx playwright test --reporter=html
npx playwright show-report
```

---

## Test Files

### Authentication & Core Flows
- **auth-flows.spec.ts** (29 tests)
  - Sign-up, Sign-in, Sign-out
  - Forgot password, Reset password
  - Protected routes
  - Session persistence

### Phase 2: Profile Management
- **phase2-profile-management.spec.ts** (30+ tests)
  - Personal Information (name, contact, address, summary)
  - Social Links (LinkedIn, GitHub, Portfolio)
  - Work Experience (CRUD operations)
  - Education (schools, degrees)
  - Skills (technical, proficiency levels)
  - Projects (portfolio items)
  - Certifications (professional credentials)
  - Languages (spoken languages, proficiency)

### Phase 3: Templates & Preview
- **phase3-templates-preview.spec.ts** (28 tests)
  - Template Gallery (3 templates: Modern, Professional, Creative)
  - Template Selection & Switching
  - Real-time CV Preview
  - Zoom Controls (+, -, Reset)
  - Navigation (prev/next templates)
  - Template Visual Quality

### Phase 4: PDF Export
- **phase4-pdf-export.spec.ts** (15 tests)
  - PDF Download Button
  - PDF Generation (all templates)
  - API Endpoint Testing
  - Filename Verification
  - Print Functionality
  - Error Handling
  - Content Accuracy

### Phase 5: UI/UX & Responsive
- **phase5-responsive-ux.spec.ts** (20 tests)
  - Mobile (375px - iPhone 12)
  - Tablet (768px - iPad Pro)
  - Desktop (1920px)
  - Navigation & Header
  - Error Pages (404, auth errors)
  - Loading States
  - Keyboard Navigation
  - Touch Interactions
  - Accessibility (ARIA, labels)
  - Performance Testing

### Phase 6: Security & RLS
- **phase6-security-rls.spec.ts** (25 tests)
  - Authentication Protection
  - Session Management
  - Row Level Security (RLS)
  - XSS Prevention
  - CSRF Protection
  - SQL Injection Prevention
  - Password Security
  - Data Validation
  - Concurrent Sessions

---

## Helper Files

### tests/helpers/auth.ts
Authentication utilities:
- `signUp(page, email, password)` - Create new user
- `signIn(page, email, password)` - Authenticate user
- `signOut(page)` - Log out user
- `setupAuthenticatedSession(page)` - Setup for tests
- `TEST_USER` - Default test credentials

### tests/helpers/profile-data.ts
Test fixture data:
- `PROFILE_PERSONAL_DATA` - Sample profile info
- `SOCIAL_LINKS_DATA` - Sample social links
- `WORK_EXPERIENCE_DATA` - Sample work history
- `EDUCATION_DATA` - Sample education
- `SKILLS_DATA` - Sample skills
- `PROJECT_DATA` - Sample projects
- `CERTIFICATION_DATA` - Sample certifications
- `LANGUAGE_DATA` - Sample languages

---

## Test User

**Email**: cvflow.test.a@example.com
**Password**: TestPass123!

⚠️ **Note**: May need to create new test user after auth fixes.

---

## Configuration

### playwright.config.ts

```typescript
{
  testDir: "./tests",
  baseURL: "http://localhost:3001",
  timeout: 30000,
  retries: 2, // on CI
  workers: 1, // on CI
  browsers: [
    "chromium-desktop",
    "chromium-tablet",
    "chromium-mobile"
  ]
}
```

---

## Test Patterns

### Basic Test Structure
```typescript
import { test, expect } from "@playwright/test";
import { setupAuthenticatedSession } from "./helpers/auth";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
  });

  test("should do something", async ({ page }) => {
    await page.goto("/some-page");
    await expect(page.locator("h1")).toBeVisible();
  });
});
```

### Responsive Testing
```typescript
test("should work on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/dashboard");
  // Test mobile-specific behavior
});
```

### Error Handling
```typescript
test("should show error message", async ({ page }) => {
  await page.goto("/sign-in");
  await page.fill('input[name="email"]', "invalid");
  await page.click('button[type="submit"]');

  const error = page.locator('text=/error/i');
  await expect(error).toBeVisible({ timeout: 5000 });
});
```

---

## Common Selectors

### By Input Name
```typescript
page.locator('input[name="email"]')
page.locator('input[name="password"]')
```

### By ID
```typescript
page.locator('input[id="first_name"]')
page.locator('textarea[id="professional_summary"]')
```

### By Button Text
```typescript
page.locator('button:has-text("Save Changes")')
page.locator('button:has-text("Download PDF")')
```

### By Role
```typescript
page.locator('[role="navigation"]')
page.locator('[role="button"]')
```

### By Test ID (recommended for stable tests)
```typescript
page.locator('[data-testid="submit-button"]')
```

---

## Debugging Tips

### View Test in Browser
```bash
npx playwright test --headed --debug
```

### Slow Down Test Execution
```bash
npx playwright test --headed --slow-mo=1000
```

### Run Single Test
```typescript
test.only("should do something", async ({ page }) => {
  // This test will run alone
});
```

### Skip Test
```typescript
test.skip("should be fixed later", async ({ page }) => {
  // This test will be skipped
});
```

### Take Screenshot
```typescript
await page.screenshot({ path: "debug.png", fullPage: true });
```

### Pause Test
```typescript
await page.pause(); // Opens Playwright Inspector
```

---

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Playwright tests
  run: |
    cd apps/cv-web
    npx playwright test --reporter=html
- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: apps/cv-web/playwright-report/
```

---

## Maintenance

### When to Update Tests

1. **UI Changes**: Update selectors if HTML structure changes
2. **Feature Changes**: Modify test assertions for new behavior
3. **New Features**: Add new test files following existing patterns

### Adding New Tests

1. Create new spec file or add to existing
2. Import helpers from `./helpers/`
3. Use `setupAuthenticatedSession` if auth required
4. Follow existing naming conventions
5. Add descriptive test names

### Test Naming Convention

```typescript
test.describe("Feature Name", () => {
  test.describe("Sub-feature", () => {
    test("should <action> when <condition>", async ({ page }) => {
      // Test implementation
    });
  });
});
```

---

## Known Issues

⚠️ **Current Blockers** (as of 2025-12-26):
1. User sign-in not working (P0)
2. Protected routes not enforcing auth (P0)
3. No error messages on failed auth (P0)
4. Profile pages timing out (P1)

**Impact**: 75% of tests blocked by authentication failures

**Status**: See `/CVFLOW_SMOKE_TEST_REPORT.md` for details

---

## Test Results

### Latest Run (2025-12-26)
```
Tests Run: 37 / 147
Passed: 17 (46%)
Failed: 20 (54%)
Blocked: 110 (75%)
```

### View Results
```bash
npx playwright show-report
```

Or open: `playwright-report/index.html` in browser

---

## Support

### Documentation
- [Playwright Docs](https://playwright.dev/docs/intro)
- [Test Reports](/CVFLOW_SMOKE_TEST_REPORT.md)
- [Handoff Summary](/CVFLOW_QA_HANDOFF_SUMMARY.md)

### Troubleshooting

**Tests timing out?**
- Increase timeout in `playwright.config.ts`
- Check if dev server is running on port 3001

**Authentication failing?**
- Verify test user exists in database
- Check Supabase connection
- See BUG-001 in smoke test report

**Selectors not found?**
- Run test with `--headed` to see UI
- Take screenshot to verify element exists
- Update selector if UI changed

---

**Last Updated**: 2025-12-26
**Version**: 1.0
**Maintainer**: QA Team
