"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Briefcase,
  MapPin,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  workExperienceSchema,
  type WorkExperienceInput,
  EMPLOYMENT_TYPES,
} from "@/lib/validations/profile";
import type { WorkExperience } from "@/actions/work-experience";

export default function WorkExperiencePage() {
  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCurrentJob, setIsCurrentJob] = useState(false);
  const [achievements, setAchievements] = useState<string[]>([""]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(workExperienceSchema),
    defaultValues: {
      is_remote: false,
      is_current: false,
      achievements: [],
    },
  });

  const isRemote = watch("is_remote");

  // Fetch work experiences
  useEffect(() => {
    async function fetchExperiences() {
      try {
        const response = await fetch("/api/work-experience");
        if (response.ok) {
          const data = await response.json();
          setExperiences(data.experiences || []);
        }
      } catch (err) {
        console.error("Failed to fetch work experiences:", err);
      } finally {
        setIsFetching(false);
      }
    }

    fetchExperiences();
  }, []);

  const openDialog = (experience?: WorkExperience) => {
    if (experience) {
      setEditingId(experience.id);
      Object.keys(experience).forEach((key) => {
        setValue(key as keyof WorkExperienceInput, experience[key as keyof WorkExperienceInput]);
      });
      setIsCurrentJob(experience.is_current === true);
      setAchievements(
        experience.achievements && experience.achievements.length > 0 ? experience.achievements : [""]
      );
    } else {
      setEditingId(null);
      reset({
        is_remote: false,
        is_current: false,
        achievements: [],
      });
      setIsCurrentJob(false);
      setAchievements([""]);
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    reset();
    setIsCurrentJob(false);
    setAchievements([""]);
  };

  const onSubmit = async (data: WorkExperienceInput) => {
    setIsLoading(true);
    setError(null);

    try {
      // Filter out empty achievements
      const filteredAchievements = achievements.filter((a) => a.trim() !== "");
      const payload = {
        ...data,
        achievements: filteredAchievements,
        is_current: isCurrentJob,
        end_date: isCurrentJob ? null : data.end_date,
      };

      if (editingId) {
        const { updateWorkExperience, getWorkExperiences } = await import(
          "@/actions/work-experience"
        );
        const result = await updateWorkExperience(editingId, payload);
        if (result.success) {
          // Refresh the list after update
          const listResult = await getWorkExperiences();
          if (listResult.success) {
            setExperiences(listResult.data);
          }
          closeDialog();
        } else {
          setError(result.error || "Failed to update work experience");
        }
      } else {
        const { createWorkExperience, getWorkExperiences } = await import(
          "@/actions/work-experience"
        );
        const result = await createWorkExperience(payload);
        if (result.success) {
          // Refresh the list after creation
          const listResult = await getWorkExperiences();
          if (listResult.success) {
            setExperiences(listResult.data);
          }
          closeDialog();
        } else {
          setError(result.error || "Failed to create work experience");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this work experience?")) {
      return;
    }

    try {
      const { deleteWorkExperience } = await import(
        "@/actions/work-experience"
      );
      const result = await deleteWorkExperience(id);
      if (result.success) {
        setExperiences(experiences.filter((exp) => exp.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete work experience:", err);
    }
  };

  const addAchievement = () => {
    setAchievements([...achievements, ""]);
  };

  const removeAchievement = (index: number) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const updateAchievement = (index: number, value: string) => {
    const updated = [...achievements];
    updated[index] = value;
    setAchievements(updated);
  };

  const formatDate = (dateStr: string | null) => {
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
              <CardTitle>Work Experience</CardTitle>
              <CardDescription>
                Add your professional work history and achievements
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Experience
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {experiences.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No work experience added yet
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => openDialog()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Experience
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div
                  key={exp.id}
                  className="border rounded-lg p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{exp.job_title}</h3>
                      <p className="text-muted-foreground">{exp.company_name}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                        {exp.employment_type && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {
                              EMPLOYMENT_TYPES.find(
                                (t) => t.value === exp.employment_type
                              )?.label
                            }
                          </span>
                        )}
                        {exp.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {exp.location}
                            {exp.is_remote === true && " (Remote)"}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(exp.start_date)} -{" "}
                          {exp.is_current === true ? "Present" : formatDate(exp.end_date)}
                        </span>
                      </div>
                      {exp.description && (
                        <p className="mt-3 text-sm">{exp.description}</p>
                      )}
                      {exp.achievements && exp.achievements.length > 0 && (
                        <ul className="mt-3 list-disc list-inside text-sm space-y-1">
                          {exp.achievements.map((achievement, idx) => (
                            <li key={idx}>{achievement}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openDialog(exp)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(exp.id)}
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

      {/* Work Experience Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Work Experience" : "Add Work Experience"}
            </DialogTitle>
            <DialogDescription>
              Provide details about your work experience, responsibilities, and
              achievements
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job_title">
                  Job Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="job_title"
                  placeholder="Senior Software Engineer"
                  {...register("job_title")}
                  disabled={isLoading}
                />
                {errors.job_title && (
                  <p className="text-sm text-destructive">
                    {errors.job_title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name">
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="company_name"
                  placeholder="Acme Inc."
                  {...register("company_name")}
                  disabled={isLoading}
                />
                {errors.company_name && (
                  <p className="text-sm text-destructive">
                    {errors.company_name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employment_type">Employment Type</Label>
              <Select
                onValueChange={(value) => setValue("employment_type", value as any)}
                defaultValue={watch("employment_type") || undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="San Francisco, CA"
                  {...register("location")}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="is_remote"
                  checked={isRemote}
                  onCheckedChange={(checked) =>
                    setValue("is_remote", checked as boolean)
                  }
                />
                <Label htmlFor="is_remote" className="cursor-pointer">
                  Remote position
                </Label>
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
                  disabled={isLoading || isCurrentJob}
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
                checked={isCurrentJob}
                onCheckedChange={(checked) => {
                  setIsCurrentJob(checked as boolean);
                  setValue("is_current", checked as boolean);
                  if (checked) {
                    setValue("end_date", null);
                  }
                }}
              />
              <Label htmlFor="is_current" className="cursor-pointer">
                I currently work here
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="Describe your role and responsibilities..."
                {...register("description")}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>Achievements</Label>
              <div className="space-y-2">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={achievement}
                      onChange={(e) => updateAchievement(index, e.target.value)}
                      placeholder="e.g., Increased sales by 25%"
                      disabled={isLoading}
                    />
                    {achievements.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeAchievement(index)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAchievement}
                  disabled={isLoading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Achievement
                </Button>
              </div>
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
                  "Add Experience"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
