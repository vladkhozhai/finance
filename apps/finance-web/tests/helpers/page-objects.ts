import type { Page } from "@playwright/test";

/**
 * Page Object Model for Authentication pages
 */
export class AuthPage {
  constructor(private page: Page) {}

  async gotoSignup() {
    await this.page.goto("/signup");
  }

  async gotoLogin() {
    await this.page.goto("/login");
  }

  async fillSignupForm(
    email: string,
    password: string,
    confirmPassword: string,
    currency: string,
  ) {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.fill('input[name="confirmPassword"]', confirmPassword);

    // Open currency select and choose option
    // Shadcn Select: click combobox, then select option by name pattern
    await this.page.click("button#currency");
    // Wait for listbox to appear and click the option matching the currency code
    await this.page.click(`[role="option"]:has-text("${currency}")`);
  }

  async fillLoginForm(email: string, password: string) {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
  }

  async submitForm() {
    await this.page.click('button[type="submit"]');
  }

  async clickLogout() {
    // Assuming there's a logout button in the UI
    await this.page.click('button:has-text("Logout")');
  }

  async waitForToast() {
    // Wait for toast notification to appear
    await this.page.waitForSelector("[data-sonner-toast]", { timeout: 5000 });
  }

  async getToastMessage() {
    const toast = this.page.locator("[data-sonner-toast]").first();
    return await toast.textContent();
  }
}

/**
 * Page Object Model for Dashboard
 */
export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/");
  }

  async isBalanceSummaryVisible() {
    return await this.page.locator("text=/balance/i").isVisible();
  }

  async isActiveBudgetsVisible() {
    return await this.page.locator("text=/budgets/i").isVisible();
  }

  async isExpenseChartVisible() {
    // Check for Recharts container
    return await this.page.locator(".recharts-wrapper").isVisible();
  }

  async getBalance() {
    // This will need to be adjusted based on actual DOM structure
    const balanceElement = this.page.locator('[data-testid="balance-amount"]');
    return await balanceElement.textContent();
  }

  async getBudgetCards() {
    return this.page.locator('[data-testid="budget-card"]');
  }
}

/**
 * Page Object Model for Transactions (future use)
 */
export class TransactionPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/transactions");
  }

  async clickAddTransaction() {
    await this.page.click('button:has-text("Add Transaction")');
  }

  async fillTransactionForm(data: {
    amount: string;
    category: string;
    date: string;
    description?: string;
    tags?: string[];
  }) {
    await this.page.fill('input[name="amount"]', data.amount);
    await this.page.selectOption('select[name="categoryId"]', {
      label: data.category,
    });
    await this.page.fill('input[name="date"]', data.date);

    if (data.description) {
      await this.page.fill('textarea[name="description"]', data.description);
    }

    if (data.tags) {
      await this.page.click('button:has-text("Select tags")');
      for (const tag of data.tags) {
        await this.page.click(`text=${tag}`);
      }
      await this.page.keyboard.press("Escape");
    }
  }

  async submitForm() {
    await this.page.click('button[type="submit"]');
  }

  async getTransactionByDescription(description: string) {
    return this.page.locator(`text=${description}`).locator("..");
  }
}
