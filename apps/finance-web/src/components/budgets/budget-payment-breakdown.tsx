/**
 * Budget Payment Method Breakdown Component
 *
 * Displays how different payment methods contribute to budget spending.
 * Shows breakdown by payment method with currency, amounts, percentages, and transaction counts.
 *
 * Features:
 * - Visual progress bars for each payment method
 * - Color-coded by payment method
 * - Tooltips with detailed information
 * - Support for legacy transactions
 * - Responsive design
 */

"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import {
  getBudgetBreakdownByPaymentMethod,
  type BudgetBreakdownResponse,
  type BudgetBreakdownItem,
} from "@/app/actions/budgets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface BudgetPaymentBreakdownProps {
  budgetId: string;
  currency: string;
  defaultExpanded?: boolean;
}

/**
 * Formats currency with proper symbol and decimals.
 */
function formatCurrency(amount: number, currency: string): string {
  return `${currency}${amount.toFixed(2)}`;
}

/**
 * Individual payment method breakdown item row.
 */
function BreakdownItem({
  item,
  budgetCurrency,
}: {
  item: BudgetBreakdownItem;
  budgetCurrency: string;
}) {
  const isLegacy = item.paymentMethodId === null;
  const isOverContributing = item.percentage > 100;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="space-y-2 cursor-help">
            {/* Header Row */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span
                  className={cn(
                    "font-medium truncate",
                    isLegacy && "text-muted-foreground",
                  )}
                >
                  {item.paymentMethodName}
                </span>
                {item.paymentMethodCurrency !== budgetCurrency && (
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {item.paymentMethodCurrency}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-semibold">
                  {formatCurrency(item.amountSpent, budgetCurrency)}
                </span>
                <Badge
                  variant={isOverContributing ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {item.percentage.toFixed(1)}%
                </Badge>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all"
                style={{
                  width: `${Math.min(item.percentage, 100)}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2 text-sm">
            <div className="font-semibold border-b border-zinc-700 pb-2">
              {item.paymentMethodName}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between gap-4">
                <span className="text-zinc-400">Currency:</span>
                <span className="font-medium">
                  {item.paymentMethodCurrency}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-zinc-400">Amount Spent:</span>
                <span className="font-medium">
                  {formatCurrency(item.amountSpent, budgetCurrency)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-zinc-400">Of Budget:</span>
                <span
                  className={cn(
                    "font-medium",
                    isOverContributing && "text-red-400",
                  )}
                >
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-zinc-400">Transactions:</span>
                <span className="font-medium">{item.transactionCount}</span>
              </div>
              {isLegacy && (
                <p className="text-xs text-zinc-400 mt-2 pt-2 border-t border-zinc-700">
                  Legacy transactions are from before multi-currency support was
                  enabled.
                </p>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Main Budget Payment Method Breakdown Component
 */
export function BudgetPaymentBreakdown({
  budgetId,
  currency,
  defaultExpanded = false,
}: BudgetPaymentBreakdownProps) {
  const [breakdown, setBreakdown] = useState<BudgetBreakdownResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Fetch breakdown data
  useEffect(() => {
    async function loadBreakdown() {
      setIsLoading(true);
      setError(null);

      const result = await getBudgetBreakdownByPaymentMethod({ budgetId });

      if (result.success) {
        setBreakdown(result.data);
      } else {
        setError(result.error || "Failed to load breakdown");
      }

      setIsLoading(false);
    }

    if (isExpanded) {
      loadBreakdown();
    }
  }, [budgetId, isExpanded]);

  // Don't render if not expanded and no data yet
  if (!isExpanded && !breakdown) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full mt-2"
        onClick={() => setIsExpanded(true)}
      >
        <CreditCard className="h-4 w-4 mr-2" />
        View Payment Method Breakdown
        <ChevronDown className="h-4 w-4 ml-2" />
      </Button>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
      {/* Header with Collapse Button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Payment Method Breakdown</h4>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="space-y-3">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {breakdown && breakdown.breakdown.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <DollarSign className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No transactions yet for this budget period
              </p>
            </div>
          )}

          {/* Breakdown Items */}
          {breakdown && breakdown.breakdown.length > 0 && !isLoading && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center justify-between text-sm p-3 bg-zinc-50 dark:bg-zinc-900 rounded-md">
                <span className="text-muted-foreground">
                  Total spent across {breakdown.breakdown.length} payment{" "}
                  {breakdown.breakdown.length === 1 ? "method" : "methods"}
                </span>
                <span className="font-semibold">
                  {formatCurrency(breakdown.totalSpent, currency)}
                </span>
              </div>

              {/* List of Payment Methods */}
              <div className="space-y-4">
                {breakdown.breakdown.map((item) => (
                  <BreakdownItem
                    key={item.paymentMethodId || "legacy"}
                    item={item}
                    budgetCurrency={currency}
                  />
                ))}
              </div>

              {/* Footer Note */}
              {breakdown.breakdown.some(
                (item) => item.paymentMethodId === null,
              ) && (
                <p className="text-xs text-muted-foreground italic pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  * Legacy transactions are displayed in your base currency
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
