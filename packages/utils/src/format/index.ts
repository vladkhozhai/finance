/**
 * Formatting Utility Functions
 *
 * Helper functions for number, string, and general formatting.
 * Uses native Intl APIs for locale-aware formatting.
 *
 * @module @platform/utils/format
 */

/**
 * Options for number formatting.
 */
export interface NumberFormatOptions {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
}

/**
 * Formats a number with locale-aware thousand separators and decimals.
 *
 * @param value - Number to format
 * @param options - Formatting options
 * @returns Formatted number string
 *
 * @example
 * formatNumber(1234567.89) // "1,234,567.89"
 * formatNumber(1234567.89, { locale: "de-DE" }) // "1.234.567,89"
 * formatNumber(1234.5, { minimumFractionDigits: 2 }) // "1,234.50"
 */
export function formatNumber(
  value: number,
  options: NumberFormatOptions = {},
): string {
  const {
    locale = "en-US",
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping = true,
  } = options;

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
  }).format(value);
}

/**
 * Formats a number as a percentage.
 *
 * @param value - Number to format (0.5 = 50%)
 * @param decimals - Number of decimal places (default: 0)
 * @param locale - Locale string (default: "en-US")
 * @returns Formatted percentage string
 *
 * @example
 * formatPercent(0.5) // "50%"
 * formatPercent(0.1234, 2) // "12.34%"
 * formatPercent(1.5) // "150%"
 */
export function formatPercent(
  value: number,
  decimals = 0,
  locale = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formats a number in compact notation (e.g., 1K, 1M, 1B).
 *
 * @param value - Number to format
 * @param locale - Locale string (default: "en-US")
 * @returns Formatted compact number string
 *
 * @example
 * formatCompact(1234) // "1.2K"
 * formatCompact(1234567) // "1.2M"
 * formatCompact(1234567890) // "1.2B"
 */
export function formatCompact(value: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
  }).format(value);
}

/**
 * Formats bytes into a human-readable string.
 *
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.5 MB")
 *
 * @example
 * formatBytes(1024) // "1 KB"
 * formatBytes(1536) // "1.5 KB"
 * formatBytes(1048576) // "1 MB"
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Truncates a string to a maximum length with ellipsis.
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length including ellipsis
 * @param suffix - Suffix to append (default: "...")
 * @returns Truncated string
 *
 * @example
 * truncate("Hello World", 8) // "Hello..."
 * truncate("Short", 10) // "Short"
 */
export function truncate(str: string, maxLength: number, suffix = "..."): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - suffix.length)}${suffix}`;
}

/**
 * Capitalizes the first letter of a string.
 *
 * @param str - String to capitalize
 * @returns Capitalized string
 *
 * @example
 * capitalize("hello") // "Hello"
 * capitalize("HELLO") // "HELLO"
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a string to title case.
 *
 * @param str - String to convert
 * @returns Title case string
 *
 * @example
 * titleCase("hello world") // "Hello World"
 * titleCase("HELLO WORLD") // "Hello World"
 */
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
}

/**
 * Converts a string to slug format.
 *
 * @param str - String to convert
 * @returns Slug string (lowercase, hyphens instead of spaces)
 *
 * @example
 * slugify("Hello World!") // "hello-world"
 * slugify("This is a TEST") // "this-is-a-test"
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Masks sensitive data, showing only first/last characters.
 *
 * @param str - String to mask
 * @param visibleStart - Number of visible characters at start (default: 4)
 * @param visibleEnd - Number of visible characters at end (default: 4)
 * @param maskChar - Character to use for masking (default: "*")
 * @returns Masked string
 *
 * @example
 * maskString("1234567890123456") // "1234********3456"
 * maskString("email@example.com", 2, 4) // "em***********com"
 */
export function maskString(
  str: string,
  visibleStart = 4,
  visibleEnd = 4,
  maskChar = "*",
): string {
  if (str.length <= visibleStart + visibleEnd) return str;

  const start = str.slice(0, visibleStart);
  const end = str.slice(-visibleEnd);
  const masked = maskChar.repeat(str.length - visibleStart - visibleEnd);

  return `${start}${masked}${end}`;
}

/**
 * Formats a phone number (basic US format).
 *
 * @param phone - Phone number string (digits only or formatted)
 * @returns Formatted phone number or original if invalid
 *
 * @example
 * formatPhone("1234567890") // "(123) 456-7890"
 * formatPhone("12345678901") // "+1 (234) 567-8901"
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return phone;
}

/**
 * Pluralizes a word based on count.
 *
 * @param count - Number to check
 * @param singular - Singular form of word
 * @param plural - Plural form of word (default: singular + "s")
 * @returns Appropriate word form with count
 *
 * @example
 * pluralize(1, "item") // "1 item"
 * pluralize(5, "item") // "5 items"
 * pluralize(2, "child", "children") // "2 children"
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  const word = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${count} ${word}`;
}

/**
 * Joins an array with proper grammar (Oxford comma).
 *
 * @param items - Array of strings to join
 * @param conjunction - Word to use before last item (default: "and")
 * @returns Grammatically joined string
 *
 * @example
 * joinList(["a"]) // "a"
 * joinList(["a", "b"]) // "a and b"
 * joinList(["a", "b", "c"]) // "a, b, and c"
 * joinList(["a", "b", "c"], "or") // "a, b, or c"
 */
export function joinList(items: string[], conjunction = "and"): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;

  return `${items.slice(0, -1).join(", ")}, ${conjunction} ${items[items.length - 1]}`;
}
