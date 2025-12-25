/**
 * @platform/hooks - Shared React hooks
 *
 * This package provides common React hooks for use across
 * the platform monorepo.
 *
 * @example Media query hooks
 * ```tsx
 * import { useMediaQuery, useIsDesktop, useIsMobile } from '@platform/hooks/media';
 *
 * const isDesktop = useIsDesktop();
 * const isMobile = useIsMobile();
 * const isLarge = useMediaQuery("(min-width: 1024px)");
 * ```
 *
 * @example State management hooks
 * ```tsx
 * import { useDebounce, useLocalStorage, useToggle } from '@platform/hooks/state';
 *
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebounce(search, 300);
 *
 * const [theme, setTheme] = useLocalStorage("theme", "light");
 * const [isOpen, toggleOpen] = useToggle(false);
 * ```
 */

"use client";

// Re-export all hooks
export * from "./media";
export * from "./state";
