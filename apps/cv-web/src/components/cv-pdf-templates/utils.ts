/**
 * PDF Template Utilities
 * Shared helper functions for PDF templates
 */

/**
 * Format date for display (e.g., "Jan 2020")
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

/**
 * Format date range for display
 */
export function formatDateRange(
  startDate: string,
  endDate: string | null | undefined,
  isCurrent?: boolean,
): string {
  const start = formatDate(startDate);
  if (isCurrent) {
    return `${start} - Present`;
  }
  if (endDate) {
    return `${start} - ${formatDate(endDate)}`;
  }
  return start;
}

/**
 * Get full name from profile
 */
export function getFullName(profile: {
  first_name: string;
  last_name: string;
  middle_name?: string | null;
}): string {
  const parts = [profile.first_name];
  if (profile.middle_name) {
    parts.push(profile.middle_name);
  }
  parts.push(profile.last_name);
  return parts.join(" ");
}

/**
 * Get location string
 */
export function getLocation(
  city?: string | null,
  country?: string | null,
): string {
  const parts = [];
  if (city) parts.push(city);
  if (country) parts.push(country);
  return parts.join(", ");
}

/**
 * Get platform display name
 */
export function getPlatformName(platform: string): string {
  const names: Record<string, string> = {
    linkedin: "LinkedIn",
    github: "GitHub",
    twitter: "Twitter",
    portfolio: "Portfolio",
    website: "Website",
    dribbble: "Dribbble",
    behance: "Behance",
    medium: "Medium",
  };
  return names[platform.toLowerCase()] || platform;
}
