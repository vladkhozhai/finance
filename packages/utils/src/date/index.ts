/**
 * Date Utility Functions
 *
 * Helper functions for date formatting, parsing, and manipulation.
 * Uses native Date API and Intl for localization.
 *
 * @module @platform/utils/date
 */

/**
 * Date range with start and end dates.
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Preset date range types.
 */
export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "lastYear";

/**
 * Formats a date to ISO date string (YYYY-MM-DD).
 *
 * @param date - Date to format
 * @returns ISO date string
 *
 * @example
 * formatDateISO(new Date("2024-03-15")) // "2024-03-15"
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Formats a date for display using locale-aware formatting.
 *
 * @param date - Date to format
 * @param locale - Locale string (default: "en-US")
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string
 *
 * @example
 * formatDateDisplay(new Date("2024-03-15")) // "Mar 15, 2024"
 * formatDateDisplay(new Date("2024-03-15"), "de-DE") // "15. März 2024"
 */
export function formatDateDisplay(
  date: Date,
  locale = "en-US",
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Formats a date with time for display.
 *
 * @param date - Date to format
 * @param locale - Locale string (default: "en-US")
 * @returns Formatted date and time string
 *
 * @example
 * formatDateTimeDisplay(new Date("2024-03-15T14:30:00")) // "Mar 15, 2024, 2:30 PM"
 */
export function formatDateTimeDisplay(date: Date, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * Formats a date as relative time (e.g., "2 days ago", "in 3 hours").
 *
 * @param date - Date to format
 * @param locale - Locale string (default: "en-US")
 * @returns Relative time string
 *
 * @example
 * const yesterday = new Date(Date.now() - 86400000);
 * formatRelativeTime(yesterday) // "yesterday"
 */
export function formatRelativeTime(date: Date, locale = "en-US"): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);
  const diffWeeks = Math.round(diffDays / 7);
  const diffMonths = Math.round(diffDays / 30);
  const diffYears = Math.round(diffDays / 365);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (Math.abs(diffSecs) < 60) {
    return rtf.format(diffSecs, "second");
  }
  if (Math.abs(diffMins) < 60) {
    return rtf.format(diffMins, "minute");
  }
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }
  if (Math.abs(diffDays) < 7) {
    return rtf.format(diffDays, "day");
  }
  if (Math.abs(diffWeeks) < 4) {
    return rtf.format(diffWeeks, "week");
  }
  if (Math.abs(diffMonths) < 12) {
    return rtf.format(diffMonths, "month");
  }
  return rtf.format(diffYears, "year");
}

/**
 * Gets the start of a day (00:00:00.000).
 *
 * @param date - Reference date
 * @returns New Date set to start of day
 *
 * @example
 * startOfDay(new Date("2024-03-15T14:30:00")) // 2024-03-15T00:00:00.000
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Gets the end of a day (23:59:59.999).
 *
 * @param date - Reference date
 * @returns New Date set to end of day
 *
 * @example
 * endOfDay(new Date("2024-03-15T14:30:00")) // 2024-03-15T23:59:59.999
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Gets the start of a month (first day at 00:00:00.000).
 *
 * @param date - Reference date
 * @returns New Date set to start of month
 *
 * @example
 * startOfMonth(new Date("2024-03-15")) // 2024-03-01T00:00:00.000
 */
export function startOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Gets the end of a month (last day at 23:59:59.999).
 *
 * @param date - Reference date
 * @returns New Date set to end of month
 *
 * @example
 * endOfMonth(new Date("2024-03-15")) // 2024-03-31T23:59:59.999
 */
export function endOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1, 0);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Gets the start of a year (January 1st at 00:00:00.000).
 *
 * @param date - Reference date
 * @returns New Date set to start of year
 *
 * @example
 * startOfYear(new Date("2024-03-15")) // 2024-01-01T00:00:00.000
 */
export function startOfYear(date: Date): Date {
  const result = new Date(date);
  result.setMonth(0, 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Gets the end of a year (December 31st at 23:59:59.999).
 *
 * @param date - Reference date
 * @returns New Date set to end of year
 *
 * @example
 * endOfYear(new Date("2024-03-15")) // 2024-12-31T23:59:59.999
 */
export function endOfYear(date: Date): Date {
  const result = new Date(date);
  result.setMonth(11, 31);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Adds days to a date.
 *
 * @param date - Reference date
 * @param days - Number of days to add (can be negative)
 * @returns New Date with days added
 *
 * @example
 * addDays(new Date("2024-03-15"), 5) // 2024-03-20
 * addDays(new Date("2024-03-15"), -5) // 2024-03-10
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Adds months to a date.
 *
 * @param date - Reference date
 * @param months - Number of months to add (can be negative)
 * @returns New Date with months added
 *
 * @example
 * addMonths(new Date("2024-03-15"), 2) // 2024-05-15
 * addMonths(new Date("2024-03-31"), 1) // 2024-04-30 (clamped to month end)
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setMonth(result.getMonth() + months);
  // Handle month overflow (e.g., Jan 31 + 1 month = Feb 28/29)
  if (result.getDate() !== day) {
    result.setDate(0);
  }
  return result;
}

/**
 * Gets a date range for a preset period.
 *
 * @param preset - Preset period name
 * @param referenceDate - Reference date (default: now)
 * @returns DateRange with start and end dates
 *
 * @example
 * getDateRangePreset("thisMonth") // { start: 2024-03-01, end: 2024-03-31 }
 * getDateRangePreset("last7days") // { start: 7 days ago, end: today }
 */
export function getDateRangePreset(
  preset: DateRangePreset,
  referenceDate: Date = new Date(),
): DateRange {
  const today = startOfDay(referenceDate);

  switch (preset) {
    case "today":
      return { start: today, end: endOfDay(today) };

    case "yesterday": {
      const yesterday = addDays(today, -1);
      return { start: yesterday, end: endOfDay(yesterday) };
    }

    case "last7days":
      return { start: addDays(today, -6), end: endOfDay(today) };

    case "last30days":
      return { start: addDays(today, -29), end: endOfDay(today) };

    case "thisMonth":
      return { start: startOfMonth(today), end: endOfMonth(today) };

    case "lastMonth": {
      const lastMonth = addMonths(today, -1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    }

    case "thisYear":
      return { start: startOfYear(today), end: endOfYear(today) };

    case "lastYear": {
      const lastYear = new Date(today);
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      return { start: startOfYear(lastYear), end: endOfYear(lastYear) };
    }
  }
}

/**
 * Checks if a date is within a date range (inclusive).
 *
 * @param date - Date to check
 * @param range - Date range to check against
 * @returns True if date is within range
 *
 * @example
 * isDateInRange(new Date("2024-03-15"), { start: new Date("2024-03-01"), end: new Date("2024-03-31") }) // true
 */
export function isDateInRange(date: Date, range: DateRange): boolean {
  return date >= range.start && date <= range.end;
}

/**
 * Checks if two dates are the same day.
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if dates are the same day
 *
 * @example
 * isSameDay(new Date("2024-03-15T10:00"), new Date("2024-03-15T20:00")) // true
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Parses a date string safely, returning null on invalid input.
 *
 * @param dateString - String to parse
 * @returns Parsed Date or null if invalid
 *
 * @example
 * parseDate("2024-03-15") // Date object
 * parseDate("invalid") // null
 */
export function parseDate(dateString: string): Date | null {
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? null : date;
}
