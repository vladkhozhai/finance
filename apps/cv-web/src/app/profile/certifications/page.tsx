"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Award,
  Calendar,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  certificationSchema,
  type CertificationInput,
} from "@/lib/validations/profile";

import type { Certification } from "@/actions/certifications";

export default function CertificationsPage() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
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
  } = useForm<CertificationInput>({
    resolver: zodResolver(certificationSchema),
  });

  // Fetch certifications
  useEffect(() => {
    async function fetchCertifications() {
      try {
        const response = await fetch("/api/certifications");
        if (response.ok) {
          const data = await response.json();
          setCertifications(data.certifications || []);
        }
      } catch (err) {
        console.error("Failed to fetch certifications:", err);
      } finally {
        setIsFetching(false);
      }
    }

    fetchCertifications();
  }, []);

  const openDialog = (certification?: Certification) => {
    if (certification) {
      setEditingId(certification.id);
      Object.keys(certification).forEach((key) => {
        setValue(
          key as keyof CertificationInput,
          certification[key as keyof CertificationInput]
        );
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

  const onSubmit = async (data: CertificationInput) => {
    setIsLoading(true);
    setError(null);

    try {
      if (editingId) {
        const { updateCertification, getCertifications } = await import(
          "@/actions/certifications"
        );
        const result = await updateCertification(editingId, data);
        if (result.success) {
          // Refresh the list after update
          const listResult = await getCertifications();
          if (listResult.success) {
            setCertifications(listResult.data);
          }
          closeDialog();
        } else {
          setError(result.error || "Failed to update certification");
        }
      } else {
        const { createCertification, getCertifications } = await import(
          "@/actions/certifications"
        );
        const result = await createCertification(data);
        if (result.success) {
          // Refresh the list after creation
          const listResult = await getCertifications();
          if (listResult.success) {
            setCertifications(listResult.data);
          }
          closeDialog();
        } else {
          setError(result.error || "Failed to create certification");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this certification?")) {
      return;
    }

    try {
      const { deleteCertification } = await import(
        "@/actions/certifications"
      );
      const result = await deleteCertification(id);
      if (result.success) {
        setCertifications(certifications.filter((cert) => cert.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete certification:", err);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  const isExpired = (expirationDate: string | null | undefined) => {
    if (!expirationDate) return false;
    return new Date(expirationDate) < new Date();
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
              <CardTitle>Certifications</CardTitle>
              <CardDescription>
                Add your professional certifications and licenses
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Certification
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {certifications.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No certifications added yet
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => openDialog()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Certification
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {certifications.map((cert) => {
                const expired = isExpired(cert.expiration_date);
                return (
                  <div
                    key={cert.id}
                    className="border rounded-lg p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{cert.certification_name}</h3>
                          {expired && (
                            <Badge
                              variant="destructive"
                              className="flex items-center gap-1"
                            >
                              <AlertCircle className="h-3 w-3" />
                              Expired
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground">
                          {cert.issuing_organization}
                        </p>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Issued {formatDate(cert.issue_date)}
                          </span>
                          {cert.expiration_date && (
                            <span
                              className={
                                expired ? "text-destructive font-medium" : ""
                              }
                            >
                              {expired ? "Expired" : "Expires"}{" "}
                              {formatDate(cert.expiration_date)}
                            </span>
                          )}
                          {!cert.expiration_date && (
                            <span>No Expiration</span>
                          )}
                        </div>
                        {cert.credential_id && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Credential ID: {cert.credential_id}
                          </p>
                        )}
                        {cert.credential_url && (
                          <a
                            href={cert.credential_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Credential
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openDialog(cert)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(cert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certification Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Certification" : "Add Certification"}
            </DialogTitle>
            <DialogDescription>
              Provide details about your certification
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="certification_name">
                Certification Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="certification_name"
                placeholder="AWS Certified Solutions Architect"
                {...register("certification_name")}
                disabled={isLoading}
              />
              {errors.certification_name && (
                <p className="text-sm text-destructive">{errors.certification_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="issuing_organization">
                Issuing Organization <span className="text-destructive">*</span>
              </Label>
              <Input
                id="issuing_organization"
                placeholder="Amazon Web Services (AWS)"
                {...register("issuing_organization")}
                disabled={isLoading}
              />
              {errors.issuing_organization && (
                <p className="text-sm text-destructive">
                  {errors.issuing_organization.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issue_date">
                  Issue Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="issue_date"
                  type="date"
                  {...register("issue_date")}
                  disabled={isLoading}
                />
                {errors.issue_date && (
                  <p className="text-sm text-destructive">
                    {errors.issue_date.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiration_date">Expiration Date</Label>
                <Input
                  id="expiration_date"
                  type="date"
                  {...register("expiration_date")}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank if the certification does not expire
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="credential_id">Credential ID</Label>
              <Input
                id="credential_id"
                placeholder="ABC-123-XYZ"
                {...register("credential_id")}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credential_url">Credential URL</Label>
              <Input
                id="credential_url"
                type="url"
                placeholder="https://example.com/verify/credential"
                {...register("credential_url")}
                disabled={isLoading}
              />
              {errors.credential_url && (
                <p className="text-sm text-destructive">
                  {errors.credential_url.message}
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
                  "Add Certification"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
