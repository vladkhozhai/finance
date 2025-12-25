"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Pencil, Trash2, Languages as LanguagesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  languageSchema,
  type LanguageInput,
  LANGUAGE_PROFICIENCIES,
} from "@/lib/validations/profile";
import type { Language } from "@/actions/languages";

export default function LanguagesPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<LanguageInput>({
    resolver: zodResolver(languageSchema),
  });

  // Fetch languages
  useEffect(() => {
    async function fetchLanguages() {
      try {
        const response = await fetch("/api/languages");
        if (response.ok) {
          const data = await response.json();
          setLanguages(data.languages || []);
        }
      } catch (err) {
        console.error("Failed to fetch languages:", err);
      } finally {
        setIsFetching(false);
      }
    }

    fetchLanguages();
  }, []);

  const openDialog = (language?: Language) => {
    if (language) {
      setEditingId(language.id);
      Object.keys(language).forEach((key) => {
        setValue(key as keyof LanguageInput, language[key as keyof LanguageInput]);
      });
    } else {
      setEditingId(null);
      reset();
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = async (data: LanguageInput) => {
    setIsLoading(true);
    setError(null);

    try {
      if (editingId) {
        const { updateLanguage, getLanguages } = await import(
          "@/actions/languages"
        );
        const result = await updateLanguage(editingId, data);
        if (result.success) {
          // Refresh the list after update
          const listResult = await getLanguages();
          if (listResult.success) {
            setLanguages(listResult.data);
          }
          closeDialog();
        } else {
          setError(result.error || "Failed to update language");
        }
      } else {
        const { createLanguage, getLanguages } = await import(
          "@/actions/languages"
        );
        const result = await createLanguage(data);
        if (result.success) {
          // Refresh the list after creation
          const listResult = await getLanguages();
          if (listResult.success) {
            setLanguages(listResult.data);
          }
          closeDialog();
        } else {
          setError(result.error || "Failed to create language");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this language?")) {
      return;
    }

    try {
      const { deleteLanguage } = await import("@/actions/languages");
      const result = await deleteLanguage(id);
      if (result.success) {
        setLanguages(languages.filter((lang) => lang.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete language:", err);
    }
  };

  const getProficiencyBadgeColor = (level: string) => {
    switch (level) {
      case "Native":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Fluent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Conversational":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Basic":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  if (isFetching) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Languages</CardTitle>
              <CardDescription>
                Add languages you speak and your proficiency level
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Language
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {languages.length === 0 ? (
            <div className="text-center py-12">
              <LanguagesIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No languages added yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => openDialog()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Language
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {languages.map((lang) => (
                <div
                  key={lang.id}
                  className="border rounded-lg p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">
                        {lang.language_name}
                      </h3>
                      <Badge
                        variant="secondary"
                        className={getProficiencyBadgeColor(
                          lang.proficiency
                        )}
                      >
                        {
                          LANGUAGE_PROFICIENCIES.find(
                            (p) => p.value === lang.proficiency
                          )?.label
                        }
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDialog(lang)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(lang.id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Language Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Language" : "Add Language"}
            </DialogTitle>
            <DialogDescription>
              Add a language and your proficiency level
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="language_name">
                Language <span className="text-destructive">*</span>
              </Label>
              <Input
                id="language_name"
                placeholder="English, Spanish, French..."
                {...register("language_name")}
                disabled={isLoading}
              />
              {errors.language_name && (
                <p className="text-sm text-destructive">
                  {errors.language_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="proficiency">
                Proficiency Level <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={(value) =>
                  setValue("proficiency", value as any)
                }
                defaultValue={watch("proficiency") || undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select proficiency level" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_PROFICIENCIES.map((prof) => (
                    <SelectItem key={prof.value} value={prof.value}>
                      {prof.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.proficiency && (
                <p className="text-sm text-destructive">
                  {errors.proficiency.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingId ? (
                  "Update"
                ) : (
                  "Add Language"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
