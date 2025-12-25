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
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function handleSignOut() {
  "use server";
  const { signOut } = await import("@/actions/auth");
  await signOut();
}

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

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-zinc-950">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">CVFlow</span>
            </Link>
            <span className="text-muted-foreground text-sm">|</span>
            <h1 className="font-semibold text-lg">Edit Profile</h1>
          </div>
          <form action={handleSignOut}>
            <Button variant="outline" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <aside className="md:col-span-1">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User Info Card */}
            <div className="mt-6 p-4 rounded-lg border bg-white dark:bg-zinc-950">
              <div className="text-sm">
                <p className="font-medium">
                  {user?.user_metadata?.first_name || "User"}
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  {user?.email}
                </p>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="md:col-span-3">{children}</main>
        </div>
      </div>
    </div>
  );
}
