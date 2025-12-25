"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Linkedin,
  Github,
  Twitter,
  Globe,
} from "lucide-react";
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
import {
  socialLinkSchema,
  type SocialLinkInput,
  SOCIAL_PLATFORMS,
} from "@/lib/validations/profile";
import type { SocialLink } from "@/actions/social-links";

const platformIcons: Record<string, React.ReactNode> = {
  linkedin: <Linkedin className="h-5 w-5" />,
  github: <Github className="h-5 w-5" />,
  twitter: <Twitter className="h-5 w-5" />,
  portfolio: <Globe className="h-5 w-5" />,
  dribbble: <Globe className="h-5 w-5" />,
  behance: <Globe className="h-5 w-5" />,
  medium: <Globe className="h-5 w-5" />,
  other: <Globe className="h-5 w-5" />,
};

export default function SocialLinksPage() {
  const [links, setLinks] = useState<SocialLink[]>([]);
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
  } = useForm<SocialLinkInput>({
    resolver: zodResolver(socialLinkSchema),
  });

  const selectedPlatform = watch("platform");

  // Fetch social links
  useEffect(() => {
    async function fetchLinks() {
      try {
        const response = await fetch("/api/social-links");
        if (response.ok) {
          const data = await response.json();
          setLinks(data.links || []);
        }
      } catch (err) {
        console.error("Failed to fetch social links:", err);
      } finally {
        setIsFetching(false);
      }
    }

    fetchLinks();
  }, []);

  const openDialog = (link?: SocialLink) => {
    if (link) {
      setEditingId(link.id);
      setValue("platform", link.platform);
      setValue("url", link.url);
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

  const onSubmit = async (data: SocialLinkInput) => {
    setIsLoading(true);
    setError(null);

    try {
      if (editingId) {
        const { updateSocialLink, getSocialLinks } = await import("@/actions/social-links");
        const result = await updateSocialLink(editingId, data);
        if (result.success) {
          // Refresh the list after update
          const listResult = await getSocialLinks();
          if (listResult.success) {
            setLinks(listResult.data);
          }
          closeDialog();
        } else {
          setError(result.error || "Failed to update social link");
        }
      } else {
        const { createSocialLink, getSocialLinks } = await import("@/actions/social-links");
        const result = await createSocialLink(data);
        if (result.success) {
          // Refresh the list after creation
          const listResult = await getSocialLinks();
          if (listResult.success) {
            setLinks(listResult.data);
          }
          closeDialog();
        } else {
          setError(result.error || "Failed to create social link");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this social link?")) {
      return;
    }

    try {
      const { deleteSocialLink } = await import("@/actions/social-links");
      const result = await deleteSocialLink(id);
      if (result.success) {
        setLinks(links.filter((link) => link.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete social link:", err);
    }
  };

  const getPlatformLabel = (platform: string) => {
    return (
      SOCIAL_PLATFORMS.find((p) => p.value === platform)?.label || platform
    );
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
              <CardTitle>Social Links</CardTitle>
              <CardDescription>
                Add links to your professional profiles and portfolio
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Link
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No social links added yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => openDialog()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Link
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-muted-foreground">
                      {platformIcons[link.platform]}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {getPlatformLabel(link.platform)}
                      </p>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                      >
                        {link.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openDialog(link)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(link.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social Link Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Social Link" : "Add Social Link"}
            </DialogTitle>
            <DialogDescription>
              Add a link to your professional profile or portfolio
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="platform">
                Platform <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={(value) => setValue("platform", value)}
                defaultValue={selectedPlatform}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <SelectItem key={platform.value} value={platform.value}>
                      {platform.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.platform && (
                <p className="text-sm text-destructive">
                  {errors.platform.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">
                URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="url"
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                {...register("url")}
                disabled={isLoading}
              />
              {errors.url && (
                <p className="text-sm text-destructive">{errors.url.message}</p>
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
                  "Add Link"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
