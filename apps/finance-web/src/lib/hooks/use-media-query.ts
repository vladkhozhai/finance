/**
 * useMediaQuery Hook
 *
 * A React hook that tracks a media query and returns whether it matches.
 * Used for responsive design patterns like switching between Dialog and Drawer.
 */

"use client";

import { useEffect, useState } from "react";

/**
 * Custom hook that listens to a media query and returns whether it matches
 * @param query - CSS media query string (e.g., "(min-width: 768px)")
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
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
 * Convenience hook to check if the device is considered "desktop"
 * Uses Tailwind's md breakpoint (768px) as the threshold
 * @returns boolean indicating if viewport is desktop-sized (>= 768px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 768px)");
}
