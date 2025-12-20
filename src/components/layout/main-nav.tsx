/**
 * Main Navigation Component (Mobile Bottom Navigation)
 *
 * Bottom navigation bar with icons for mobile devices (<768px).
 * Features 5 tabs with Quick Action FAB button in center position.
 * Hidden on desktop where AppHeader navigation is used instead.
 */

"use client";

import { LayoutDashboard, Receipt, Target, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { QuickActionButton } from "./quick-action-button";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: Receipt,
  },
  // Quick Action button will be inserted here (center position)
  {
    label: "Budgets",
    href: "/budgets",
    icon: Target,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: User,
  },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t"
      aria-label="Main navigation"
    >
      <div className="flex w-full items-center justify-around px-2 py-2">
        {/* First 2 items: Dashboard, Transactions */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center min-w-[64px] min-h-[56px] rounded-lg transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary hover:bg-accent",
              )}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
            >
              <Icon
                className={cn("h-5 w-5 mb-1", isActive ? "fill-primary" : "")}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "text-xs",
                  isActive ? "font-semibold" : "font-normal",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Center: Quick Action FAB */}
        <QuickActionButton variant="mobile" />

        {/* Last 2 items: Budgets, Profile */}
        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center min-w-[64px] min-h-[56px] rounded-lg transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary hover:bg-accent",
              )}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
            >
              <Icon
                className={cn("h-5 w-5 mb-1", isActive ? "fill-primary" : "")}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "text-xs",
                  isActive ? "font-semibold" : "font-normal",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
