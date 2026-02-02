/**
 * Dashboard Page
 *
 * Main dashboard view showing:
 * - Multi-currency total balance
 * - Payment method cards with balances
 * - Active budgets with progress
 * - Expense breakdown chart
 *
 * Server Component - fetches data and passes to client components
 */

// Force dynamic rendering - page uses cookies() for auth
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getBudgetProgress } from "@/app/actions/budgets";
import { getPaymentMethodBalancesWithDetails } from "@/app/actions/dashboard";
import { getTotalExpensesForPeriod } from "@/app/actions/transactions";
import { BudgetOverviewSummary } from "@/components/budgets/budget-overview-summary";
import {
  TotalBalanceCard,
  TotalBalanceCardSkeleton,
} from "@/components/dashboard/total-balance-card";
import { ActiveBudgets } from "@/components/features/dashboard/active-budgets";
import { ExpenseChart } from "@/components/features/dashboard/expense-chart";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get authenticated user (guaranteed to exist due to layout auth check)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // This should never happen due to layout authentication
    throw new Error("User not authenticated");
  }

  // Fetch user's profile for currency
  const { data: profile } = (await supabase
    .from("profiles")
    .select("currency")
    .eq("id", user.id)
    .maybeSingle()) as { data: { currency: string } | null };

  const currency = profile?.currency || "USD";

  // Fetch active budgets using getBudgetProgress server action
  // This ensures correct date range filtering (budget.period to period_end)
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`; // YYYY-MM-01 format
  const budgetProgressResult = await getBudgetProgress({
    period: currentMonth,
  });

  const budgetProgressData = budgetProgressResult.success
    ? budgetProgressResult.data || []
    : [];

  // Transform budget progress data for ActiveBudgets component
  const budgetsWithSpent = budgetProgressData.map((budget) => ({
    id: budget.id,
    name: budget.category?.name || budget.tag?.name || "Unknown",
    limit: budget.budget_amount,
    spent: budget.spent_amount,
    color: budget.category?.color || "#3b82f6",
  }));

  // Fetch expense breakdown by category
  const { data: expenseTransactions } = (await supabase
    .from("transactions")
    .select("amount, category_id, categories(name, color, type)")
    .eq("user_id", user.id)) as {
    data: Array<{
      amount: number;
      category_id: string | null;
      categories: { name: string; color: string; type: string } | null;
    }> | null;
  };

  // Group expenses by category
  const categoryExpenses = (expenseTransactions || [])
    .filter((t) => t.categories?.type === "expense")
    .reduce(
      (acc, transaction) => {
        const categoryName = transaction.categories?.name || "Uncategorized";
        const categoryColor = transaction.categories?.color || "#6b7280";

        if (!acc[categoryName]) {
          acc[categoryName] = {
            name: categoryName,
            amount: 0,
            color: categoryColor,
          };
        }

        acc[categoryName].amount += transaction.amount;
        return acc;
      },
      {} as Record<string, { name: string; amount: number; color: string }>,
    );

  const expenseData = Object.values(categoryExpenses);

  // Fetch multi-currency payment method data
  const paymentMethodsResult = await getPaymentMethodBalancesWithDetails();
  const paymentMethods = paymentMethodsResult.success
    ? paymentMethodsResult.data
    : [];

  // Fetch total expenses for the current period (reuse 'now' from above)
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const expensesResult = await getTotalExpensesForPeriod(currentPeriod);
  const totalExpenses = expensesResult.success
    ? expensesResult.data.totalExpenses
    : undefined;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Welcome back! Here's an overview of your finances.
        </p>
      </div>

      {/* Dashboard grid */}
      <div className="grid gap-6 md:gap-8">
        {/* Multi-Currency Total Balance */}
        <Suspense fallback={<TotalBalanceCardSkeleton />}>
          <TotalBalanceCard />
        </Suspense>

        {/* Payment Methods Section */}
        <DashboardClient paymentMethods={paymentMethods} />

        {/* Budget Overview Summary */}
        {budgetProgressData.length > 0 && (
          <BudgetOverviewSummary
            budgets={budgetProgressData}
            currency={currency}
            totalExpenses={totalExpenses}
          />
        )}

        {/* Active Budgets */}
        {budgetsWithSpent.length > 0 && (
          <ActiveBudgets budgets={budgetsWithSpent} currency={currency} />
        )}

        {/* Expense Chart */}
        {expenseData.length > 0 && (
          <ExpenseChart data={expenseData} currency={currency} />
        )}
      </div>
    </div>
  );
}
