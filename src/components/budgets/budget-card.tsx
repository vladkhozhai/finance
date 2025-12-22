/**
 * BudgetCard Component
 *
 * Displays individual budget with progress visualization and quick actions.
 */

"use client";

import { AlertTriangle, Edit, MoreVertical, Trash } from "lucide-react";
import { useState } from "react";
import type { BudgetProgress } from "@/app/actions/budgets";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { BudgetProgressBar } from "./budget-progress-bar";
import { BudgetPaymentBreakdown } from "./budget-payment-breakdown";
import { DeleteBudgetDialog } from "./delete-budget-dialog";
import { EditBudgetDialog } from "./edit-budget-dialog";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";

interface BudgetCardProps {
  budget: BudgetProgress;
  currency?: string; // ISO currency code (e.g., "USD", "EUR", "UAH")
  onUpdate?: () => void;
}

/**
 * Formats period for display (e.g., "January 2025").
 */
function formatPeriod(period: string): string {
  const date = new Date(period);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
  }).format(date);
}

export function BudgetCard({
  budget,
  currency = "USD",
  onUpdate,
}: BudgetCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const remaining = budget.budget_amount - budget.spent_amount;
  const isOverBudget = budget.is_overspent;
  const targetName = budget.category?.name || budget.tag?.name || "Unknown";
  const targetType = budget.category ? "category" : "tag";
  const targetColor = budget.category?.color;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card
              className={cn(
                "cursor-help transition-shadow hover:shadow-md",
                isOverBudget && "border-red-200 bg-red-50/50",
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {targetColor && (
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: targetColor }}
                        />
                      )}
                      <CardTitle className="text-lg">{targetName}</CardTitle>
                      {isOverBudget && (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <CardDescription className="text-xs">
                      {formatPeriod(budget.period)}
                    </CardDescription>
                  </div>

                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Amount Summary */}
                <div className="flex justify-between items-baseline text-sm">
                  <div>
                    <span
                      className={cn(
                        "font-semibold",
                        isOverBudget ? "text-red-600" : "text-foreground",
                      )}
                    >
                      {formatCurrency(budget.spent_amount, currency)}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      of {formatCurrency(budget.budget_amount, currency)}
                    </span>
                  </div>
                  <Badge
                    variant={isOverBudget ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {targetType}
                  </Badge>
                </div>

                {/* Progress Bar */}
                <BudgetProgressBar
                  spent={budget.spent_amount}
                  limit={budget.budget_amount}
                />

                {/* Remaining/Overspent Amount */}
                <div className="pt-1">
                  {isOverBudget ? (
                    <p className="text-xs text-red-600 font-medium">
                      Over budget by{" "}
                      {formatCurrency(Math.abs(remaining), currency)}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(remaining, currency)} remaining
                    </p>
                  )}
                </div>

                {/* Payment Method Breakdown */}
                <BudgetPaymentBreakdown
                  budgetId={budget.id}
                  currency={currency}
                  defaultExpanded={false}
                />
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-2 text-sm">
              <div className="font-semibold border-b border-zinc-700 pb-2">
                {targetName} Budget - {formatPeriod(budget.period)}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-400">Limit:</span>
                  <span className="font-medium">
                    {formatCurrency(budget.budget_amount, currency)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-400">Spent:</span>
                  <span
                    className={cn(
                      "font-medium",
                      isOverBudget && "text-red-400",
                    )}
                  >
                    {formatCurrency(budget.spent_amount, currency)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-400">
                    {isOverBudget ? "Over budget:" : "Remaining:"}
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      isOverBudget ? "text-red-400" : "text-green-400",
                    )}
                  >
                    {formatCurrency(Math.abs(remaining), currency)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-400">Progress:</span>
                  <span className="font-medium">
                    {budget.spent_percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Edit Dialog */}
      <EditBudgetDialog
        budget={budget}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={() => {
          setShowEditDialog(false);
          onUpdate?.();
        }}
      />

      {/* Delete Dialog */}
      <DeleteBudgetDialog
        budget={budget}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={() => {
          setShowDeleteDialog(false);
          onUpdate?.();
        }}
      />
    </>
  );
}
