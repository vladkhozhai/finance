/**
 * BalanceSummary Component
 *
 * Displays overall balance summary with total balance, income, and expense.
 * Uses Card component for visual separation.
 */

"use client";

import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BalanceSummaryProps {
  balance: number;
  income: number;
  expense: number;
  currency?: string;
  isLoading?: boolean;
}

export function BalanceSummary({
  balance,
  income,
  expense,
  currency = "$",
  isLoading = false,
}: BalanceSummaryProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const isNegativeBalance = balance < 0;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 w-20 bg-muted rounded mb-2" />
              <div className="h-8 w-32 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total Balance */}
      <Card className={cn(isNegativeBalance && "border-destructive")}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <Wallet className="h-4 w-4" />
            <span>Total Balance</span>
          </div>
          <div
            className={cn(
              "text-3xl font-bold",
              isNegativeBalance ? "text-destructive" : "text-foreground",
            )}
          >
            {currency}
            {formatAmount(Math.abs(balance))}
            {isNegativeBalance && (
              <span className="ml-1 text-lg font-normal text-destructive">
                (deficit)
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Total Income */}
      <Card className="border-green-200 dark:border-green-900">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span>Total Income</span>
          </div>
          <div className="text-3xl font-bold text-green-600">
            {currency}
            {formatAmount(income)}
          </div>
        </CardContent>
      </Card>

      {/* Total Expense */}
      <Card className="border-red-200 dark:border-red-900">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <span>Total Expense</span>
          </div>
          <div className="text-3xl font-bold text-red-600">
            {currency}
            {formatAmount(expense)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
