/**
 * Profile Layout
 *
 * Layout for Profile section with horizontal header navigation.
 * Wraps all profile pages with consistent structure.
 * Navigation moved to header for better space utilization.
 */

import { ProfileNav } from "@/components/profile/profile-nav";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        </div>
        <ProfileNav />
      </div>

      {/* Main Content - Full Width */}
      <main className="w-full">{children}</main>
    </div>
  );
}
