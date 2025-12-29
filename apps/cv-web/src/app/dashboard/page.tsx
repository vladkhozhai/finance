import { FileText, Plus, Download, Eye, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

export const dynamic = "force-dynamic";

// Calculate profile completeness
async function getProfileCompleteness() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { percentage: 0, completedSections: 0, totalSections: 8 };

  const sections = [
    { name: "Personal Information", table: "cv_profiles", check: async () => {
      const { data } = await supabase.from("cv_profiles").select("first_name, last_name").eq("id", user.id).single();
      return !!(data?.first_name && data?.last_name);
    }},
    { name: "Social Links", table: "cv_social_links", check: async () => {
      const { count } = await supabase.from("cv_social_links").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      return (count || 0) > 0;
    }},
    { name: "Work Experience", table: "cv_work_experiences", check: async () => {
      const { count } = await supabase.from("cv_work_experiences").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      return (count || 0) > 0;
    }},
    { name: "Education", table: "cv_education", check: async () => {
      const { count } = await supabase.from("cv_education").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      return (count || 0) > 0;
    }},
    { name: "Skills", table: "cv_skills", check: async () => {
      const { count } = await supabase.from("cv_skills").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      return (count || 0) > 0;
    }},
    { name: "Projects", table: "cv_projects", check: async () => {
      const { count } = await supabase.from("cv_projects").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      return (count || 0) > 0;
    }},
    { name: "Certifications", table: "cv_certifications", check: async () => {
      const { count } = await supabase.from("cv_certifications").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      return (count || 0) > 0;
    }},
    { name: "Languages", table: "cv_languages", check: async () => {
      const { count } = await supabase.from("cv_languages").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      return (count || 0) > 0;
    }},
  ];

  const results = await Promise.all(sections.map(s => s.check()));
  const completedSections = results.filter(Boolean).length;
  const percentage = Math.round((completedSections / sections.length) * 100);

  return { percentage, completedSections, totalSections: sections.length, sections: sections.map((s, i) => ({ ...s, completed: results[i] })) };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to sign-in if not authenticated
  if (!user) {
    redirect("/sign-in?next=/dashboard");
  }

  const firstName = user?.user_metadata?.first_name || "there";
  const profileData = await getProfileCompleteness();

  const sectionLinks = [
    { name: "Personal Information", href: "/profile/personal", icon: "👤" },
    { name: "Social Links", href: "/profile/social", icon: "🔗" },
    { name: "Work Experience", href: "/profile/experience", icon: "💼" },
    { name: "Education", href: "/profile/education", icon: "🎓" },
    { name: "Skills", href: "/profile/skills", icon: "💡" },
    { name: "Projects", href: "/profile/projects", icon: "📁" },
    { name: "Certifications", href: "/profile/certifications", icon: "🏆" },
    { name: "Languages", href: "/profile/languages", icon: "🌍" },
  ];

  const canPreview = profileData.percentage >= 25;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-zinc-950 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">CVFlow</span>
          </div>
          <SignOutButton />
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {firstName}!</h1>
          <p className="text-muted-foreground text-lg">
            Create and manage your professional CVs
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Get started with creating your professional CV
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Link href="/profile/personal">
                  <Button size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    Build Your Profile
                  </Button>
                </Link>
                <Link href={canPreview ? "/cv/preview" : "#"}>
                  <Button variant="outline" size="lg" disabled={!canPreview}>
                    <Eye className="mr-2 h-5 w-5" />
                    Preview CV
                  </Button>
                </Link>
                <Link href="/cv/templates">
                  <Button variant="outline" size="lg">
                    <FileText className="mr-2 h-5 w-5" />
                    Browse Templates
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Profile Sections */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Sections</CardTitle>
                <CardDescription>
                  Complete these sections to build your CV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sectionLinks.map((section, index) => {
                    const isCompleted = profileData.sections?.[index]?.completed || false;
                    return (
                      <Link
                        key={section.name}
                        href={section.href}
                        className="group"
                      >
                        <div className="flex items-center gap-3 p-4 rounded-lg border bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:border-primary/50 transition-all duration-200 cursor-pointer">
                          <span className="text-2xl">{section.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                              {section.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {isCompleted ? "Completed" : "Not started"}
                            </p>
                          </div>
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Completion Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Completion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{profileData.percentage}% Complete</span>
                    <span className="text-muted-foreground">
                      {profileData.completedSections} of {profileData.totalSections} sections
                    </span>
                  </div>
                  <Progress value={profileData.percentage} className="h-3" />
                </div>

                {profileData.percentage < 100 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      {profileData.percentage === 0
                        ? "Start by adding your personal information!"
                        : profileData.percentage < 50
                          ? "Keep going! Complete more sections to unlock CV preview."
                          : "Almost there! Complete all sections for the best CV."}
                    </p>
                  </div>
                )}

                {profileData.percentage === 100 && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                    <p className="text-sm text-green-900 dark:text-green-100 font-medium">
                      🎉 Profile complete! Ready to preview and download.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pro Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <div className="mt-0.5">💡</div>
                  <p className="text-sm text-muted-foreground">
                    Use action verbs to describe your achievements
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="mt-0.5">📊</div>
                  <p className="text-sm text-muted-foreground">
                    Quantify your results with numbers and metrics
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="mt-0.5">🎯</div>
                  <p className="text-sm text-muted-foreground">
                    Tailor your CV for each role you apply to
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
