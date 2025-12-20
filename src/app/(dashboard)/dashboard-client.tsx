/**
 * Dashboard Client Component
 *
 * Client-side interactive dashboard features:
 * - Payment method cards grid
 * - Click to filter transactions by payment method
 * - Transaction list for selected payment method
 *
 * Client Component - manages state for selected payment method
 */

"use client";

import { useState } from "react";
import { PaymentMethodBalanceCard } from "@/components/dashboard/payment-method-balance-card";
import { TransactionListFiltered } from "@/components/dashboard/transaction-list-filtered";
import type { PaymentMethodWithDetails } from "@/app/actions/dashboard";

interface DashboardClientProps {
  paymentMethods: PaymentMethodWithDetails[];
}

export function DashboardClient({ paymentMethods }: DashboardClientProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);

  if (paymentMethods.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
          <svg
            className="w-8 h-8 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          No Payment Methods Yet
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Add a payment method to start tracking your transactions
        </p>
        <a
          href="/payment-methods"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Payment Method
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Payment Methods Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Payment Methods
          </h2>
          {selectedPaymentMethod && (
            <button
              onClick={() => setSelectedPaymentMethod(null)}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentMethods.map((pm) => (
            <PaymentMethodBalanceCard
              key={pm.id}
              paymentMethod={pm}
              onClick={setSelectedPaymentMethod}
            />
          ))}
        </div>
      </div>

      {/* Filtered Transactions */}
      {selectedPaymentMethod && (
        <div className="animate-in slide-in-from-top-4 duration-300">
          <TransactionListFiltered
            paymentMethodId={selectedPaymentMethod}
            onClose={() => setSelectedPaymentMethod(null)}
          />
        </div>
      )}
    </div>
  );
}
