/**
 * EditBudgetDialog Component
 *
 * Dialog for editing an existing budget (amount and period only).
 * Category/tag cannot be changed - user must delete and create new budget.
 */

"use client";

import { Info, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { BudgetProgress } from "@/app/actions/budgets";
import { updateBudget } from "@/app/actions/budgets";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PeriodPicker } from "./period-picker";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";

interface EditBudgetDialogProps {
  budget: BudgetProgress;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditBudgetDialog({
  budget,
  open,
  onOpenChange,
  onSuccess,
}: EditBudgetDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { success: showSuccess, error: showError } = useToast();

  const targetName = budget.category?.name || budget.tag?.name || "Unknown";
  const targetType = budget.category ? "Category" : "Tag";

  // Initialize form with current values
  useEffect(() => {
    if (open) {
      setAmount(budget.budget_amount.toFixed(2));
      setPeriod(budget.period);
      setErrors({});
    }
  }, [open, budget]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Amount validation
    const amountNum = Number.parseFloat(amount);
    if (!amount || Number.isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = "Amount must be a positive number";
    }

    // Period validation
    if (!period || !/^\d{4}-\d{2}-01$/.test(period)) {
      newErrors.period = "Please select a valid period";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const result = await updateBudget({
      id: budget.id,
      amount: Number.parseFloat(amount),
      period,
    });

    setIsSubmitting(false);

    if (result.success) {
      showSuccess("Budget updated successfully");
      onSuccess?.();
    } else {
      showError(result.error || "Failed to update budget");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Budget</DialogTitle>
          <DialogDescription>
            Update the budget amount or period for {targetName}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Display (Read-only) */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">{targetType}</Label>
            <div className="rounded-md border bg-muted/50 p-3">
              <p className="font-medium">{targetName}</p>
            </div>
          </div>

          {/* Info Message */}
          <div className="flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              To change the {targetType.toLowerCase()}, delete this budget and
              create a new one.
            </p>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="edit-amount">
              Budget Amount <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={cn(errors.amount && "border-destructive")}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount}</p>
            )}
          </div>

          {/* Period Picker */}
          <div className="space-y-2">
            <Label>
              Period <span className="text-destructive">*</span>
            </Label>
            <PeriodPicker
              value={period}
              onChange={setPeriod}
              className={cn("w-full", errors.period && "border-destructive")}
            />
            {errors.period && (
              <p className="text-sm text-destructive">{errors.period}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Budget"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
