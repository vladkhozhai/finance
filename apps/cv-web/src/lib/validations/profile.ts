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

// Education Schema
export const educationSchema = z.object({
  institution_name: z.string().min(1, "Institution name is required"),
  degree: z.string().min(1, "Degree is required"),
  field_of_study: z.string().min(1, "Field of study is required"),
  location: z.string().optional().nullable(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional().nullable(),
  is_current: z.boolean().optional(),
  gpa: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export type EducationInput = z.infer<typeof educationSchema>;

// Skill Schema
export const PROFICIENCY_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
] as const;

export const SKILL_CATEGORIES = [
  { value: "programming", label: "Programming Languages" },
  { value: "frameworks", label: "Frameworks & Libraries" },
  { value: "tools", label: "Tools & Technologies" },
  { value: "soft-skills", label: "Soft Skills" },
  { value: "languages", label: "Languages" },
  { value: "other", label: "Other" },
] as const;

export const skillSchema = z.object({
  skill_name: z.string().min(1, "Skill name is required"),
  proficiency_level: z.enum([
    "beginner",
    "intermediate",
    "advanced",
    "expert",
  ]).optional().nullable(),
  category: z.string().optional().nullable(),
});

export type SkillInput = z.infer<typeof skillSchema>;

// Project Schema
export const projectSchema = z.object({
  project_name: z.string().min(1, "Project name is required"),
  role: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  is_ongoing: z.boolean().optional(),
  description: z.string().optional().nullable(),
  technologies: z.array(z.string()).optional(),
  project_url: z.string().url("Please enter a valid URL").optional().nullable().or(z.literal("")),
});

export type ProjectInput = z.infer<typeof projectSchema>;

// Certification Schema
export const certificationSchema = z.object({
  certification_name: z.string().min(1, "Certification name is required"),
  issuing_organization: z.string().min(1, "Issuing organization is required"),
  issue_date: z.string().min(1, "Issue date is required"),
  expiration_date: z.string().optional().nullable(),
  credential_id: z.string().optional().nullable(),
  credential_url: z.string().url("Please enter a valid URL").optional().nullable().or(z.literal("")),
});

export type CertificationInput = z.infer<typeof certificationSchema>;

// Language Schema
export const LANGUAGE_PROFICIENCIES = [
  { value: "Native", label: "Native" },
  { value: "Fluent", label: "Fluent" },
  { value: "Conversational", label: "Conversational" },
  { value: "Basic", label: "Basic" },
] as const;

export const languageSchema = z.object({
  language_name: z.string().min(1, "Language is required"),
  proficiency: z.enum([
    "Native",
    "Fluent",
    "Conversational",
    "Basic",
  ]),
});

export type LanguageInput = z.infer<typeof languageSchema>;

// CV Settings Schema
export const cvSettingsSchema = z.object({
  selected_template_id: z.string().uuid().optional().nullable(),
  theme_color: z.string().optional().nullable(),
  font_family: z.string().optional().nullable(),
  sections_visibility: z.record(z.string(), z.boolean()).default({
    projects: true,
    certifications: true,
    languages: true,
  }),
});

export type CVSettingsInput = z.infer<typeof cvSettingsSchema>;
