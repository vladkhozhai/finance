/**
 * PDF Template Types
 * Shared types for @react-pdf/renderer CV templates
 */

// Re-export the same props structure used by web templates
export interface PDFTemplateProps {
  profile: {
    first_name: string;
    last_name: string;
    middle_name?: string | null;
    professional_title?: string | null;
    email: string;
    phone?: string | null;
    address_city?: string | null;
    address_country?: string | null;
    professional_summary?: string | null;
    profile_photo_url?: string | null;
  } | null;
  socialLinks: Array<{ platform: string; url: string }>;
  workExperiences: Array<{
    company_name: string;
    job_title: string;
    employment_type?: string | null;
    location?: string | null;
    is_remote?: boolean;
    start_date: string;
    end_date?: string | null;
    is_current?: boolean;
    description?: string | null;
    achievements?: string[];
  }>;
  education: Array<{
    institution_name: string;
    degree: string;
    field_of_study: string;
    start_date: string;
    end_date?: string | null;
    is_current?: boolean;
    gpa?: string | null;
    description?: string | null;
  }>;
  skills: Array<{
    skill_name: string;
    proficiency_level?: string | null;
    category?: string | null;
  }>;
  projects: Array<{
    project_name: string;
    role?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    is_ongoing?: boolean;
    description?: string | null;
    technologies?: string[];
    project_url?: string | null;
  }>;
  certifications: Array<{
    certification_name: string;
    issuing_organization: string;
    issue_date: string;
    expiration_date?: string | null;
    credential_id?: string | null;
    credential_url?: string | null;
  }>;
  languages: Array<{
    language_name: string;
    proficiency: string;
  }>;
}

export type TemplateType = "modern" | "professional" | "creative";
