"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  GraduationCap,
  MapPin,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { educationSchema, type EducationInput } from "@/lib/validations/profile";
import type { Education } from "@/actions/education";

export default function EducationPage() {
  const [educations, setEducations] = useState<Education[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCurrent, setIsCurrent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      institution_name: "",
      degree: "",
      field_of_study: "",
      start_date: "",
      is_current: false,
    },
  });

  // Fetch educations
  useEffect(() => {
    async function fetchEducations() {
      try {
        const response = await fetch("/api/education");
        if (response.ok) {
          const data = await response.json();
          setEducations(data.educations || []);
        }
      } catch (err) {
        console.error("Failed to fetch educations:", err);
      } finally {
        setIsFetching(false);
      }
    }

    fetchEducations();
  }, []);

  const openDialog = (education?: Education) => {
    if (education) {
      setEditingId(education.id);
      Object.keys(education).forEach((key) => {
        setValue(
          key as keyof EducationInput,
          education[key as keyof EducationInput]
        );
      });
      setIsCurrent(education.is_current === true);
    } else {
      setEditingId(null);
      reset({
        is_current: false,
      });
      setIsCurrent(false);
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    reset();
    setIsCurrent(false);
  };

  const onSubmit = async (data: EducationInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        ...data,
        is_current: isCurrent,
        end_date: isCurrent ? null : data.end_date,
      };

      if (editingId) {
        const { updateEducation, getEducation } = await import(
          "@/actions/education"
        );
        const result = await updateEducation(editingId, payload);
        if (result.success) {
          // Refresh the list after update
          const listResult = await getEducation();
          if (listResult.success) {
            setEducations(listResult.data);
          }
          closeDialog();
        } else {
          setError(result.error || "Failed to update education");
        }
      } else {
        const { createEducation, getEducation } = await import(
          "@/actions/education"
        );
        const result = await createEducation(payload);
        if (result.success) {
          // Refresh the list after creation
          const listResult = await getEducation();
          if (listResult.success) {
            setEducations(listResult.data);
          }
          closeDialog();
        } else {
          setError(result.error || "Failed to create education");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this education?")) {
      return;
    }

    try {
      const { deleteEducation } = await import("@/actions/education");
      const result = await deleteEducation(id);
      if (result.success) {
        setEducations(educations.filter((edu) => edu.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete education:", err);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
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
              <CardTitle>Education</CardTitle>
              <CardDescription>
                Add your educational background and academic achievements
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Education
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {educations.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No education added yet
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => openDialog()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Education
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {educations.map((edu) => (
                <div
                  key={edu.id}
                  className="border rounded-lg p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{edu.degree}</h3>
                      <p className="text-muted-foreground">
                        {edu.institution_name}
                      </p>
                      {edu.field_of_study && (
                        <p className="text-sm text-muted-foreground">
                          {edu.field_of_study}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(edu.start_date)} -{" "}
                          {edu.is_current === true
                            ? "Present"
                            : formatDate(edu.end_date)}
                        </span>
                        {edu.gpa && (
                          <span>GPA: {edu.gpa}</span>
                        )}
                      </div>
                      {edu.description && (
                        <p className="mt-3 text-sm">{edu.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openDialog(edu)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(edu.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Education Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Education" : "Add Education"}
            </DialogTitle>
            <DialogDescription>
              Provide details about your educational background
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="institution_name">
                Institution Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="institution_name"
                placeholder="University of Example"
                {...register("institution_name")}
                disabled={isLoading}
              />
              {errors.institution_name && (
                <p className="text-sm text-destructive">
                  {errors.institution_name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="degree">
                  Degree <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="degree"
                  placeholder="Bachelor of Science"
                  {...register("degree")}
                  disabled={isLoading}
                />
                {errors.degree && (
                  <p className="text-sm text-destructive">
                    {errors.degree.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="field_of_study">Field of Study</Label>
                <Input
                  id="field_of_study"
                  placeholder="Computer Science"
                  {...register("field_of_study")}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register("start_date")}
                  disabled={isLoading}
                />
                {errors.start_date && (
                  <p className="text-sm text-destructive">
                    {errors.start_date.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  {...register("end_date")}
                  disabled={isLoading || isCurrent}
                />
                {errors.end_date && (
                  <p className="text-sm text-destructive">
                    {errors.end_date.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_current"
                checked={isCurrent}
                onCheckedChange={(checked) => {
                  setIsCurrent(checked as boolean);
                  setValue("is_current", checked as boolean);
                  if (checked) {
                    setValue("end_date", null);
                  }
                }}
              />
              <Label htmlFor="is_current" className="cursor-pointer">
                I currently study here
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gpa">GPA / Grade</Label>
              <Input
                id="gpa"
                placeholder="3.8 / 4.0"
                {...register("gpa")}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="Describe your studies, projects, or achievements..."
                {...register("description")}
                disabled={isLoading}
              />
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
                  "Add Education"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
