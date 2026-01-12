/**
 * Budget Overview Summary Component
 *
 * Displays aggregate budget statistics for the current period:
 * - Total budget amount (sum of all budget limits)
 * - Total spent amount (sum of actual spending)
 * - Overall utilization percentage with color-coded progress bar
 * - Remaining/overspent display
 *
 * Color indicators:
 * - Green: <75% utilized (on track)
 * - Yellow/Orange: 75-90% (caution)
 * - Red: >90% or overspent (warning)
 */

"use client";

import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface BudgetProgress {
  id: string;
  budget_amount: number;
  spent_amount: number;
  spent_percentage: number;
  is_overspent: boolean;
}

interface BudgetOverviewSummaryProps {
  budgets: BudgetProgress[];
  currency: string;
}

export function BudgetOverviewSummary({
  budgets,
  currency,
}: BudgetOverviewSummaryProps) {
  // Calculate totals
  const totalBudget = budgets.reduce(
    (sum, budget) => sum + budget.budget_amount,
    0,
  );
  const totalSpent = budgets.reduce(
    (sum, budget) => sum + budget.spent_amount,
    0,
  );

  // Calculate overall utilization percentage
  const utilizationPercentage =
    totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Determine if over budget
  const isOverBudget = totalSpent > totalBudget;
  const remaining = totalBudget - totalSpent;

  // Determine color scheme based on utilization
  const getColorScheme = () => {
    if (utilizationPercentage >= 90 || isOverBudget) {
      return {
        indicator: "bg-red-600 dark:bg-red-500",
        background: "bg-red-100 dark:bg-red-950",
        text: "text-red-600 dark:text-red-400",
        icon: TrendingUp,
      };
    }
    if (utilizationPercentage >= 75) {
      return {
        indicator: "bg-orange-500 dark:bg-orange-400",
        background: "bg-orange-100 dark:bg-orange-950",
        text: "text-orange-600 dark:text-orange-400",
        icon: TrendingUp,
      };
    }
    return {
      indicator: "bg-green-600 dark:bg-green-500",
      background: "bg-green-100 dark:bg-green-950",
      text: "text-green-600 dark:text-green-400",
      icon: TrendingDown,
    };
  };

  const colorScheme = getColorScheme();
  const StatusIcon = colorScheme.icon;

  // Format currency amount
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  // Show nothing if no budgets
  if (budgets.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-muted-foreground" />
          Budget Overview
        </CardTitle>
        <CardDescription>
          Total budget summary for the current period
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total amounts display */}
        <div className="grid grid-cols-2 gap-4">
          {/* Total Budget */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Budget
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {formatAmount(totalBudget)}
            </p>
          </div>

          {/* Total Spent */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Spent
            </p>
            <p
              className={cn(
                "text-2xl font-bold",
                isOverBudget
                  ? colorScheme.text
                  : "text-zinc-900 dark:text-zinc-50",
              )}
            >
              {formatAmount(totalSpent)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">
              Overall Utilization
            </span>
            <span className={cn("font-semibold", colorScheme.text)}>
              {utilizationPercentage.toFixed(1)}%
            </span>
          </div>
          <Progress
            value={Math.min(utilizationPercentage, 100)}
            className={colorScheme.background}
            indicatorClassName={colorScheme.indicator}
          />
        </div>

        {/* Status message */}
        <div
          className={cn(
            "flex items-center gap-2 p-3 rounded-lg border",
            isOverBudget
              ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900"
              : utilizationPercentage >= 75
                ? "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900"
                : "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900",
          )}
        >
          <StatusIcon className={cn("h-5 w-5", colorScheme.text)} />
          <div className="flex-1">
            {isOverBudget ? (
              <>
                <p className={cn("text-sm font-semibold", colorScheme.text)}>
                  Over Budget
                </p>
                <p className="text-xs text-muted-foreground">
                  You've exceeded your total budget by{" "}
                  {formatAmount(Math.abs(remaining))}
                </p>
              </>
            ) : utilizationPercentage >= 90 ? (
              <>
                <p className={cn("text-sm font-semibold", colorScheme.text)}>
                  Budget Almost Exhausted
                </p>
                <p className="text-xs text-muted-foreground">
                  Only {formatAmount(remaining)} remaining
                </p>
              </>
            ) : utilizationPercentage >= 75 ? (
              <>
                <p className={cn("text-sm font-semibold", colorScheme.text)}>
                  Approaching Budget Limit
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatAmount(remaining)} remaining
                </p>
              </>
            ) : (
              <>
                <p className={cn("text-sm font-semibold", colorScheme.text)}>
                  On Track
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatAmount(remaining)} remaining across all budgets
                </p>
              </>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Active Budgets</p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {budgets.length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Overspent</p>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400">
              {budgets.filter((b) => b.is_overspent).length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">On Track</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              {budgets.filter((b) => !b.is_overspent).length}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}