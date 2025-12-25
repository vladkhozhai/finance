"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  FolderGit2,
  Calendar,
  ExternalLink,
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
import { Badge } from "@/components/ui/badge";
import {
  projectSchema,
  type ProjectInput,
} from "@/lib/validations/profile";
import type { Project } from "@/actions/projects";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isOngoing, setIsOngoing] = useState(false);
  const [technologies, setTechnologies] = useState<string[]>([""]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      is_ongoing: false,
      technologies: [],
    },
  });

  // Fetch projects
  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch("/api/projects");
        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects || []);
        }
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      } finally {
        setIsFetching(false);
      }
    }

    fetchProjects();
  }, []);

  const openDialog = (project?: Project) => {
    if (project) {
      setEditingId(project.id);
      Object.keys(project).forEach((key) => {
        setValue(key as keyof ProjectInput, project[key as keyof ProjectInput]);
      });
      setIsOngoing(project.is_ongoing === true);
      setTechnologies(
        project.technologies && project.technologies.length > 0
          ? project.technologies
          : [""]
      );
    } else {
      setEditingId(null);
      reset({
        is_ongoing: false,
        technologies: [],
      });
      setIsOngoing(false);
      setTechnologies([""]);
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    reset();
    setIsOngoing(false);
    setTechnologies([""]);
  };

  const onSubmit = async (data: ProjectInput) => {
    setIsLoading(true);
    setError(null);

    try {
      // Filter out empty technologies
      const filteredTechnologies = technologies.filter((t) => t.trim() !== "");
      const payload = {
        ...data,
        technologies: filteredTechnologies,
        is_ongoing: isOngoing,
        end_date: isOngoing ? null : data.end_date,
      };

      if (editingId) {
        const { updateProject, getProjects } = await import(
          "@/actions/projects"
        );
        const result = await updateProject(editingId, payload);
        if (result.success) {
          // Refresh the list after update
          const listResult = await getProjects();
          if (listResult.success) {
            setProjects(listResult.data);
          }
          closeDialog();
        } else {
          setError(result.error || "Failed to update project");
        }
      } else {
        const { createProject, getProjects } = await import(
          "@/actions/projects"
        );
        const result = await createProject(payload);
        if (result.success) {
          // Refresh the list after creation
          const listResult = await getProjects();
          if (listResult.success) {
            setProjects(listResult.data);
          }
          closeDialog();
        } else {
          setError(result.error || "Failed to create project");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      const { deleteProject } = await import("@/actions/projects");
      const result = await deleteProject(id);
      if (result.success) {
        setProjects(projects.filter((proj) => proj.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  const addTechnology = () => {
    setTechnologies([...technologies, ""]);
  };

  const removeTechnology = (index: number) => {
    setTechnologies(technologies.filter((_, i) => i !== index));
  };

  const updateTechnology = (index: number, value: string) => {
    const updated = [...technologies];
    updated[index] = value;
    setTechnologies(updated);
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
              <CardTitle>Projects</CardTitle>
              <CardDescription>
                Showcase your personal and professional projects
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Project
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderGit2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No projects added yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => openDialog()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Project
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="border rounded-lg p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">
                          {project.project_name}
                        </h3>
                        {project.is_ongoing && (
                          <Badge variant="secondary">Ongoing</Badge>
                        )}
                      </div>
                      {project.role && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {project.role}
                        </p>
                      )}
                      {(project.start_date || project.end_date) && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <Calendar className="h-4 w-4" />
                          {project.start_date && formatDate(project.start_date)}
                          {project.start_date && (project.end_date || project.is_ongoing) && " - "}
                          {project.is_ongoing
                            ? "Present"
                            : project.end_date && formatDate(project.end_date)}
                        </div>
                      )}
                      {project.description && (
                        <p className="text-sm mt-2">{project.description}</p>
                      )}
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {project.technologies.map((tech, idx) => (
                            <Badge key={idx} variant="outline">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {project.project_url && (
                        <div className="flex flex-wrap gap-3 mt-3">
                          <a
                            href={project.project_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Live Demo
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openDialog(project)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(project.id)}
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

      {/* Project Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Project" : "Add Project"}
            </DialogTitle>
            <DialogDescription>
              Provide details about your project
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="project_name">
                Project Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="project_name"
                placeholder="E-commerce Platform"
                {...register("project_name")}
                disabled={isLoading}
              />
              {errors.project_name && (
                <p className="text-sm text-destructive">
                  {errors.project_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                placeholder="Lead Developer"
                {...register("role")}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register("start_date")}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  {...register("end_date")}
                  disabled={isLoading || isOngoing}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_ongoing"
                checked={isOngoing}
                onCheckedChange={(checked) => {
                  setIsOngoing(checked as boolean);
                  setValue("is_ongoing", checked as boolean);
                  if (checked) {
                    setValue("end_date", null);
                  }
                }}
              />
              <Label htmlFor="is_ongoing" className="cursor-pointer">
                This is an ongoing project
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="Describe the project, your contributions, and key features..."
                {...register("description")}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>Technologies Used</Label>
              <div className="space-y-2">
                {technologies.map((tech, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={tech}
                      onChange={(e) => updateTechnology(index, e.target.value)}
                      placeholder="e.g., React, Node.js, PostgreSQL"
                      disabled={isLoading}
                    />
                    {technologies.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeTechnology(index)}
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
                  onClick={addTechnology}
                  disabled={isLoading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Technology
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_url">Project URL</Label>
              <Input
                id="project_url"
                type="url"
                placeholder="https://example.com"
                {...register("project_url")}
                disabled={isLoading}
              />
              {errors.project_url && (
                <p className="text-sm text-destructive">
                  {errors.project_url.message}
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
                  "Add Project"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
