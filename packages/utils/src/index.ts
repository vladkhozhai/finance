/**
 * @platform/utils - Shared utility functions
 *
 * This package provides common utility functions for use across
 * the platform monorepo.
 *
 * @example Currency utilities
 * ```ts
 * import { formatCurrency, getCurrencySymbol } from '@platform/utils/currency';
 *
 * formatCurrency(1234.56, 'USD'); // '$1,234.56'
 * getCurrencySymbol('EUR'); // '€'
 * ```
 *
 * @example Date utilities
 * ```ts
 * import { formatDateDisplay, getDateRangePreset } from '@platform/utils/date';
 *
 * formatDateDisplay(new Date()); // 'Dec 25, 2024'
 * getDateRangePreset('thisMonth'); // { start: Date, end: Date }
 * ```
 *
 * @example Formatting utilities
 * ```ts
 * import { formatNumber, formatPercent, truncate } from '@platform/utils/format';
 *
 * formatNumber(1234567.89); // '1,234,567.89'
 * formatPercent(0.75); // '75%'
 * truncate('Hello World', 8); // 'Hello...'
 * ```
 */

// Re-export all utilities
export * from "./currency";
export * from "./date";
export * from "./format";
