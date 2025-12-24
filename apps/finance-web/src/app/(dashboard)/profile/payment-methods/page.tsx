/**
 * Profile - Payment Methods Page (Nested Route)
 *
 * Embeds the full Payment Methods functionality within the Profile section.
 * Uses the existing PaymentMethodsContent component.
 */

import { Suspense } from "react";
import {
  getPaymentMethodBalance,
  getPaymentMethods,
} from "@/app/actions/payment-methods";
import { CreatePaymentMethodDialog } from "@/components/payment-methods/create-payment-method-dialog";
import { PaymentMethodsClient } from "../../payment-methods/payment-methods-client";

async function PaymentMethodsContent() {
  // Fetch all payment methods (active and archived)
  const result = await getPaymentMethods();

  const paymentMethods = result.success ? result.data : [];

  // Fetch balances for all payment methods
  const balancePromises = paymentMethods.map(async (pm) => {
    const balanceResult = await getPaymentMethodBalance(pm.id);
    return {
      id: pm.id,
      balance: balanceResult.success ? balanceResult.data : 0,
    };
  });

  const balanceResults = await Promise.all(balancePromises);
  const balances = new Map(balanceResults.map((b) => [b.id, b.balance]));

  return (
    <PaymentMethodsClient
      initialPaymentMethods={paymentMethods}
      initialBalances={balances}
    />
  );
}

export default function ProfilePaymentMethodsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Methods</h1>
          <p className="text-muted-foreground mt-2">
            Manage your payment methods and track balances across multiple
            currencies
          </p>
        </div>
        <CreatePaymentMethodDialog />
      </div>

      {/* Payment methods list */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        }
      >
        <PaymentMethodsContent />
      </Suspense>
    </div>
  );
}
