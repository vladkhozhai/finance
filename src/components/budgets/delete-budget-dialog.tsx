/**
 * DeleteBudgetDialog Component
 *
 * Confirmation dialog for deleting a budget with warning message.
 */

"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import type { BudgetProgress } from "@/app/actions/budgets";
import { deleteBudget } from "@/app/actions/budgets";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/use-toast";

interface DeleteBudgetDialogProps {
  budget: BudgetProgress;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
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

export function DeleteBudgetDialog({
  budget,
  open,
  onOpenChange,
  onSuccess,
}: DeleteBudgetDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  const targetName = budget.category?.name || budget.tag?.name || "Unknown";

  const handleDelete = async () => {
    setIsDeleting(true);

    const result = await deleteBudget({ id: budget.id });

    setIsDeleting(false);

    if (result.success) {
      showSuccess("Budget deleted successfully");
      onSuccess?.();
    } else {
      showError(result.error || "Failed to delete budget");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="space-y-1">
              <DialogTitle>Delete Budget</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the
                budget.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Budget Details */}
        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Target:</span>
            <span className="font-medium">{targetName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Period:</span>
            <span className="font-medium">{formatPeriod(budget.period)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Limit:</span>
            <span className="font-medium">
              ${budget.budget_amount.toFixed(2)}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Budget"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
