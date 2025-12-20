/**
 * App Header Component
 *
 * Sticky header for desktop (≥768px) containing:
 * - FinanceFlow logo/brand
 * - Main navigation links (Dashboard, Transactions, Budgets, Profile)
 * - Quick Action button (Add Transaction)
 * - User menu with email/name and logout
 *
 * Hidden on mobile (<768px) where bottom nav is used instead
 */

"use client";

import { User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { QuickActionButton } from "./quick-action-button";
import { UserMenu } from "./user-menu";

interface AppHeaderProps {
  userEmail: string;
  userName?: string | null;
}

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Transactions", href: "/transactions" },
  { label: "Budgets", href: "/budgets" },
  { label: "Profile", href: "/profile", icon: User },
];

export function AppHeader({ userEmail, userName }: AppHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 md:px-6">
        {/* Logo/Brand */}
        <div className="mr-8">
          <h1 className="text-xl font-bold text-primary">FinanceFlow</h1>
        </div>

        {/* Main Navigation (Desktop only) */}
        <nav
          className="flex items-center space-x-6"
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary relative py-1 flex items-center gap-2",
                  isActive
                    ? "text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                    : "text-muted-foreground",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Quick Action + User Menu (Desktop) */}
        <div className="ml-auto flex items-center gap-4">
          <QuickActionButton variant="desktop" />
          <UserMenu userEmail={userEmail} userName={userName} />
        </div>
      </div>
    </header>
  );
}
