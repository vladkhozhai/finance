/**
 * Currency Utility Functions
 *
 * Helper functions for currency formatting, symbol lookup, and display.
 * Supports ISO 4217 currency codes.
 *
 * @module @platform/utils/currency
 */

/**
 * Currency metadata with symbol and name.
 */
export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
}

/**
 * Common currency metadata map.
 */
export const CURRENCY_MAP: Record<string, CurrencyInfo> = {
  USD: { code: "USD", symbol: "$", name: "US Dollar", decimals: 2 },
  EUR: { code: "EUR", symbol: "€", name: "Euro", decimals: 2 },
  UAH: { code: "UAH", symbol: "₴", name: "Ukrainian Hryvnia", decimals: 2 },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", decimals: 2 },
  JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen", decimals: 0 },
  CNY: { code: "CNY", symbol: "¥", name: "Chinese Yuan", decimals: 2 },
  CHF: { code: "CHF", symbol: "CHF", name: "Swiss Franc", decimals: 2 },
  CAD: { code: "CAD", symbol: "C$", name: "Canadian Dollar", decimals: 2 },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar", decimals: 2 },
  PLN: { code: "PLN", symbol: "zł", name: "Polish Złoty", decimals: 2 },
  CZK: { code: "CZK", symbol: "Kč", name: "Czech Koruna", decimals: 2 },
  SEK: { code: "SEK", symbol: "kr", name: "Swedish Krona", decimals: 2 },
  NOK: { code: "NOK", symbol: "kr", name: "Norwegian Krone", decimals: 2 },
  DKK: { code: "DKK", symbol: "kr", name: "Danish Krone", decimals: 2 },
  HUF: { code: "HUF", symbol: "Ft", name: "Hungarian Forint", decimals: 0 },
  RON: { code: "RON", symbol: "lei", name: "Romanian Leu", decimals: 2 },
  BGN: { code: "BGN", symbol: "лв", name: "Bulgarian Lev", decimals: 2 },
  RUB: { code: "RUB", symbol: "₽", name: "Russian Ruble", decimals: 2 },
  TRY: { code: "TRY", symbol: "₺", name: "Turkish Lira", decimals: 2 },
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee", decimals: 2 },
  BRL: { code: "BRL", symbol: "R$", name: "Brazilian Real", decimals: 2 },
  MXN: { code: "MXN", symbol: "MX$", name: "Mexican Peso", decimals: 2 },
  ZAR: { code: "ZAR", symbol: "R", name: "South African Rand", decimals: 2 },
  KRW: { code: "KRW", symbol: "₩", name: "South Korean Won", decimals: 0 },
  SGD: { code: "SGD", symbol: "S$", name: "Singapore Dollar", decimals: 2 },
  HKD: { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", decimals: 2 },
  NZD: { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", decimals: 2 },
  THB: { code: "THB", symbol: "฿", name: "Thai Baht", decimals: 2 },
  MYR: { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", decimals: 2 },
  IDR: { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", decimals: 0 },
  PHP: { code: "PHP", symbol: "₱", name: "Philippine Peso", decimals: 2 },
  VND: { code: "VND", symbol: "₫", name: "Vietnamese Dong", decimals: 0 },
  AED: { code: "AED", symbol: "د.إ", name: "UAE Dirham", decimals: 2 },
  SAR: { code: "SAR", symbol: "﷼", name: "Saudi Riyal", decimals: 2 },
  ILS: { code: "ILS", symbol: "₪", name: "Israeli Shekel", decimals: 2 },
  EGP: { code: "EGP", symbol: "E£", name: "Egyptian Pound", decimals: 2 },
  KWD: { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar", decimals: 3 },
  QAR: { code: "QAR", symbol: "ر.ق", name: "Qatari Riyal", decimals: 2 },
};

/**
 * Gets the currency symbol for a given currency code.
 *
 * @param code - ISO 4217 currency code (e.g., "USD", "EUR")
 * @returns Currency symbol (e.g., "$", "€") or the code itself if not found
 *
 * @example
 * getCurrencySymbol("USD") // "$"
 * getCurrencySymbol("EUR") // "€"
 * getCurrencySymbol("UAH") // "₴"
 */
export function getCurrencySymbol(code: string): string {
  return CURRENCY_MAP[code]?.symbol ?? code;
}

/**
 * Gets the full currency name for a given currency code.
 *
 * @param code - ISO 4217 currency code (e.g., "USD", "EUR")
 * @returns Full currency name (e.g., "US Dollar", "Euro") or the code if not found
 *
 * @example
 * getCurrencyName("USD") // "US Dollar"
 * getCurrencyName("EUR") // "Euro"
 */
export function getCurrencyName(code: string): string {
  return CURRENCY_MAP[code]?.name ?? code;
}

/**
 * Gets the number of decimal places for a currency.
 *
 * @param code - ISO 4217 currency code
 * @returns Number of decimal places (typically 2, but 0 for some currencies like JPY)
 *
 * @example
 * getCurrencyDecimals("USD") // 2
 * getCurrencyDecimals("JPY") // 0
 */
export function getCurrencyDecimals(code: string): number {
  return CURRENCY_MAP[code]?.decimals ?? 2;
}

/**
 * Formats a numeric amount with currency symbol and proper decimal places.
 *
 * @param amount - Numeric amount to format
 * @param currency - ISO 4217 currency code
 * @param locale - Optional locale for number formatting (default: "en-US")
 * @returns Formatted currency string (e.g., "$1,234.56", "€500.00", "₴1,250.50")
 *
 * @example
 * formatCurrency(1234.56, "USD") // "$1,234.56"
 * formatCurrency(500, "EUR") // "€500.00"
 * formatCurrency(1250.5, "UAH") // "₴1,250.50"
 * formatCurrency(10000, "JPY") // "¥10,000"
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale = "en-US",
): string {
  const symbol = getCurrencySymbol(currency);
  const decimals = getCurrencyDecimals(currency);

  // Format number with appropriate decimal places and thousand separators
  const formattedAmount = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  return `${symbol}${formattedAmount}`;
}

/**
 * Gets all available currencies as an array sorted by code.
 *
 * @returns Array of currency info objects
 *
 * @example
 * getAllCurrencies() // [{ code: "AED", symbol: "د.إ", name: "UAE Dirham", decimals: 2 }, ...]
 */
export function getAllCurrencies(): CurrencyInfo[] {
  return Object.values(CURRENCY_MAP).sort((a, b) =>
    a.code.localeCompare(b.code),
  );
}

/**
 * Gets currency info object for a given code.
 *
 * @param code - ISO 4217 currency code
 * @returns Currency info object or undefined if not found
 *
 * @example
 * getCurrencyInfo("USD") // { code: "USD", symbol: "$", name: "US Dollar", decimals: 2 }
 */
export function getCurrencyInfo(code: string): CurrencyInfo | undefined {
  return CURRENCY_MAP[code];
}

/**
 * Validates if a currency code is supported.
 *
 * @param code - ISO 4217 currency code to check
 * @returns true if currency is supported, false otherwise
 *
 * @example
 * isSupportedCurrency("USD") // true
 * isSupportedCurrency("XXX") // false
 */
export function isSupportedCurrency(code: string): boolean {
  return code in CURRENCY_MAP;
}

/**
 * Calculate base currency amount from native amount and exchange rate.
 * Rounds to appropriate decimal places based on currency.
 *
 * @param nativeAmount - Amount in payment method's currency
 * @param exchangeRate - Exchange rate to apply
 * @param targetCurrency - Target currency code for decimal precision (default: 2 decimals)
 * @returns Calculated base amount with proper precision
 *
 * @example
 * calculateBaseAmount(1000, 0.024390) // 24.39
 * calculateBaseAmount(1000, 0.024390, "JPY") // 24
 */
export function calculateBaseAmount(
  nativeAmount: number,
  exchangeRate: number,
  targetCurrency?: string,
): number {
  const decimals = targetCurrency ? getCurrencyDecimals(targetCurrency) : 2;
  const multiplier = 10 ** decimals;
  return Math.round(nativeAmount * exchangeRate * multiplier) / multiplier;
}

/**
 * Validate that base amount matches native amount × exchange rate.
 * Allows small floating-point precision differences.
 *
 * @param nativeAmount - Amount in payment method's currency
 * @param exchangeRate - Exchange rate used
 * @param baseAmount - Calculated base amount to validate
 * @param tolerance - Maximum allowed difference (default: 0.01)
 * @returns True if amounts match within tolerance
 */
export function validateAmountCalculation(
  nativeAmount: number,
  exchangeRate: number,
  baseAmount: number,
  tolerance = 0.01,
): boolean {
  const expectedBaseAmount = calculateBaseAmount(nativeAmount, exchangeRate);
  return Math.abs(expectedBaseAmount - baseAmount) <= tolerance;
}
