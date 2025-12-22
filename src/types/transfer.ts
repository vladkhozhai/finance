/**
 * Transfer-specific types for FinanceFlow
 * Extends the generated database types with transfer logic
 */

import type { Tables } from "./database.types";

// Re-export transaction type from database
export type Transaction = Tables<"transactions">;
export type PaymentMethod = Tables<"payment_methods">;

/**
 * Transaction type enum
 * Explicit type definition for better type safety
 */
export type TransactionType = "income" | "expense" | "transfer";

/**
 * Transfer pair representing a complete transfer operation
 * Each transfer consists of two linked transactions:
 * - Source transaction (withdrawal, negative amount)
 * - Destination transaction (deposit, positive amount)
 */
export interface TransferPair {
  /** ID of the source (withdrawal) transaction */
  id: string;

  /** Source transaction (withdrawal from source payment method) */
  sourceTransaction: Transaction;

  /** Destination transaction (deposit to destination payment method) */
  destinationTransaction: Transaction;

  /** Source payment method details */
  sourcePaymentMethod: PaymentMethod;

  /** Destination payment method details */
  destinationPaymentMethod: PaymentMethod;

  /** Amount withdrawn from source (always negative) */
  sourceAmount: number;

  /** Amount deposited to destination (always positive) */
  destinationAmount: number;

  /** Exchange rate used for currency conversion (if currencies differ) */
  exchangeRate: number;

  /** Transfer date */
  date: string;

  /** Optional description */
  description?: string;
}

/**
 * Input for creating a new transfer
 * Used by the createTransfer Server Action
 */
export interface CreateTransferInput {
  /** UUID of the source payment method (money withdrawn from here) */
  sourcePaymentMethodId: string;

  /** UUID of the destination payment method (money deposited here) */
  destinationPaymentMethodId: string;

  /** Amount in source currency (must be positive, will be negated for withdrawal) */
  amount: number;

  /** Transfer date (ISO format: YYYY-MM-DD) */
  date: string;

  /** Optional description for the transfer */
  description?: string;
}

/**
 * Validation result for transfer creation
 */
export interface TransferValidation {
  isValid: boolean;
  errors: string[];
}

/**
 * Transfer summary for displaying in UI
 * Simplified view of a transfer for list/card views
 */
export interface TransferSummary {
  id: string;
  sourcePaymentMethodName: string;
  destinationPaymentMethodName: string;
  sourceAmount: number;
  sourceCurrency: string;
  destinationAmount: number;
  destinationCurrency: string;
  date: string;
  description?: string;
}

/**
 * Type guard to check if a transaction is a transfer
 */
export function isTransfer(transaction: Transaction): boolean {
  return transaction.type === "transfer";
}

/**
 * Type guard to check if a transaction has a linked transaction
 */
export function hasLinkedTransaction(
  transaction: Transaction,
): transaction is Transaction & { linked_transaction_id: string } {
  return transaction.linked_transaction_id !== null;
}

/**
 * Helper type for transaction with required category
 * Used for income and expense transactions
 */
export type TransactionWithCategory = Transaction & {
  category_id: string;
};

/**
 * Helper type for transfer transaction
 * Transfers have no category but must have linked transaction
 */
export type TransferTransaction = Transaction & {
  type: "transfer";
  category_id: null;
  linked_transaction_id: string;
};
