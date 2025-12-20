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
import { getPaymentMethodBalancesWithDetails } from "@/app/actions/dashboard";
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
  const { data: profile } = await supabase
    .from("profiles")
    .select("currency")
    .eq("id", user.id)
    .maybeSingle() as { data: { currency: string } | null };

  const currency = profile?.currency || "USD";

  // Fetch active budgets with category/tag info
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  const { data: budgets } = (await supabase
    .from("budgets")
    .select(
      `
      id,
      amount,
      category_id,
      tag_id,
      period,
      categories(name, color),
      tags(name)
    `,
    )
    .eq("user_id", user.id)
    .eq("period", `${currentMonth}-01`)) as {
    data: Array<{
      id: string;
      amount: number;
      category_id: string | null;
      tag_id: string | null;
      period: string;
      categories: { name: string; color: string } | null;
      tags: { name: string } | null;
    }> | null;
  };

  // Calculate spent amount for each budget
  const budgetsWithSpent = await Promise.all(
    (budgets || []).map(async (budget) => {
      let spent = 0;

      if (budget.category_id) {
        // Budget for category
        const { data: categoryTransactions } = (await supabase
          .from("transactions")
          .select("amount")
          .eq("user_id", user.id)
          .eq("category_id", budget.category_id)
          .gte("date", budget.period)) as {
          data: Array<{ amount: number }> | null;
        };

        spent =
          categoryTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
      } else if (budget.tag_id) {
        // Budget for tag
        const { data: tagTransactions } = (await supabase
          .from("transaction_tags")
          .select("transactions(amount, date)")
          .eq("tag_id", budget.tag_id)) as {
          data: Array<{
            transactions: { amount: number; date: string } | null;
          }> | null;
        };

        spent =
          tagTransactions
            ?.filter((tt) => {
              const txDate = tt.transactions?.date || "";
              return txDate >= budget.period;
            })
            .reduce((sum, tt) => sum + (tt.transactions?.amount || 0), 0) || 0;
      }

      return {
        id: budget.id,
        name: budget.categories?.name || budget.tags?.name || "Unknown",
        limit: budget.amount,
        spent,
        color: budget.categories?.color || "#3b82f6",
      };
    }),
  );

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
