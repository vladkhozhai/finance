/**
 * Quick Action Button Component
 *
 * Prominent "Add Transaction" button that adapts based on context:
 * - Desktop: Large button with icon + text in header navigation
 * - Mobile: Elevated FAB-style center button in bottom navigation
 *
 * Wraps the CreateTransactionDialog which manages its own state.
 */

"use client";

import { Plus, PlusCircle } from "lucide-react";
import { CreateTransactionDialog } from "@/components/transactions/create-transaction-dialog";

interface QuickActionButtonProps {
  variant?: "desktop" | "mobile" | "fab";
}

export function QuickActionButton({
  variant = "desktop",
}: QuickActionButtonProps) {
  if (variant === "mobile") {
    // Mobile FAB-style button (center of bottom nav)
    return (
      <CreateTransactionDialog>
        <button
          type="button"
          className="flex flex-col items-center justify-center min-w-[64px] relative"
          aria-label="Add transaction"
        >
          {/* Elevated circular button */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary shadow-lg h-14 w-14 flex items-center justify-center hover:opacity-90 transition-opacity active:scale-95">
            <Plus
              className="h-7 w-7 text-primary-foreground"
              aria-hidden="true"
            />
          </div>
          {/* Label below the FAB */}
          <span className="text-xs font-medium text-primary mt-12">Add</span>
        </button>
      </CreateTransactionDialog>
    );
  }

  if (variant === "fab") {
    // Floating Action Button (fixed bottom-right corner)
    return (
      <CreateTransactionDialog>
        <button
          type="button"
          className="fixed bottom-6 right-6 z-40 rounded-full bg-primary shadow-lg h-14 w-14 flex items-center justify-center hover:opacity-90 transition-all active:scale-95 hover:shadow-xl"
          aria-label="Add transaction"
        >
          <Plus
            className="h-7 w-7 text-primary-foreground"
            aria-hidden="true"
          />
        </button>
      </CreateTransactionDialog>
    );
  }

  // Desktop version (shown in header) - uses Dialog as trigger wrapper
  return (
    <CreateTransactionDialog>
      <button
        type="button"
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:opacity-90 h-10 px-6 py-2"
        aria-label="Add transaction"
      >
        <PlusCircle className="h-5 w-5" aria-hidden="true" />
        <span>Add Transaction</span>
      </button>
    </CreateTransactionDialog>
  );
}
