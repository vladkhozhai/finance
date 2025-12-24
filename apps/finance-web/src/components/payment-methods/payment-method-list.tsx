/**
 * PaymentMethodList Component
 *
 * Container component that displays payment method cards in a responsive grid.
 * Includes loading states, empty state, and filter controls.
 */

"use client";

import { CreditCard } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tables } from "@/types/database.types";
import { PaymentMethodCard } from "./payment-method-card";

type PaymentMethod = Tables<"payment_methods">;

interface PaymentMethodListProps {
  paymentMethods: PaymentMethod[];
  balances: Map<string, number>;
  isLoading?: boolean;
  onEdit: (paymentMethod: PaymentMethod) => void;
  onArchive: (paymentMethod: PaymentMethod) => void;
  onActivate: (paymentMethod: PaymentMethod) => void;
  onDelete: (paymentMethod: PaymentMethod) => void;
  onSetDefault: (paymentMethod: PaymentMethod) => void;
}

export function PaymentMethodList({
  paymentMethods,
  balances,
  isLoading = false,
  onEdit,
  onArchive,
  onActivate,
  onDelete,
  onSetDefault,
}: PaymentMethodListProps) {
  const [showArchived, setShowArchived] = useState(false);

  // Filter payment methods based on archived status
  const filteredPaymentMethods = showArchived
    ? paymentMethods
    : paymentMethods.filter((pm) => pm.is_active);

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (filteredPaymentMethods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <CreditCard className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {showArchived && paymentMethods.length > 0
            ? "No archived payment methods"
            : "No payment methods yet"}
        </h3>
        <p className="text-muted-foreground max-w-md mb-6">
          {showArchived && paymentMethods.length > 0
            ? "You haven't archived any payment methods. Archived methods will appear here."
            : "Add a payment method to start tracking your multi-currency transactions"}
        </p>
        {!showArchived && (
          <Button onClick={() => setShowArchived(false)}>
            Add Payment Method
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter toggle */}
      {paymentMethods.some((pm) => !pm.is_active) && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? "Hide Archived" : "Show Archived"}
          </Button>
        </div>
      )}

      {/* Grid of payment method cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPaymentMethods.map((paymentMethod) => (
          <PaymentMethodCard
            key={paymentMethod.id}
            paymentMethod={paymentMethod}
            balance={balances.get(paymentMethod.id) || 0}
            onEdit={onEdit}
            onArchive={onArchive}
            onActivate={onActivate}
            onDelete={onDelete}
            onSetDefault={onSetDefault}
          />
        ))}
      </div>
    </div>
  );
}
