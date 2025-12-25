import { z } from "zod";

export const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  middle_name: z.string().optional().nullable(),
  professional_title: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address_street: z.string().optional().nullable(),
  address_city: z.string().optional().nullable(),
  address_state: z.string().optional().nullable(),
  address_country: z.string().optional().nullable(),
  address_postal_code: z.string().optional().nullable(),
  professional_summary: z.string().optional().nullable(),
  profile_photo_url: z.string().url().optional().nullable(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const socialLinkSchema = z.object({
  platform: z.string().min(1, "Platform is required"),
  url: z.string().url("Please enter a valid URL"),
});

export type SocialLinkInput = z.infer<typeof socialLinkSchema>;

export const workExperienceSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  job_title: z.string().min(1, "Job title is required"),
  employment_type: z.enum([
    "full-time",
    "part-time",
    "contract",
    "freelance",
    "internship",
  ]).optional().nullable(),
  location: z.string().optional().nullable(),
  is_remote: z.boolean().default(false),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional().nullable(),
  is_current: z.boolean().default(false),
  description: z.string().optional().nullable(),
  achievements: z.array(z.string()).default([]),
});

export type WorkExperienceInput = z.infer<typeof workExperienceSchema>;

export const SOCIAL_PLATFORMS = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "github", label: "GitHub" },
  { value: "twitter", label: "Twitter / X" },
  { value: "portfolio", label: "Portfolio Website" },
  { value: "dribbble", label: "Dribbble" },
  { value: "behance", label: "Behance" },
  { value: "medium", label: "Medium" },
  { value: "other", label: "Other" },
] as const;

export const EMPLOYMENT_TYPES = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
] as const;
