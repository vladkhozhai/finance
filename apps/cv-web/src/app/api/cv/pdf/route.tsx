/**
 * CV PDF Generation API Route
 *
 * Generates a PDF of the user's CV using the selected template.
 * Returns the PDF as a downloadable file.
 *
 * Query parameters:
 * - template: Template slug (modern, professional, creative, minimal, executive,
 *             technical, simple, compact, corporate, academic, elegant, designer)
 */

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import {
  ModernPDF,
  ProfessionalPDF,
  CreativePDF,
  PDF_TEMPLATES,
  type PDFTemplateProps,
  type PDFTemplateId,
} from "@/components/cv-pdf-templates";

// Force dynamic rendering
export const dynamic = "force-dynamic";

/**
 * GET /api/cv/pdf?template=modern
 * Generate and download CV as PDF
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get template from query params
    const searchParams = request.nextUrl.searchParams;
    const templateSlug = (searchParams.get("template") ||
      "modern") as PDFTemplateId;

    // Validate template
    if (!PDF_TEMPLATES[templateSlug]) {
      const availableTemplates = Object.keys(PDF_TEMPLATES).join(", ");
      return NextResponse.json(
        { error: `Invalid template. Available templates: ${availableTemplates}` },
        { status: 400 },
      );
    }

    // Fetch all CV data in parallel
    const [
      profileResult,
      socialLinksResult,
      workExperiencesResult,
      educationResult,
      skillsResult,
      projectsResult,
      certificationsResult,
      languagesResult,
    ] = await Promise.all([
      supabase.from("cv_profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("cv_social_links")
        .select("*")
        .eq("user_id", user.id)
        .order("display_order", { ascending: true }),
      supabase
        .from("cv_work_experiences")
        .select("*")
        .eq("user_id", user.id)
        .order("display_order", { ascending: true })
        .order("start_date", { ascending: false }),
      supabase
        .from("cv_education")
        .select("*")
        .eq("user_id", user.id)
        .order("display_order", { ascending: true })
        .order("start_date", { ascending: false }),
      supabase
        .from("cv_skills")
        .select("*")
        .eq("user_id", user.id)
        .order("display_order", { ascending: true }),
      supabase
        .from("cv_projects")
        .select("*")
        .eq("user_id", user.id)
        .order("display_order", { ascending: true }),
      supabase
        .from("cv_certifications")
        .select("*")
        .eq("user_id", user.id)
        .order("display_order", { ascending: true }),
      supabase
        .from("cv_languages")
        .select("*")
        .eq("user_id", user.id)
        .order("display_order", { ascending: true }),
    ]);

    // Check for errors
    if (profileResult.error) {
      console.error("Profile fetch error:", profileResult.error);
      return NextResponse.json(
        { error: "Failed to fetch profile data" },
        { status: 500 },
      );
    }

    // Prepare CV data for the PDF template
    const profile = profileResult.data;

    // Get user email from auth
    const userEmail = user.email || "";

    const templateProps: PDFTemplateProps = {
      profile: profile
        ? {
            first_name: profile.first_name || "Unknown",
            last_name: profile.last_name || "User",
            middle_name: profile.middle_name,
            professional_title: profile.professional_title,
            email: userEmail,
            phone: profile.phone,
            address_city: profile.address_city,
            address_country: profile.address_country,
            professional_summary: profile.professional_summary,
            profile_photo_url: profile.profile_photo_url,
          }
        : null,
      socialLinks: (socialLinksResult.data || []).map((link) => ({
        platform: link.platform,
        url: link.url,
      })),
      workExperiences: (workExperiencesResult.data || []).map((exp) => ({
        company_name: exp.company_name,
        job_title: exp.job_title,
        employment_type: exp.employment_type,
        location: exp.location,
        is_remote: exp.is_remote || false,
        start_date: exp.start_date,
        end_date: exp.end_date,
        is_current: exp.is_current || false,
        description: exp.description,
        achievements: exp.achievements || [],
      })),
      education: (educationResult.data || []).map((edu) => ({
        institution_name: edu.institution_name,
        degree: edu.degree,
        field_of_study: edu.field_of_study,
        start_date: edu.start_date,
        end_date: edu.end_date,
        is_current: edu.is_current || false,
        gpa: edu.gpa,
        description: edu.description,
      })),
      skills: (skillsResult.data || []).map((skill) => ({
        skill_name: skill.skill_name,
        proficiency_level: skill.proficiency_level,
        category: skill.category,
      })),
      projects: (projectsResult.data || []).map((proj) => ({
        project_name: proj.project_name,
        role: proj.role,
        start_date: proj.start_date,
        end_date: proj.end_date,
        is_ongoing: proj.is_ongoing || false,
        description: proj.description,
        technologies: proj.technologies || [],
        project_url: proj.project_url,
      })),
      certifications: (certificationsResult.data || []).map((cert) => ({
        certification_name: cert.certification_name,
        issuing_organization: cert.issuing_organization,
        issue_date: cert.issue_date,
        expiration_date: cert.expiration_date,
        credential_id: cert.credential_id,
        credential_url: cert.credential_url,
      })),
      languages: (languagesResult.data || []).map((lang) => ({
        language_name: lang.language_name,
        proficiency: lang.proficiency,
      })),
    };

    // Select the appropriate template component
    const TemplateComponent = PDF_TEMPLATES[templateSlug];

    // Render PDF to buffer
    const pdfBuffer = await renderToBuffer(
      <TemplateComponent {...templateProps} />,
    );

    // Generate filename
    const firstName = profile?.first_name || "CV";
    const lastName = profile?.last_name || "";
    const date = new Date().toISOString().split("T")[0];
    const filename = `${firstName}_${lastName}_CV_${date}.pdf`
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_");

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(pdfBuffer);

    // Return PDF as response
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": uint8Array.length.toString(),
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
