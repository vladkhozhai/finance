"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";

export default function PersonalInfoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(
    null
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  });

  // Fetch existing profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            // Populate form with existing data
            Object.keys(data.profile).forEach((key) => {
              setValue(key as keyof ProfileInput, data.profile[key]);
            });
            if (data.profile.profile_photo_url) {
              setProfilePhotoPreview(data.profile.profile_photo_url);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setIsFetching(false);
      }
    }

    fetchProfile();
  }, [setValue]);

  const onSubmit = async (data: ProfileInput) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Import and call server action
      const { updateProfile } = await import("@/actions/profile");
      const result = await updateProfile(data);

      if (result.success) {
        setSuccess("Profile updated successfully!");
      } else {
        setError(result.error || "Failed to update profile");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
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
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>
          Update your personal details and professional information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant="success">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Profile Photo Section */}
          <div className="space-y-2">
            <Label>Profile Photo</Label>
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                {profilePhotoPreview ? (
                  <img
                    src={profilePhotoPreview}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  {...register("profile_photo_url")}
                  disabled={isLoading}
                  onChange={(e) => {
                    register("profile_photo_url").onChange(e);
                    setProfilePhotoPreview(e.target.value);
                  }}
                />
                {errors.profile_photo_url && (
                  <p className="text-sm text-destructive">
                    {errors.profile_photo_url.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Enter a URL to your profile photo
                </p>
              </div>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="first_name"
                {...register("first_name")}
                disabled={isLoading}
              />
              {errors.first_name && (
                <p className="text-sm text-destructive">
                  {errors.first_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="middle_name">Middle Name</Label>
              <Input
                id="middle_name"
                {...register("middle_name")}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="last_name"
                {...register("last_name")}
                disabled={isLoading}
              />
              {errors.last_name && (
                <p className="text-sm text-destructive">
                  {errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          {/* Professional Title */}
          <div className="space-y-2">
            <Label htmlFor="professional_title">Professional Title</Label>
            <Input
              id="professional_title"
              placeholder="e.g. Senior Software Engineer"
              {...register("professional_title")}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Your current job title or desired role
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              {...register("phone")}
              disabled={isLoading}
            />
          </div>

          {/* Address Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Address</h3>
            <div className="space-y-2">
              <Label htmlFor="address_street">Street Address</Label>
              <Input
                id="address_street"
                placeholder="123 Main St, Apt 4B"
                {...register("address_street")}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address_city">City</Label>
                <Input
                  id="address_city"
                  {...register("address_city")}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_state">State / Province</Label>
                <Input
                  id="address_state"
                  {...register("address_state")}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address_country">Country</Label>
                <Input
                  id="address_country"
                  {...register("address_country")}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_postal_code">Postal Code</Label>
                <Input
                  id="address_postal_code"
                  {...register("address_postal_code")}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          <div className="space-y-2">
            <Label htmlFor="professional_summary">Professional Summary</Label>
            <Textarea
              id="professional_summary"
              rows={6}
              placeholder="Write a brief summary about your professional background, skills, and career objectives..."
              {...register("professional_summary")}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              This will appear at the top of your CV
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={isLoading}
            >
              Reset
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
