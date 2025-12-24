/**
 * Active Budgets Component
 *
 * Displays currently active budgets with progress indicators
 * Shows warning for over-budget categories/tags
 */

import { AlertTriangle, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Budget {
  id: string;
  name: string;
  limit: number;
  spent: number;
  color: string;
}

interface ActiveBudgetsProps {
  budgets: Budget[];
  currency: string;
}

export function ActiveBudgets({ budgets, currency }: ActiveBudgetsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2" className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          Active Budgets
        </CardTitle>
        <CardDescription>
          Track your spending limits for this period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const percentage = Math.min(
              (budget.spent / budget.limit) * 100,
              100,
            );
            const isOverBudget = budget.spent > budget.limit;
            const remaining = budget.limit - budget.spent;

            const formatAmount = (amount: number) =>
              new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(amount);

            return (
              <div
                key={budget.id}
                className="space-y-3 p-4 rounded-lg border bg-card"
              >
                {/* Budget header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: budget.color }}
                    />
                    <h3 className="font-medium text-sm">{budget.name}</h3>
                  </div>
                  {isOverBudget && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Over
                    </Badge>
                  )}
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <Progress
                    value={percentage}
                    className={isOverBudget ? "bg-red-100 dark:bg-red-950" : ""}
                    indicatorClassName={
                      isOverBudget
                        ? "bg-red-600 dark:bg-red-500"
                        : "bg-green-600 dark:bg-green-500"
                    }
                  />

                  {/* Amount details */}
                  <div className="flex justify-between text-xs">
                    <span
                      className={
                        isOverBudget
                          ? "text-red-600 dark:text-red-400 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {formatAmount(budget.spent)}
                    </span>
                    <span className="text-muted-foreground">
                      of {formatAmount(budget.limit)}
                    </span>
                  </div>

                  {/* Remaining or overspent amount */}
                  <p className="text-xs">
                    {isOverBudget ? (
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        Over budget by {formatAmount(Math.abs(remaining))}
                      </span>
                    ) : (
                      <span className="text-green-600 dark:text-green-400">
                        {formatAmount(remaining)} remaining
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
