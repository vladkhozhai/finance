/**
 * BudgetList Component
 *
 * Container for budget cards with grid layout, empty state, and loading skeleton.
 */

"use client";

import { Wallet } from "lucide-react";
import type { BudgetProgress } from "@/app/actions/budgets";
import { Card } from "@/components/ui/card";
import { BudgetCard } from "./budget-card";

interface BudgetListProps {
  budgets: BudgetProgress[];
  currency?: string;
  isLoading?: boolean;
  onUpdate?: () => void;
}

/**
 * Loading skeleton for budget cards.
 */
function BudgetCardSkeleton() {
  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <div className="h-5 w-32 bg-muted animate-pulse rounded" />
        <div className="h-3 w-24 bg-muted animate-pulse rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-muted animate-pulse rounded" />
        <div className="h-2 w-full bg-muted animate-pulse rounded" />
      </div>
      <div className="h-3 w-20 bg-muted animate-pulse rounded" />
    </Card>
  );
}

/**
 * Empty state when no budgets exist.
 */
function EmptyState() {
  return (
    <Card className="col-span-full">
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <Wallet className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No budgets yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Create your first budget to start tracking your spending limits and
          stay on top of your finances.
        </p>
      </div>
    </Card>
  );
}

export function BudgetList({
  budgets,
  currency,
  isLoading,
  onUpdate,
}: BudgetListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <BudgetCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (budgets.length === 0) {
    return <EmptyState />;
  }

  // Budget cards grid
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {budgets.map((budget) => (
        <BudgetCard
          key={budget.id}
          budget={budget}
          currency={currency}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}
