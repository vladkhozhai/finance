/**
 * DeletePaymentMethodDialog Component
 *
 * Confirmation dialog for deleting a payment method.
 * Warns about irreversibility and suggests archiving instead.
 */

"use client";

import { AlertTriangle } from "lucide-react";
import { useTransition } from "react";
import { deletePaymentMethod } from "@/app/actions/payment-methods";
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
import { getCurrencyName, getCurrencySymbol } from "@/lib/utils/currency";
import type { Tables } from "@/types/database.types";

type PaymentMethod = Tables<"payment_methods">;

interface DeletePaymentMethodDialogProps {
  paymentMethod: PaymentMethod | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeletePaymentMethodDialog({
  paymentMethod,
  open,
  onOpenChange,
}: DeletePaymentMethodDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = () => {
    if (!paymentMethod) return;

    startTransition(async () => {
      const result = await deletePaymentMethod({ id: paymentMethod.id });

      if (result.success) {
        toast.success("Payment method deleted successfully");
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to delete payment method");
      }
    });
  };

  if (!paymentMethod) {
    return null;
  }

  const currencySymbol = getCurrencySymbol(paymentMethod.currency);
  const currencyName = getCurrencyName(paymentMethod.currency);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle>Delete Payment Method?</DialogTitle>
            </div>
          </div>
          <DialogDescription className="pt-2">
            This action cannot be undone. This will permanently delete the
            payment method.
          </DialogDescription>
        </DialogHeader>

        {/* Payment method details preview */}
        <div className="my-4 p-4 bg-muted rounded-lg border">
          <div className="flex items-start gap-3">
            <div
              className="h-10 w-10 rounded-full border-2 border-white shadow-sm flex-shrink-0"
              style={{
                backgroundColor: paymentMethod.color || "#3B82F6",
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{paymentMethod.name}</p>
              <p className="text-sm text-muted-foreground">
                {currencySymbol} {paymentMethod.currency} - {currencyName}
              </p>
            </div>
          </div>
        </div>

        {/* Warning message */}
        <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <div className="mt-0.5">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1">
            <p className="font-medium">Important:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-1">
              <li>You can only delete payment methods with no transactions</li>
              <li>
                Consider archiving instead to preserve transaction history
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete Payment Method"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
