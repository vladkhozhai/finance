/**
 * Media Query Hooks
 *
 * React hooks for responsive design and media query matching.
 * Requires a browser environment with window.matchMedia support.
 *
 * @module @platform/hooks/media
 */

"use client";

import { useEffect, useState } from "react";

/**
 * Custom hook that listens to a media query and returns whether it matches.
 * Uses window.matchMedia for efficient media query tracking.
 *
 * @param query - CSS media query string (e.g., "(min-width: 768px)")
 * @returns boolean indicating if the media query matches
 *
 * @example
 * ```tsx
 * const isDark = useMediaQuery("(prefers-color-scheme: dark)");
 * const isLarge = useMediaQuery("(min-width: 1024px)");
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Create listener function
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add event listener
    mediaQuery.addEventListener("change", handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * Convenience hook to check if the device is considered "desktop".
 * Uses Tailwind's md breakpoint (768px) as the threshold.
 *
 * @returns boolean indicating if viewport is desktop-sized (>= 768px)
 *
 * @example
 * ```tsx
 * const isDesktop = useIsDesktop();
 *
 * if (isDesktop) {
 *   return <Dialog>{children}</Dialog>;
 * }
 * return <Drawer>{children}</Drawer>;
 * ```
 */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 768px)");
}

/**
 * Convenience hook to check if the device is considered "mobile".
 * Opposite of useIsDesktop - returns true for viewports < 768px.
 *
 * @returns boolean indicating if viewport is mobile-sized (< 768px)
 *
 * @example
 * ```tsx
 * const isMobile = useIsMobile();
 *
 * if (isMobile) {
 *   return <MobileNav />;
 * }
 * return <DesktopNav />;
 * ```
 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

/**
 * Convenience hook to check if the device is considered "tablet".
 * Returns true for viewports between 768px and 1023px.
 *
 * @returns boolean indicating if viewport is tablet-sized (768px - 1023px)
 *
 * @example
 * ```tsx
 * const isTablet = useIsTablet();
 * ```
 */
export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
}

/**
 * Hook to check if user prefers reduced motion.
 * Useful for disabling animations for accessibility.
 *
 * @returns boolean indicating if user prefers reduced motion
 *
 * @example
 * ```tsx
 * const prefersReducedMotion = usePrefersReducedMotion();
 *
 * const animationDuration = prefersReducedMotion ? 0 : 300;
 * ```
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/**
 * Hook to check if user prefers dark color scheme.
 *
 * @returns boolean indicating if user prefers dark mode
 *
 * @example
 * ```tsx
 * const prefersDark = usePrefersDarkMode();
 * ```
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery("(prefers-color-scheme: dark)");
}
