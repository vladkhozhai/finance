"use client";

import { useState } from "react";
import {
  FileText,
  User,
  Link as LinkIcon,
  Briefcase,
  GraduationCap,
  Lightbulb,
  FolderGit2,
  Award,
  Languages,
  ArrowLeft,
  Menu,
  X,
  Eye,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/profile/personal",
    label: "Personal Info",
    icon: User,
  },
  {
    href: "/profile/social",
    label: "Social Links",
    icon: LinkIcon,
  },
  {
    href: "/profile/experience",
    label: "Work Experience",
    icon: Briefcase,
  },
  {
    href: "/profile/education",
    label: "Education",
    icon: GraduationCap,
  },
  {
    href: "/profile/skills",
    label: "Skills",
    icon: Lightbulb,
  },
  {
    href: "/profile/projects",
    label: "Projects",
    icon: FolderGit2,
  },
  {
    href: "/profile/certifications",
    label: "Certifications",
    icon: Award,
  },
  {
    href: "/profile/languages",
    label: "Languages",
    icon: Languages,
  },
];

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const currentSection = navItems.find((item) => pathname === item.href);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-zinc-950 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <FileText className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">CVFlow</span>
            </Link>
            <span className="text-muted-foreground text-sm hidden sm:inline">
              |
            </span>
            <h1 className="font-semibold text-lg hidden sm:inline">
              Edit Profile
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/cv/preview" className="hidden sm:inline-flex">
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                Preview CV
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t bg-white dark:bg-zinc-950 animate-in slide-in-from-top-2 duration-200">
            <nav className="container mx-auto px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </div>
                    {isActive && <ChevronRight className="h-4 w-4" />}
                  </Link>
                );
              })}
              <div className="pt-2 border-t mt-2">
                <Link
                  href="/cv/preview"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                >
                  <Eye className="h-5 w-5" />
                  Preview CV
                </Link>
              </div>
            </nav>
          </div>
        )}

        {/* Mobile Current Section Indicator */}
        {currentSection && !isMobileMenuOpen && (
          <div className="lg:hidden border-t bg-zinc-50 dark:bg-zinc-900 px-4 py-2">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <currentSection.icon className="h-4 w-4" />
              {currentSection.label}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </header>

      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation - Desktop */}
          <aside className="hidden lg:block lg:col-span-1">
            <nav className="space-y-1 sticky top-24">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        isActive && "animate-in fade-in-50"
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}

              {/* Preview CV Button */}
              <div className="pt-4 mt-4 border-t">
                <Link href="/cv/preview">
                  <Button className="w-full" variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview CV
                  </Button>
                </Link>
              </div>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3">{children}</main>
        </div>
      </div>
    </div>
  );
}
