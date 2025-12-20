/**
 * PaymentMethodsClient Component
 *
 * Client-side component for payment methods management.
 * Handles dialogs, optimistic updates, and user interactions.
 */

"use client";

import { useState, useTransition } from "react";
import {
  activatePaymentMethod,
  archivePaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
} from "@/app/actions/payment-methods";
import { DeletePaymentMethodDialog } from "@/components/payment-methods/delete-payment-method-dialog";
import { EditPaymentMethodDialog } from "@/components/payment-methods/edit-payment-method-dialog";
import { PaymentMethodList } from "@/components/payment-methods/payment-method-list";
import { useToast } from "@/lib/hooks/use-toast";
import type { Tables } from "@/types/database.types";

type PaymentMethod = Tables<"payment_methods">;

interface PaymentMethodsClientProps {
  initialPaymentMethods: PaymentMethod[];
  initialBalances: Map<string, number>;
}

export function PaymentMethodsClient({
  initialPaymentMethods,
  initialBalances,
}: PaymentMethodsClientProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);

  // Handlers
  const handleEdit = (paymentMethod: PaymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    setEditDialogOpen(true);
  };

  const handleArchive = (paymentMethod: PaymentMethod) => {
    startTransition(async () => {
      const result = await archivePaymentMethod({ id: paymentMethod.id });

      if (result.success) {
        toast.success("Payment method archived successfully");
      } else {
        toast.error(result.error || "Failed to archive payment method");
      }
    });
  };

  const handleActivate = (paymentMethod: PaymentMethod) => {
    startTransition(async () => {
      const result = await activatePaymentMethod({ id: paymentMethod.id });

      if (result.success) {
        toast.success("Payment method activated successfully");
      } else {
        toast.error(result.error || "Failed to activate payment method");
      }
    });
  };

  const handleDelete = (paymentMethod: PaymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    setDeleteDialogOpen(true);
  };

  const handleSetDefault = (paymentMethod: PaymentMethod) => {
    startTransition(async () => {
      const result = await setDefaultPaymentMethod(paymentMethod.id);

      if (result.success) {
        toast.success("Default payment method updated");
      } else {
        toast.error(result.error || "Failed to set default payment method");
      }
    });
  };

  return (
    <>
      <PaymentMethodList
        paymentMethods={initialPaymentMethods}
        balances={initialBalances}
        isLoading={false}
        onEdit={handleEdit}
        onArchive={handleArchive}
        onActivate={handleActivate}
        onDelete={handleDelete}
        onSetDefault={handleSetDefault}
      />

      {/* Edit dialog */}
      <EditPaymentMethodDialog
        paymentMethod={selectedPaymentMethod}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* Delete dialog */}
      <DeletePaymentMethodDialog
        paymentMethod={selectedPaymentMethod}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </>
  );
}
