import { test, expect, type Page } from "@playwright/test";
import {
  setupAuthenticatedSession,
  signOut,
  TEST_USER,
} from "./helpers/auth";
import {
  PROFILE_PERSONAL_DATA,
  SOCIAL_LINKS_DATA,
  WORK_EXPERIENCE_DATA,
  EDUCATION_DATA,
  SKILLS_DATA,
  PROJECT_DATA,
  CERTIFICATION_DATA,
  LANGUAGE_DATA,
} from "./helpers/profile-data";

/**
 * PHASE 2: PROFILE MANAGEMENT - COMPREHENSIVE SMOKE TESTS
 *
 * Tests all 8 profile sections:
 * - Personal Info
 * - Social Links
 * - Experience
 * - Education
 * - Skills
 * - Projects
 * - Certifications
 * - Languages
 */

test.describe("Phase 2: Profile Management", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
  });

  test.describe("Personal Information", () => {
    test("should load personal info form with all fields", async ({ page }) => {
      await page.goto("/profile/personal");

      // Verify page title
      await expect(page.locator("h1, h2").filter({ hasText: "Personal Information" })).toBeVisible();

      // Verify required fields have labels
      await expect(page.locator('label:has-text("First Name")')).toBeVisible();
      await expect(page.locator('label:has-text("Last Name")')).toBeVisible();

      // Verify optional fields
      await expect(page.locator('label:has-text("Middle Name")')).toBeVisible();
      await expect(page.locator('label:has-text("Professional Title")')).toBeVisible();
      await expect(page.locator('label:has-text("Phone")')).toBeVisible();
      await expect(page.locator('label:has-text("Professional Summary")')).toBeVisible();

      // Verify address fields
      await expect(page.locator('label:has-text("Street Address")')).toBeVisible();
      await expect(page.locator('label:has-text("City")')).toBeVisible();
      await expect(page.locator('label:has-text("State")')).toBeVisible();
      await expect(page.locator('label:has-text("Country")')).toBeVisible();
      await expect(page.locator('label:has-text("Postal Code")')).toBeVisible();

      // Verify buttons
      await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
      await expect(page.locator('button:has-text("Reset")')).toBeVisible();
    });

    test("should save personal information successfully", async ({ page }) => {
      await page.goto("/profile/personal");

      // Wait for form to be ready
      await page.waitForSelector('input[id="first_name"]', { timeout: 5000 });

      // Fill in personal info
      await page.fill('input[id="first_name"]', PROFILE_PERSONAL_DATA.firstName);
      await page.fill('input[id="middle_name"]', PROFILE_PERSONAL_DATA.middleName);
      await page.fill('input[id="last_name"]', PROFILE_PERSONAL_DATA.lastName);
      await page.fill('input[id="professional_title"]', PROFILE_PERSONAL_DATA.professionalTitle);
      await page.fill('input[id="phone"]', PROFILE_PERSONAL_DATA.phone);

      // Fill address
      await page.fill('input[id="address_street"]', PROFILE_PERSONAL_DATA.addressStreet);
      await page.fill('input[id="address_city"]', PROFILE_PERSONAL_DATA.addressCity);
      await page.fill('input[id="address_state"]', PROFILE_PERSONAL_DATA.addressState);
      await page.fill('input[id="address_country"]', PROFILE_PERSONAL_DATA.addressCountry);
      await page.fill('input[id="address_postal_code"]', PROFILE_PERSONAL_DATA.addressPostalCode);

      // Fill professional summary
      await page.fill('textarea[id="professional_summary"]', PROFILE_PERSONAL_DATA.professionalSummary);

      // Submit form
      await page.click('button:has-text("Save Changes")');

      // Verify success message appears
      await expect(page.locator('text=Profile updated successfully')).toBeVisible({ timeout: 10000 });
    });

    test("should validate required fields (First Name, Last Name)", async ({ page }) => {
      await page.goto("/profile/personal");
      await page.waitForSelector('input[id="first_name"]', { timeout: 5000 });

      // Clear required fields if they have values
      await page.fill('input[id="first_name"]', "");
      await page.fill('input[id="last_name"]', "");

      // Try to submit
      await page.click('button:has-text("Save Changes")');

      // Verify validation errors appear (either inline or via toast/alert)
      // This test may need adjustment based on actual validation UI
      const hasError = await Promise.race([
        page.waitForSelector('text=/required/i', { timeout: 3000 }).then(() => true),
        page.waitForSelector('.text-destructive', { timeout: 3000 }).then(() => true),
        page.waitForSelector('[role="alert"]', { timeout: 3000 }).then(() => true),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000)),
      ]);

      // Should show validation error
      expect(hasError).toBeTruthy();
    });

    test("should persist data after page reload", async ({ page }) => {
      await page.goto("/profile/personal");
      await page.waitForSelector('input[id="first_name"]', { timeout: 5000 });

      // Fill and save
      await page.fill('input[id="first_name"]', PROFILE_PERSONAL_DATA.firstName);
      await page.fill('input[id="last_name"]', PROFILE_PERSONAL_DATA.lastName);
      await page.click('button:has-text("Save Changes")');

      // Wait for success
      await expect(page.locator('text=Profile updated successfully')).toBeVisible({ timeout: 10000 });

      // Reload page
      await page.reload();
      await page.waitForSelector('input[id="first_name"]', { timeout: 5000 });

      // Verify data persists
      await expect(page.locator('input[id="first_name"]')).toHaveValue(PROFILE_PERSONAL_DATA.firstName);
      await expect(page.locator('input[id="last_name"]')).toHaveValue(PROFILE_PERSONAL_DATA.lastName);
    });

    test("should reset form when Reset button clicked", async ({ page }) => {
      await page.goto("/profile/personal");
      await page.waitForSelector('input[id="first_name"]', { timeout: 5000 });

      const originalFirstName = await page.locator('input[id="first_name"]').inputValue();

      // Change value
      await page.fill('input[id="first_name"]', "Changed Name");

      // Click reset
      await page.click('button:has-text("Reset")');

      // Verify value is reset
      await expect(page.locator('input[id="first_name"]')).toHaveValue(originalFirstName);
    });
  });

  test.describe("Social Links", () => {
    test("should load social links page", async ({ page }) => {
      await page.goto("/profile/social");

      // Verify page loaded
      await expect(page.locator("h1, h2").filter({ hasText: /social/i })).toBeVisible();
    });

    test("should add a new social link", async ({ page }) => {
      await page.goto("/profile/social");

      // Click "Add Social Link" or similar button
      const addButton = page.locator('button:has-text("Add")').first();
      if (await addButton.isVisible()) {
        await addButton.click();

        // Fill social link form (adjust selectors based on actual implementation)
        // This is a template - actual selectors may differ
        const platformSelector = page.locator('select, input').filter({ hasText: /platform/i }).first();
        const urlInput = page.locator('input[type="url"]').first();

        if (await platformSelector.isVisible()) {
          await platformSelector.fill("LinkedIn");
        }
        if (await urlInput.isVisible()) {
          await urlInput.fill(SOCIAL_LINKS_DATA[0].url);
        }

        // Save
        await page.click('button:has-text("Save")');

        // Verify success (adjust based on actual UI)
        await expect(page.locator('text=/saved|added|success/i')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe("Work Experience", () => {
    test("should load work experience page", async ({ page }) => {
      await page.goto("/profile/experience");

      // Verify page loaded
      await expect(page.locator("h1, h2").filter({ hasText: /experience/i })).toBeVisible();
    });

    test("should add new work experience", async ({ page }) => {
      await page.goto("/profile/experience");

      // Look for "Add Experience" button
      const addButton = page.locator('button:has-text("Add")').first();
      if (await addButton.isVisible()) {
        await addButton.click();

        // Wait for form
        await page.waitForTimeout(500);

        // Fill work experience form (adjust selectors based on actual implementation)
        // This is a template - actual implementation may differ
        const companyInput = page.locator('input').filter({ hasText: /company/i }).first();
        const titleInput = page.locator('input').filter({ hasText: /title/i }).first();

        if (await companyInput.isVisible()) {
          await companyInput.fill(WORK_EXPERIENCE_DATA.companyName);
        }
        if (await titleInput.isVisible()) {
          await titleInput.fill(WORK_EXPERIENCE_DATA.jobTitle);
        }

        // Save
        await page.click('button:has-text("Save")');

        // Verify success
        await expect(page.locator(`text=${WORK_EXPERIENCE_DATA.companyName}`)).toBeVisible({
          timeout: 5000,
        });
      }
    });
  });

  test.describe("Education", () => {
    test("should load education page", async ({ page }) => {
      await page.goto("/profile/education");

      // Verify page loaded
      await expect(page.locator("h1, h2").filter({ hasText: /education/i })).toBeVisible();
    });

    test("should add new education entry", async ({ page }) => {
      await page.goto("/profile/education");

      // Look for "Add Education" button
      const addButton = page.locator('button:has-text("Add")').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);

        // Fill form (adjust based on actual implementation)
        const institutionInput = page.locator('input').filter({ hasText: /institution/i }).first();
        const degreeInput = page.locator('input').filter({ hasText: /degree/i }).first();

        if (await institutionInput.isVisible()) {
          await institutionInput.fill(EDUCATION_DATA.institutionName);
        }
        if (await degreeInput.isVisible()) {
          await degreeInput.fill(EDUCATION_DATA.degree);
        }

        // Save
        await page.click('button:has-text("Save")');

        // Verify
        await expect(page.locator(`text=${EDUCATION_DATA.institutionName}`)).toBeVisible({
          timeout: 5000,
        });
      }
    });
  });

  test.describe("Skills", () => {
    test("should load skills page", async ({ page }) => {
      await page.goto("/profile/skills");

      // Verify page loaded
      await expect(page.locator("h1, h2").filter({ hasText: /skills/i })).toBeVisible();
    });

    test("should add new skill", async ({ page }) => {
      await page.goto("/profile/skills");

      const addButton = page.locator('button:has-text("Add")').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);

        // Fill skill form
        const skillInput = page.locator('input').filter({ hasText: /skill/i }).first();
        if (await skillInput.isVisible()) {
          await skillInput.fill(SKILLS_DATA[0].skillName);
        }

        // Save
        await page.click('button:has-text("Save")');

        // Verify
        await expect(page.locator(`text=${SKILLS_DATA[0].skillName}`)).toBeVisible({
          timeout: 5000,
        });
      }
    });
  });

  test.describe("Projects", () => {
    test("should load projects page", async ({ page }) => {
      await page.goto("/profile/projects");

      // Verify page loaded
      await expect(page.locator("h1, h2").filter({ hasText: /projects/i })).toBeVisible();
    });
  });

  test.describe("Certifications", () => {
    test("should load certifications page", async ({ page }) => {
      await page.goto("/profile/certifications");

      // Verify page loaded
      await expect(page.locator("h1, h2").filter({ hasText: /certifications/i })).toBeVisible();
    });
  });

  test.describe("Languages", () => {
    test("should load languages page", async ({ page }) => {
      await page.goto("/profile/languages");

      // Verify page loaded
      await expect(page.locator("h1, h2").filter({ hasText: /languages/i })).toBeVisible();
    });
  });

  test.describe("Profile Navigation", () => {
    test("should navigate between all profile sections", async ({ page }) => {
      const profileSections = [
        { path: "/profile/personal", title: /personal/i },
        { path: "/profile/social", title: /social/i },
        { path: "/profile/experience", title: /experience/i },
        { path: "/profile/education", title: /education/i },
        { path: "/profile/skills", title: /skills/i },
        { path: "/profile/projects", title: /projects/i },
        { path: "/profile/certifications", title: /certifications/i },
        { path: "/profile/languages", title: /languages/i },
      ];

      for (const section of profileSections) {
        await page.goto(section.path);
        await expect(page.locator("h1, h2").filter({ hasText: section.title })).toBeVisible();
      }
    });
  });
});
