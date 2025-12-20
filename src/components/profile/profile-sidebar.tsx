/**
 * Profile Sidebar Component
 *
 * Vertical navigation sidebar for Profile section.
 * Shows 5 navigation items with icons and active state highlighting.
 * On mobile, renders as a Sheet/Drawer.
 */

"use client";

import {
  CreditCard,
  FolderOpen,
  Menu,
  Settings,
  Tag,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Overview",
    href: "/profile/overview",
    icon: User,
  },
  {
    label: "Payment Methods",
    href: "/profile/payment-methods",
    icon: CreditCard,
  },
  {
    label: "Categories",
    href: "/profile/categories",
    icon: FolderOpen,
  },
  {
    label: "Tags",
    href: "/profile/tags",
    icon: Tag,
  },
  {
    label: "Preferences",
    href: "/profile/preferences",
    icon: Settings,
  },
];

interface ProfileSidebarProps {
  className?: string;
}

function SidebarContent() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              isActive
                ? "bg-accent text-accent-foreground border-l-4 border-primary"
                : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function ProfileSidebar({ className }: ProfileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile: Sheet/Drawer */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <SheetHeader>
              <SheetTitle>Profile & Settings</SheetTitle>
            </SheetHeader>
            <Separator className="my-4" />
            <div onClick={() => setIsOpen(false)}>
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Fixed Sidebar */}
      <aside
        className={cn("hidden md:block w-64 border-r bg-background", className)}
      >
        <div className="sticky top-0 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Profile & Settings
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your account
            </p>
          </div>
          <Separator />
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}
