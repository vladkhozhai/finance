"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Pencil, Trash2, Lightbulb } from "lucide-react";
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
  skillSchema,
  type SkillInput,
  PROFICIENCY_LEVELS,
  SKILL_CATEGORIES,
} from "@/lib/validations/profile";
import type { Skill } from "@/actions/skills";

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
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
  } = useForm<SkillInput>({
    resolver: zodResolver(skillSchema),
  });

  // Fetch skills using Server Action
  useEffect(() => {
    async function fetchSkills() {
      try {
        const { getSkills } = await import("@/actions/skills");
        const result = await getSkills();
        if (result.success) {
          setSkills(result.data);
        } else {
          console.error("Failed to fetch skills:", result.error);
        }
      } catch (err) {
        console.error("Failed to fetch skills:", err);
      } finally {
        setIsFetching(false);
      }
    }

    fetchSkills();
  }, []);

  const openDialog = (skill?: Skill) => {
    if (skill) {
      setEditingId(skill.id);
      Object.keys(skill).forEach((key) => {
        setValue(key as keyof SkillInput, skill[key as keyof SkillInput]);
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

  const onSubmit = async (data: SkillInput) => {
    setIsLoading(true);
    setError(null);

    try {
      if (editingId) {
        const { updateSkill, getSkills } = await import("@/actions/skills");
        const result = await updateSkill(editingId, data);
        if (result.success) {
          // Refresh the list after update
          const listResult = await getSkills();
          if (listResult.success) {
            setSkills(listResult.data);
          }
          closeDialog();
        } else {
          setError(result.error || "Failed to update skill");
        }
      } else {
        const { createSkill, getSkills } = await import("@/actions/skills");
        const result = await createSkill(data);
        if (result.success) {
          // Refresh the list after creation
          const listResult = await getSkills();
          if (listResult.success) {
            setSkills(listResult.data);
          }
          closeDialog();
        } else {
          setError(result.error || "Failed to create skill");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this skill?")) {
      return;
    }

    try {
      const { deleteSkill } = await import("@/actions/skills");
      const result = await deleteSkill(id);
      if (result.success) {
        setSkills(skills.filter((skill) => skill.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete skill:", err);
    }
  };

  const getProficiencyBadgeColor = (level: string | null | undefined) => {
    switch (level) {
      case "expert":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "advanced":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "beginner":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const groupedSkills = skills.reduce(
    (acc, skill) => {
      const category = skill.category || "other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(skill);
      return acc;
    },
    {} as Record<string, Skill[]>
  );

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
              <CardTitle>Skills</CardTitle>
              <CardDescription>
                Add your technical and professional skills
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Skill
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {skills.length === 0 ? (
            <div className="text-center py-12">
              <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No skills added yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => openDialog()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Skill
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSkills).map(([category, categorySkills]) => {
                const categoryLabel =
                  SKILL_CATEGORIES.find((c) => c.value === category)?.label ||
                  category;
                return (
                  <div key={category}>
                    <h3 className="font-semibold text-lg mb-3">
                      {categoryLabel}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categorySkills.map((skill) => (
                        <div
                          key={skill.id}
                          className="border rounded-lg p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{skill.skill_name}</span>
                                {skill.proficiency_level && (
                                  <Badge
                                    variant="secondary"
                                    className={getProficiencyBadgeColor(
                                      skill.proficiency_level
                                    )}
                                  >
                                    {
                                      PROFICIENCY_LEVELS.find(
                                        (l) => l.value === skill.proficiency_level
                                      )?.label
                                    }
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDialog(skill)}
                                className="h-8 w-8"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(skill.id)}
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skill Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Skill" : "Add Skill"}</DialogTitle>
            <DialogDescription>
              Add a skill with proficiency level and category
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="skill_name">
                Skill Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="skill_name"
                placeholder="React, TypeScript, Leadership..."
                {...register("skill_name")}
                disabled={isLoading}
              />
              {errors.skill_name && (
                <p className="text-sm text-destructive">{errors.skill_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="proficiency_level">Proficiency Level</Label>
              <Select
                onValueChange={(value) =>
                  setValue("proficiency_level", value as any)
                }
                defaultValue={watch("proficiency_level") || undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select proficiency level" />
                </SelectTrigger>
                <SelectContent>
                  {PROFICIENCY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                onValueChange={(value) => setValue("category", value)}
                defaultValue={watch("category") || undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  "Add Skill"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
