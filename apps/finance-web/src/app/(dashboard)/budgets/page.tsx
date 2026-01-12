/**
 * Budgets Page
 *
 * Displays all budgets with progress bars.
 * Allows creating and managing budgets for categories or tags.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BudgetProgress } from "@/app/actions/budgets";
import { getBudgetProgress } from "@/app/actions/budgets";
import { getUserProfile } from "@/app/actions/profile";
import {
  BudgetFilters,
  type BudgetFilterValues,
  BudgetList,
  BudgetOverviewSummary,
  CreateBudgetDialog,
} from "@/components/budgets";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/lib/hooks/use-toast";

/**
 * Sort options for budget list.
 */
type SortOption =
  | "default"
  | "most-overspent"
  | "percentage-desc"
  | "percentage-asc"
  | "amount-desc"
  | "amount-asc";

/**
 * Sorts budgets based on selected sort option.
 */
function sortBudgets(
  budgets: BudgetProgress[],
  sortBy: SortOption,
): BudgetProgress[] {
  switch (sortBy) {
    case "most-overspent":
      return [...budgets].sort((a, b) => {
        // Overspent budgets first (>100%), then by percentage desc
        const aOverspent = a.spent_percentage > 100;
        const bOverspent = b.spent_percentage > 100;
        if (aOverspent && !bOverspent) return -1;
        if (!aOverspent && bOverspent) return 1;
        return b.spent_percentage - a.spent_percentage;
      });
    case "percentage-desc":
      return [...budgets].sort(
        (a, b) => b.spent_percentage - a.spent_percentage,
      );
    case "percentage-asc":
      return [...budgets].sort(
        (a, b) => a.spent_percentage - b.spent_percentage,
      );
    case "amount-desc":
      return [...budgets].sort((a, b) => b.budget_amount - a.budget_amount);
    case "amount-asc":
      return [...budgets].sort((a, b) => a.budget_amount - b.budget_amount);
    default:
      return budgets; // Original order from backend (period DESC, created_at DESC)
  }
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<BudgetFilterValues>({});
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [currency, setCurrency] = useState<string>("USD");

  const { error: showError } = useToast();

  // Memoize sorted budgets to avoid unnecessary re-computations
  const sortedBudgets = useMemo(
    () => sortBudgets(budgets, sortBy),
    [budgets, sortBy],
  );

  // Fetch budgets with filters
  const fetchBudgets = useCallback(async () => {
    setIsLoading(true);

    const result = await getBudgetProgress({
      categoryId: filters.categoryId,
      tagId: filters.tagId,
      period: filters.period,
    });

    if (result.success) {
      setBudgets(result.data || []);
    } else {
      showError(result.error || "Failed to load budgets");
      setBudgets([]);
    }

    setIsLoading(false);
  }, [filters, showError]);

  // Fetch user profile for currency
  const fetchCurrency = useCallback(async () => {
    const result = await getUserProfile();
    if (result.success) {
      setCurrency(result.data.currency || "USD");
    }
  }, []);

  // Fetch budgets on mount and when filters change
  useEffect(() => {
    fetchCurrency();
    fetchBudgets();
  }, [fetchBudgets, fetchCurrency]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: BudgetFilterValues) => {
    setFilters(newFilters);
  };

  // Refresh budgets after create/edit/delete
  const handleBudgetUpdate = () => {
    fetchBudgets();
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Budgets
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Set spending limits and track your budget progress.
          </p>
        </div>
        <CreateBudgetDialog onSuccess={handleBudgetUpdate} />
      </div>

      {/* Filters and Sort Controls */}
      <Card className="p-4 md:p-6">
        <div className="space-y-4">
          {/* Filters */}
          <BudgetFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />

          {/* Sort Control */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-4 border-t">
            <Label htmlFor="sort-by" className="text-sm font-medium shrink-0">
              Sort by:
            </Label>
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortOption)}
            >
              <SelectTrigger id="sort-by" className="w-full sm:w-[240px]">
                <SelectValue placeholder="Select sorting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default (by period)</SelectItem>
                <SelectItem value="most-overspent">Most Overspent</SelectItem>
                <SelectItem value="percentage-desc">
                  Percentage (High to Low)
                </SelectItem>
                <SelectItem value="percentage-asc">
                  Percentage (Low to High)
                </SelectItem>
                <SelectItem value="amount-desc">
                  Amount (High to Low)
                </SelectItem>
                <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Budget Overview Summary */}
      {!isLoading && sortedBudgets.length > 0 && (
        <BudgetOverviewSummary budgets={sortedBudgets} currency={currency} />
      )}

      {/* Budget List */}
      <BudgetList
        budgets={sortedBudgets}
        currency={currency}
        isLoading={isLoading}
        onUpdate={handleBudgetUpdate}
      />
    </div>
  );
}
