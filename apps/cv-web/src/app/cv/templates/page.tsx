"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Loader2,
  ArrowLeft,
  Check,
  Eye,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getTemplates, setSelectedTemplate } from "@/actions/cv-preview";
import type { CVTemplate } from "@/actions/cv-preview";

// Template preview images/colors for visual distinction
const TEMPLATE_VISUALS: Record<string, { color: string; gradient: string }> = {
  modern: {
    color: "bg-blue-500",
    gradient: "from-blue-500 to-blue-600",
  },
  professional: {
    color: "bg-zinc-800",
    gradient: "from-zinc-700 to-zinc-900",
  },
  creative: {
    color: "bg-purple-500",
    gradient: "from-purple-500 to-pink-500",
  },
};

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<CVTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch templates on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getTemplates();
        if (result.success) {
          setTemplates(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError("Failed to load templates");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleSelectTemplate = async (templateId: string) => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await setSelectedTemplate(templateId);
      if (result.success) {
        setSelectedId(templateId);
        // Navigate to preview with the selected template
        router.push(`/cv/preview?template=${templateId}`);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to select template");
    } finally {
      setIsSaving(false);
    }
  };

  const getTemplateSlug = (template: CVTemplate) => {
    // Extract slug from template name (lowercase, replace spaces with dashes)
    const name = template.template_name.toLowerCase();
    return TEMPLATE_VISUALS[name] ? name : "modern";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-zinc-950">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">CVFlow</span>
            </Link>
            <span className="text-muted-foreground">|</span>
            <h1 className="font-semibold text-lg flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Choose Template
            </h1>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Select Your CV Template</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose a professional template that best represents your style.
            You can preview your CV with any template before downloading.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 max-w-2xl mx-auto">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {templates.map((template) => {
            const slug = getTemplateSlug(template);
            const visual = TEMPLATE_VISUALS[slug] || TEMPLATE_VISUALS.modern;
            const isSelected = selectedId === template.id;

            return (
              <Card
                key={template.id}
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  isSelected ? "ring-2 ring-primary" : ""
                }`}
              >
                {/* Template Preview Header */}
                <div
                  className={`h-40 bg-gradient-to-br ${visual.gradient} relative`}
                >
                  {/* Mock CV Preview */}
                  <div className="absolute inset-4 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex gap-2">
                      {/* Sidebar mock */}
                      {slug === "modern" && (
                        <div className="w-1/3 space-y-2">
                          <div className="h-8 w-8 rounded-full bg-white/30" />
                          <div className="h-2 w-full bg-white/20 rounded" />
                          <div className="h-2 w-3/4 bg-white/20 rounded" />
                        </div>
                      )}
                      {/* Main content mock */}
                      <div className={`${slug === "modern" ? "w-2/3" : "w-full"} space-y-2`}>
                        <div className="h-3 w-3/4 bg-white/30 rounded" />
                        <div className="h-2 w-1/2 bg-white/20 rounded" />
                        <div className="mt-3 space-y-1">
                          <div className="h-2 w-full bg-white/15 rounded" />
                          <div className="h-2 w-full bg-white/15 rounded" />
                          <div className="h-2 w-2/3 bg-white/15 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-500 text-white">
                        <Check className="h-3 w-3 mr-1" />
                        Selected
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {template.template_name}
                  </CardTitle>
                  <CardDescription>
                    {template.description || "A professional CV template"}
                  </CardDescription>
                </CardHeader>

                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      router.push(`/cv/preview?template=${template.id}`)
                    }
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleSelectTemplate(template.id)}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Use Template
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {templates.length === 0 && !error && (
          <div className="text-center py-12">
            <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No templates available yet</p>
          </div>
        )}
      </main>
    </div>
  );
}
