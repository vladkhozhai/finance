/**
 * DeleteTransactionDialog Component
 *
 * Confirmation dialog for deleting a transaction with warning message.
 */

"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  deleteTransaction,
  type TransactionWithRelations,
} from "@/app/actions/transactions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/lib/hooks/use-toast";

interface DeleteTransactionDialogProps {
  transaction: TransactionWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteTransactionDialog({
  transaction,
  open,
  onOpenChange,
  onSuccess,
}: DeleteTransactionDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  const handleDelete = async () => {
    if (!transaction) return;

    setIsDeleting(true);

    const result = await deleteTransaction({ id: transaction.id });

    setIsDeleting(false);

    if (result.success) {
      showSuccess("Transaction deleted successfully");
      onOpenChange(false);
      onSuccess?.();
    } else {
      showError(result.error || "Failed to delete transaction");
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Transaction
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete this
            transaction from your records.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {formatDate(transaction.date)}
                </p>
                {transaction.description && (
                  <p className="text-sm mt-1">{transaction.description}</p>
                )}
              </div>
              <div className="text-right">
                <p
                  className={`text-lg font-bold ${
                    transaction.type === "income"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {transaction.type === "income" ? "+" : "-"}$
                  {formatAmount(transaction.amount)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: transaction.category.color }}
              />
              <span className="text-sm text-muted-foreground">
                {transaction.category.name}
              </span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this transaction? This will affect
            your balance and budget calculations.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
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
              "Delete Transaction"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
