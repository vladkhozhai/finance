"use client";

import { Mail, Phone, MapPin, Globe, Linkedin, Github } from "lucide-react";
import type { CVTemplateProps } from "./types";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatDateRange(
  startDate: string,
  endDate: string | null | undefined,
  isCurrent: boolean | undefined,
): string {
  const start = formatDate(startDate);
  if (isCurrent) {
    return `${start} - Present`;
  }
  if (endDate) {
    return `${start} - ${formatDate(endDate)}`;
  }
  return start;
}

function getSocialIcon(platform: string) {
  const lowerPlatform = platform.toLowerCase();
  if (lowerPlatform.includes("linkedin")) {
    return <Linkedin className="h-3.5 w-3.5" />;
  }
  if (lowerPlatform.includes("github")) {
    return <Github className="h-3.5 w-3.5" />;
  }
  return <Globe className="h-3.5 w-3.5" />;
}

/**
 * Minimal Template
 * Ultra-clean single column design with subtle spacing and minimal decoration.
 * Best for: Academic, research, consulting positions.
 */
export function MinimalTemplate({
  profile,
  socialLinks,
  workExperiences,
  education,
  skills,
  projects,
  certifications,
  languages,
}: CVTemplateProps) {
  const fullName = profile
    ? `${profile.first_name} ${profile.middle_name ? `${profile.middle_name} ` : ""}${profile.last_name}`
    : "Your Name";

  const location =
    profile?.address_city && profile?.address_country
      ? `${profile.address_city}, ${profile.address_country}`
      : profile?.address_city || profile?.address_country || null;

  return (
    <div className="cv-minimal-template min-h-screen bg-white text-gray-800">
      <style jsx global>{`
        @media print {
          .cv-minimal-template {
            font-size: 10pt;
          }
          .cv-minimal-template .section {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="mx-auto max-w-3xl px-12 py-12 print:px-8 print:py-8">
        {/* Header - Centered */}
        <header className="mb-10 text-center">
          <h1 className="mb-2 text-3xl font-light tracking-wide text-gray-900">
            {fullName}
          </h1>
          {profile?.professional_title && (
            <h2 className="mb-4 text-base font-normal text-gray-500">
              {profile.professional_title}
            </h2>
          )}

          {/* Contact Row */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-600">
            {profile?.email && (
              <a href={`mailto:${profile.email}`} className="flex items-center gap-1 hover:text-gray-900">
                <Mail className="h-3 w-3" />
                {profile.email}
              </a>
            )}
            {profile?.phone && (
              <a href={`tel:${profile.phone}`} className="flex items-center gap-1 hover:text-gray-900">
                <Phone className="h-3 w-3" />
                {profile.phone}
              </a>
            )}
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {location}
              </span>
            )}
            {socialLinks.slice(0, 3).map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-gray-900"
              >
                {getSocialIcon(link.platform)}
                {link.platform}
              </a>
            ))}
          </div>
        </header>

        {/* Professional Summary */}
        {profile?.professional_summary && (
          <section className="section mb-8">
            <p className="text-sm leading-relaxed text-gray-700">
              {profile.professional_summary}
            </p>
          </section>
        )}

        {/* Work Experience */}
        {workExperiences.length > 0 && (
          <section className="section mb-8">
            <h3 className="mb-4 border-b border-gray-200 pb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
              Experience
            </h3>
            <div className="space-y-5">
              {workExperiences.map((work, index) => (
                <div key={index}>
                  <div className="flex items-baseline justify-between gap-4">
                    <h4 className="text-sm font-medium text-gray-900">
                      {work.job_title}
                    </h4>
                    <span className="whitespace-nowrap text-xs text-gray-500">
                      {formatDateRange(work.start_date, work.end_date, work.is_current)}
                    </span>
                  </div>
                  <div className="mb-1 text-sm text-gray-600">
                    {work.company_name}
                    {work.location && ` · ${work.location}`}
                    {work.is_remote && " (Remote)"}
                  </div>
                  {work.description && (
                    <p className="text-xs leading-relaxed text-gray-600">
                      {work.description}
                    </p>
                  )}
                  {work.achievements && work.achievements.length > 0 && (
                    <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-gray-600">
                      {work.achievements.map((achievement, achIndex) => (
                        <li key={achIndex}>{achievement}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section className="section mb-8">
            <h3 className="mb-4 border-b border-gray-200 pb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
              Education
            </h3>
            <div className="space-y-4">
              {education.map((edu, index) => (
                <div key={index}>
                  <div className="flex items-baseline justify-between gap-4">
                    <h4 className="text-sm font-medium text-gray-900">
                      {edu.degree} in {edu.field_of_study}
                    </h4>
                    <span className="whitespace-nowrap text-xs text-gray-500">
                      {formatDateRange(edu.start_date, edu.end_date, edu.is_current)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {edu.institution_name}
                    {edu.gpa && ` · GPA: ${edu.gpa}`}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <section className="section mb-8">
            <h3 className="mb-4 border-b border-gray-200 pb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
              Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="text-xs text-gray-700"
                >
                  {skill.skill_name}
                  {index < skills.length - 1 && <span className="ml-2 text-gray-300">·</span>}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section className="section mb-8">
            <h3 className="mb-4 border-b border-gray-200 pb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
              Projects
            </h3>
            <div className="space-y-4">
              {projects.map((project, index) => (
                <div key={index}>
                  <div className="flex items-baseline justify-between gap-4">
                    <h4 className="text-sm font-medium text-gray-900">
                      {project.project_name}
                      {project.role && (
                        <span className="ml-2 font-normal text-gray-500">
                          ({project.role})
                        </span>
                      )}
                    </h4>
                    {project.start_date && (
                      <span className="whitespace-nowrap text-xs text-gray-500">
                        {formatDateRange(project.start_date, project.end_date, project.is_ongoing)}
                      </span>
                    )}
                  </div>
                  {project.description && (
                    <p className="text-xs text-gray-600">{project.description}</p>
                  )}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="mt-1 text-xs text-gray-500">
                      {project.technologies.join(" · ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications & Languages Row */}
        <div className="grid grid-cols-2 gap-8">
          {/* Certifications */}
          {certifications.length > 0 && (
            <section className="section">
              <h3 className="mb-4 border-b border-gray-200 pb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
                Certifications
              </h3>
              <div className="space-y-2">
                {certifications.map((cert, index) => (
                  <div key={index} className="text-xs">
                    <div className="font-medium text-gray-900">
                      {cert.certification_name}
                    </div>
                    <div className="text-gray-600">
                      {cert.issuing_organization} · {formatDate(cert.issue_date)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <section className="section">
              <h3 className="mb-4 border-b border-gray-200 pb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
                Languages
              </h3>
              <div className="space-y-1">
                {languages.map((lang, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-900">{lang.language_name}</span>
                    <span className="text-gray-500">{lang.proficiency}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
