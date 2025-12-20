/**
 * Currency Conversion Utilities
 *
 * Helper functions for multi-currency transaction support.
 * Now uses ExchangeRateService for live API rates with caching.
 * Maintains backward compatibility with existing code.
 */

import { exchangeRateService } from "@/lib/services/exchange-rate-service";

/**
 * Get exchange rate between two currencies.
 * Uses live API rates with 24-hour cache and stale fallback.
 * Handles identity conversions (same currency) automatically.
 *
 * @param fromCurrency - Source currency (ISO 4217 code, e.g., 'EUR')
 * @param toCurrency - Target currency (ISO 4217 code, e.g., 'USD')
 * @param date - Optional date for historical rate (defaults to current date)
 * @returns Exchange rate or null if not available
 *
 * @example
 * ```typescript
 * const rate = await getExchangeRate('EUR', 'USD');
 * // Returns: 1.086957 or null
 * ```
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  date?: Date | string,
): Promise<number | null> {
  try {
    // Handle identity conversion
    if (fromCurrency === toCurrency) {
      return 1.0;
    }

    // Convert date parameter if needed
    const targetDate = date
      ? typeof date === "string"
        ? new Date(date)
        : date
      : undefined;

    // Use exchange rate service
    const result = await exchangeRateService.getRate(
      fromCurrency,
      toCurrency,
      targetDate,
    );

    // Log warnings for stale rates
    if (result.source === "stale") {
      console.warn("Using stale exchange rate:", {
        from: fromCurrency,
        to: toCurrency,
        rate: result.rate,
        fetchedAt: result.fetchedAt,
      });
    }

    return result.rate;
  } catch (err) {
    console.error("Unexpected error in getExchangeRate:", err);
    return null;
  }
}

/**
 * Convert amount between currencies.
 * Uses live API rates with caching for conversion.
 *
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency (ISO 4217 code)
 * @param toCurrency - Target currency (ISO 4217 code)
 * @param date - Optional date for historical rate (defaults to current date)
 * @returns Converted amount (2 decimal precision) or null if rate not available
 *
 * @example
 * ```typescript
 * const converted = await convertAmount(100, 'EUR', 'USD');
 * // Returns: 108.70 or null
 * ```
 */
export async function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  date?: Date | string,
): Promise<number | null> {
  try {
    // Get exchange rate
    const rate = await getExchangeRate(fromCurrency, toCurrency, date);

    if (rate === null) {
      return null;
    }

    // Calculate converted amount and round to 2 decimal places
    return Math.round(amount * rate * 100) / 100;
  } catch (err) {
    console.error("Unexpected error in convertAmount:", err);
    return null;
  }
}

/**
 * Calculate base currency amount from native amount and exchange rate.
 * Rounds to 2 decimal places.
 *
 * @param nativeAmount - Amount in payment method's currency
 * @param exchangeRate - Exchange rate to apply
 * @returns Calculated base amount (2 decimal precision)
 *
 * @example
 * ```typescript
 * const baseAmount = calculateBaseAmount(1000, 0.024390);
 * // Returns: 24.39
 * ```
 */
export function calculateBaseAmount(
  nativeAmount: number,
  exchangeRate: number,
): number {
  return Math.round(nativeAmount * exchangeRate * 100) / 100;
}

/**
 * Validate that base amount matches native amount × exchange rate.
 * Allows small floating-point precision differences (±0.01).
 *
 * @param nativeAmount - Amount in payment method's currency
 * @param exchangeRate - Exchange rate used
 * @param baseAmount - Calculated base amount to validate
 * @returns True if amounts match within tolerance
 */
export function validateAmountCalculation(
  nativeAmount: number,
  exchangeRate: number,
  baseAmount: number,
): boolean {
  const expectedBaseAmount = calculateBaseAmount(nativeAmount, exchangeRate);
  return Math.abs(expectedBaseAmount - baseAmount) <= 0.01;
}
