/**
 * Profile Navigation Component
 *
 * Horizontal navigation for Profile section.
 * Desktop: Horizontal tabs with icons and labels
 * Mobile: Dropdown menu showing current page
 *
 * Replaces the vertical sidebar with a more space-efficient design.
 */

"use client";

import {
  ChevronDown,
  CreditCard,
  FileText,
  FolderOpen,
  Settings,
  Tag,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/profile/overview", label: "Overview", icon: User },
  {
    href: "/profile/payment-methods",
    label: "Payment Methods",
    icon: CreditCard,
  },
  { href: "/profile/categories", label: "Categories", icon: FolderOpen },
  { href: "/profile/tags", label: "Tags", icon: Tag },
  { href: "/profile/templates", label: "Templates", icon: FileText },
  { href: "/profile/preferences", label: "Preferences", icon: Settings },
];

export function ProfileNav() {
  const pathname = usePathname();
  const currentItem = navItems.find((item) => item.href === pathname);

  return (
    <>
      {/* Desktop: Horizontal Tabs */}
      <nav
        className="hidden md:flex gap-1 border-b"
        aria-label="Profile navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors",
                "border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "border-primary text-primary bg-accent/50"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/30",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile: Dropdown Menu */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
              aria-label="Profile navigation menu"
            >
              <span className="flex items-center gap-2">
                {currentItem?.icon && (
                  <currentItem.icon className="h-4 w-4" aria-hidden="true" />
                )}
                {currentItem?.label || "Navigation"}
              </span>
              <ChevronDown className="h-4 w-4 ml-2" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer",
                      isActive && "bg-accent text-accent-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
