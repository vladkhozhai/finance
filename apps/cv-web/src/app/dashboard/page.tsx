import { FileText, Plus, Download, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function handleSignOut() {
  "use server";
  const { signOut } = await import("@/actions/auth");
  await signOut();
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const firstName = user?.user_metadata?.first_name || "there";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-zinc-950">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">CVFlow</span>
          </div>
          <form action={handleSignOut}>
            <Button variant="outline" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {firstName}!</h1>
          <p className="text-muted-foreground">
            Create and manage your professional CVs
          </p>
        </div>

        {/* Empty state */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-6">
                <FileText className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Get Started with Your CV</CardTitle>
            <CardDescription className="text-base">
              Complete your profile to generate your first professional CV. Add
              your work experience, education, and skills to create a stunning
              resume.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Link href="/profile/personal" className="w-full max-w-xs">
              <Button size="lg" className="w-full">
                <Plus className="mr-2 h-5 w-5" />
                Start Building Your CV
              </Button>
            </Link>

            <div className="flex gap-4 mt-4">
              <Button variant="outline" size="sm" disabled>
                <Eye className="mr-2 h-4 w-4" />
                Preview CV
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              Preview and download options will be available once you complete
              your profile.
            </p>
          </CardContent>
        </Card>

        {/* Progress section - placeholder */}
        <div className="mt-8 max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold mb-4">Profile Completion</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>0% Complete</span>
              <span className="text-muted-foreground">0 of 6 sections</span>
            </div>
            <div className="h-2 bg-muted rounded-full">
              <div
                className="h-2 bg-primary rounded-full transition-all"
                style={{ width: "0%" }}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {[
              { name: "Personal Information", href: "/profile/personal" },
              { name: "Work Experience", href: "/profile/experience" },
              { name: "Education", href: "#" },
              { name: "Skills", href: "#" },
              { name: "Projects", href: "#" },
              { name: "Certifications", href: "#" },
            ].map((section) => (
              <Link
                key={section.name}
                href={section.href}
                className={`flex items-center justify-between p-3 rounded-lg border bg-white dark:bg-zinc-950 ${
                  section.href !== "#"
                    ? "hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                    : "cursor-not-allowed opacity-60"
                }`}
              >
                <span className="text-sm">{section.name}</span>
                <span className="text-xs text-muted-foreground">Not started</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
