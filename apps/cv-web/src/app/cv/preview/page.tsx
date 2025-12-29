"use client";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Palette,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  type CVData,
  type CVTemplate,
  getTemplates,
  getUserCVData,
} from "@/actions/cv-preview";
import {
  AcademicTemplate,
  CompactTemplate,
  CorporateTemplate,
  CreativeTemplate,
  type CVTemplateProps,
  DesignerTemplate,
  ElegantTemplate,
  ExecutiveTemplate,
  MinimalTemplate,
  ModernTemplate,
  ProfessionalTemplate,
  SimpleTemplate,
  TechnicalTemplate,
} from "@/components/cv-templates";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Map template slugs to components
const TEMPLATE_COMPONENTS: Record<
  string,
  React.ComponentType<CVTemplateProps>
> = {
  modern: ModernTemplate,
  professional: ProfessionalTemplate,
  creative: CreativeTemplate,
  minimal: MinimalTemplate,
  executive: ExecutiveTemplate,
  technical: TechnicalTemplate,
  simple: SimpleTemplate,
  compact: CompactTemplate,
  corporate: CorporateTemplate,
  academic: AcademicTemplate,
  elegant: ElegantTemplate,
  designer: DesignerTemplate,
};

function CVPreviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateParam = searchParams.get("template");

  const [cvData, setCvData] = useState<CVData | null>(null);
  const [templates, setTemplates] = useState<CVTemplate[]>([]);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(
    templateParam,
  );
  const [isLoading, setIsLoading] = useState(true);
  // isDownloading state removed - now using browser print dialog
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(0.7);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch CV data and templates on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [cvResult, templatesResult] = await Promise.all([
          getUserCVData(),
          getTemplates(),
        ]);

        if (cvResult.success) {
          setCvData(cvResult.data);
        } else {
          setError(cvResult.error);
        }

        if (templatesResult.success) {
          setTemplates(templatesResult.data);
          // If no template selected, use first one or saved preference
          if (!currentTemplateId && templatesResult.data.length > 0) {
            setCurrentTemplateId(templatesResult.data[0].id);
          }
        }
      } catch (_err) {
        setError("Failed to load CV data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [currentTemplateId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Use browser print dialog to save as PDF
    // This ensures the PDF matches exactly what's shown in the preview
    window.print();
  };

  const handleTemplateChange = (templateId: string) => {
    setCurrentTemplateId(templateId);
    router.replace(`/cv/preview?template=${templateId}`);
  };

  const navigateTemplate = (direction: "prev" | "next") => {
    const currentIndex = templates.findIndex((t) => t.id === currentTemplateId);
    if (currentIndex === -1) return;

    let newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;

    // Wrap around
    if (newIndex < 0) newIndex = templates.length - 1;
    if (newIndex >= templates.length) newIndex = 0;

    handleTemplateChange(templates[newIndex].id);
  };

  // Get current template component
  const currentTemplate = templates.find((t) => t.id === currentTemplateId);
  const templateSlug = currentTemplate?.template_slug || "modern";
  const TemplateComponent = TEMPLATE_COMPONENTS[templateSlug] || ModernTemplate;

  // Transform CVData to CVTemplateProps
  const templateProps: CVTemplateProps | null = cvData
    ? {
        profile: cvData.profile
          ? {
              first_name: cvData.profile.first_name || "",
              last_name: cvData.profile.last_name || "",
              middle_name: cvData.profile.middle_name,
              professional_title: cvData.profile.professional_title,
              email: "", // Will need to get from auth
              phone: cvData.profile.phone,
              address_city: cvData.profile.address_city,
              address_country: cvData.profile.address_country,
              professional_summary: cvData.profile.professional_summary,
              profile_photo_url: cvData.profile.profile_photo_url,
            }
          : null,
        socialLinks: cvData.socialLinks.map((link) => ({
          platform: link.platform,
          url: link.url,
        })),
        workExperiences: cvData.workExperiences.map((exp) => ({
          company_name: exp.company_name,
          job_title: exp.job_title,
          employment_type: exp.employment_type,
          location: exp.location,
          is_remote: exp.is_remote || false,
          start_date: exp.start_date,
          end_date: exp.end_date,
          is_current: exp.is_current || false,
          description: exp.description,
          achievements: exp.achievements || [],
        })),
        education: cvData.education.map((edu) => ({
          institution_name: edu.institution_name,
          degree: edu.degree,
          field_of_study: edu.field_of_study,
          start_date: edu.start_date,
          end_date: edu.end_date,
          is_current: edu.is_current || false,
          gpa: edu.gpa,
          description: edu.description,
        })),
        skills: cvData.skills.map((skill) => ({
          skill_name: skill.skill_name,
          proficiency_level: skill.proficiency_level,
          category: skill.category,
        })),
        projects: cvData.projects.map((proj) => ({
          project_name: proj.project_name,
          role: proj.role,
          start_date: proj.start_date,
          end_date: proj.end_date,
          is_ongoing: proj.is_ongoing || false,
          description: proj.description,
          technologies: proj.technologies || [],
          project_url: proj.project_url,
        })),
        certifications: cvData.certifications.map((cert) => ({
          certification_name: cert.certification_name,
          issuing_organization: cert.issuing_organization,
          issue_date: cert.issue_date,
          expiration_date: cert.expiration_date,
          credential_id: cert.credential_id,
          credential_url: cert.credential_url,
        })),
        languages: cvData.languages.map((lang) => ({
          language_name: lang.language_name,
          proficiency: lang.proficiency,
        })),
      }
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900">
        {/* Header Skeleton */}
        <header className="border-b bg-white dark:bg-zinc-950 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FileText className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">CVFlow</span>
              <span className="text-muted-foreground">|</span>
              <h1 className="font-semibold">CV Preview</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-48 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-10 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
          </div>
        </header>

        {/* Loading Content */}
        <main className="py-8 flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Loading your CV</h2>
            <p className="text-muted-foreground">
              Preparing your professional resume...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900 print:bg-white">
      {/* Header - Hidden on print */}
      <header className="border-b bg-white dark:bg-zinc-950 print:hidden sticky top-0 z-50">
        {/* Top Bar - Logo and Brand */}
        <div className="border-b md:border-b-0">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/dashboard" className="flex items-center gap-2">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <span className="font-bold text-lg sm:text-xl">CVFlow</span>
              </Link>
              <span className="text-muted-foreground hidden sm:inline">|</span>
              <h1 className="font-semibold text-sm sm:text-base hidden sm:block">
                CV Preview
              </h1>
            </div>

            {/* Mobile: Primary actions only */}
            <div className="flex items-center gap-2 md:hidden">
              <Link href="/cv/templates">
                <Button variant="outline" size="icon">
                  <Palette className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                onClick={handleDownloadPDF}
                disabled={!templateProps}
                size="sm"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>

            {/* Desktop: All actions */}
            <div className="hidden md:flex items-center gap-4">
              {/* Template Selector */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateTemplate("prev")}
                  disabled={templates.length <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Select
                  value={currentTemplateId || ""}
                  onValueChange={handleTemplateChange}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.template_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateTemplate("next")}
                  disabled={templates.length <= 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link href="/cv/templates">
                  <Button variant="outline">
                    <Palette className="mr-2 h-4 w-4" />
                    Templates
                  </Button>
                </Link>

                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>

                <Button
                  onClick={handleDownloadPDF}
                  disabled={!templateProps}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Template Selector & Actions */}
        <div className="border-b md:hidden">
          <div className="container mx-auto px-4 py-3">
            {/* Template Navigation */}
            <div className="flex items-center gap-2 mb-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateTemplate("prev")}
                disabled={templates.length <= 1}
                className="flex-shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Select
                value={currentTemplateId || ""}
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.template_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateTemplate("next")}
                disabled={templates.length <= 1}
                className="flex-shrink-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2">
              <Link href="/profile/personal" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex-1"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop: Zoom Controls & Edit Profile */}
        <div className="border-t bg-zinc-50 dark:bg-zinc-900 px-4 py-3 hidden md:block">
          <div className="container mx-auto flex items-center justify-between">
            <Link href="/profile/personal">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </Link>

            <div className="flex items-center gap-3 bg-white dark:bg-zinc-950 px-4 py-2 rounded-lg border">
              <span className="text-sm font-medium text-muted-foreground">
                Zoom
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                  disabled={scale <= 0.5}
                >
                  -
                </Button>
                <span className="text-sm font-medium w-16 text-center tabular-nums">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setScale(Math.min(1.5, scale + 0.1))}
                  disabled={scale >= 1.5}
                >
                  +
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setScale(0.7)}
                  disabled={scale === 0.7}
                  className="ml-2 text-xs"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="container mx-auto px-4 py-4 print:hidden">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* CV Preview Area */}
      <main className="py-4 md:py-8 print:py-0 px-2 md:px-4">
        <div
          className="mx-auto print:transform-none print:w-full w-full md:w-auto"
          style={{
            transform: isMobile ? "scale(1)" : `scale(${scale})`,
            transformOrigin: "top center",
            width: isMobile ? "100%" : "210mm",
            maxWidth: isMobile ? "100%" : undefined,
          }}
        >
          {/* CV Paper */}
          <div className="bg-white shadow-lg md:shadow-2xl print:shadow-none mx-auto overflow-hidden">
            {templateProps ? (
              <TemplateComponent {...templateProps} />
            ) : (
              <div className="p-6 md:p-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg md:text-xl font-semibold mb-2">
                  No profile data yet
                </h3>
                <p className="mb-4 text-sm md:text-base">
                  Start by adding your personal information to see your CV
                  preview.
                </p>
                <Link href="/profile/personal">
                  <Button size="sm" className="md:h-10">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go to Profile
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function CVPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CVPreviewContent />
    </Suspense>
  );
}
