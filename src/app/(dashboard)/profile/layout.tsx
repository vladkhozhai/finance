/**
 * Profile Layout
 *
 * Layout for Profile section with vertical sidebar navigation.
 * Wraps all profile pages with consistent structure.
 */

import { ProfileSidebar } from "@/components/profile/profile-sidebar";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Vertical Sidebar */}
      <ProfileSidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 lg:p-10">{children}</main>
    </div>
  );
}
