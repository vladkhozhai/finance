/**
 * Dashboard Layout
 *
 * Protected layout for authenticated users.
 * Includes sticky header (desktop) and bottom navigation (mobile).
 * Applies to all pages in the (dashboard) route group.
 */

// Force dynamic rendering - layout uses cookies() for auth
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { MainNav } from "@/components/layout/main-nav";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background max-w-full overflow-x-hidden">
      {/* Desktop Header - Hidden on mobile, shown on md+ */}
      <div className="hidden md:block">
        <AppHeader
          userEmail={user.email || ""}
          userName={user.user_metadata?.name}
        />
      </div>

      {/* Main Content - Extra padding on mobile for bottom nav */}
      <main className="pb-20 md:pb-0 max-w-full">{children}</main>

      {/* Mobile Bottom Navigation - Only the mobile nav variant */}
      <MainNav />
    </div>
  );
}
