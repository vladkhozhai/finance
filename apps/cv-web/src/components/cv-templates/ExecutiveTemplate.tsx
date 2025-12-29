"use client";

import { Mail, Phone, MapPin, Globe, Linkedin, Github } from "lucide-react";
import type { CVTemplateProps } from "./types";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
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
    return <Linkedin className="h-4 w-4" />;
  }
  if (lowerPlatform.includes("github")) {
    return <Github className="h-4 w-4" />;
  }
  return <Globe className="h-4 w-4" />;
}

/**
 * Executive Template
 * Elegant, premium design with serif fonts and golden accents.
 * Best for: Senior management, C-suite, board positions, legal, finance.
 */
export function ExecutiveTemplate({
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

  // Group skills by category
  const skillsByCategory = skills.reduce(
    (acc, skill) => {
      const category = skill.category || "Core Competencies";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(skill);
      return acc;
    },
    {} as Record<string, typeof skills>,
  );

  return (
    <div className="cv-executive-template min-h-screen bg-slate-50 text-slate-800">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap');

        .cv-executive-template {
          font-family: 'Source Sans 3', Georgia, serif;
        }
        .cv-executive-template h1,
        .cv-executive-template h2,
        .cv-executive-template h3 {
          font-family: 'Playfair Display', Georgia, serif;
        }
        @media print {
          .cv-executive-template {
            font-size: 10pt;
            background: white;
          }
          .cv-executive-template .section {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="mx-auto max-w-4xl bg-white shadow-lg print:shadow-none">
        {/* Elegant Header with gold accent */}
        <header className="border-b-4 border-amber-600 bg-slate-900 px-12 py-10 text-white">
          <h1 className="mb-2 text-4xl font-semibold tracking-wide">
            {fullName}
          </h1>
          {profile?.professional_title && (
            <h2 className="mb-6 text-xl font-light tracking-wider text-amber-400">
              {profile.professional_title}
            </h2>
          )}

          {/* Contact Information */}
          <div className="flex flex-wrap gap-6 text-sm text-slate-300">
            {profile?.email && (
              <a href={`mailto:${profile.email}`} className="flex items-center gap-2 hover:text-amber-400">
                <Mail className="h-4 w-4" />
                {profile.email}
              </a>
            )}
            {profile?.phone && (
              <a href={`tel:${profile.phone}`} className="flex items-center gap-2 hover:text-amber-400">
                <Phone className="h-4 w-4" />
                {profile.phone}
              </a>
            )}
            {location && (
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {location}
              </span>
            )}
            {socialLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-amber-400"
              >
                {getSocialIcon(link.platform)}
                {link.platform}
              </a>
            ))}
          </div>
        </header>

        <div className="px-12 py-10">
          {/* Executive Summary */}
          {profile?.professional_summary && (
            <section className="section mb-10 border-l-4 border-amber-600 pl-6">
              <h3 className="mb-3 text-lg font-semibold text-slate-900">
                Executive Summary
              </h3>
              <p className="text-base leading-relaxed text-slate-700">
                {profile.professional_summary}
              </p>
            </section>
          )}

          {/* Core Competencies / Skills */}
          {skills.length > 0 && (
            <section className="section mb-10">
              <h3 className="mb-4 border-b-2 border-slate-200 pb-2 text-lg font-semibold text-slate-900">
                Core Competencies
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {skills.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                    <span className="text-slate-700">{skill.skill_name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Professional Experience */}
          {workExperiences.length > 0 && (
            <section className="section mb-10">
              <h3 className="mb-6 border-b-2 border-slate-200 pb-2 text-lg font-semibold text-slate-900">
                Professional Experience
              </h3>
              <div className="space-y-8">
                {workExperiences.map((work, index) => (
                  <div key={index} className="relative pl-6">
                    <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-amber-600 bg-white" />
                    {index < workExperiences.length - 1 && (
                      <div className="absolute left-1.5 top-4 h-full w-px bg-slate-200" />
                    )}
                    <div className="mb-2">
                      <h4 className="text-lg font-semibold text-slate-900">
                        {work.job_title}
                      </h4>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-medium text-amber-700">
                          {work.company_name}
                        </span>
                        {work.location && (
                          <>
                            <span className="text-slate-400">|</span>
                            <span className="text-slate-600">{work.location}</span>
                          </>
                        )}
                        <span className="text-slate-400">|</span>
                        <span className="text-slate-500">
                          {formatDateRange(work.start_date, work.end_date, work.is_current)}
                        </span>
                      </div>
                    </div>
                    {work.description && (
                      <p className="mb-2 text-sm leading-relaxed text-slate-600">
                        {work.description}
                      </p>
                    )}
                    {work.achievements && work.achievements.length > 0 && (
                      <ul className="space-y-1">
                        {work.achievements.map((achievement, achIndex) => (
                          <li key={achIndex} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-amber-600" />
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Two Column Layout for Education, Certifications, Languages */}
          <div className="grid grid-cols-2 gap-10">
            {/* Education */}
            {education.length > 0 && (
              <section className="section">
                <h3 className="mb-4 border-b-2 border-slate-200 pb-2 text-lg font-semibold text-slate-900">
                  Education
                </h3>
                <div className="space-y-4">
                  {education.map((edu, index) => (
                    <div key={index}>
                      <h4 className="font-semibold text-slate-900">
                        {edu.degree}
                      </h4>
                      <div className="text-sm text-slate-700">
                        {edu.field_of_study}
                      </div>
                      <div className="text-sm text-amber-700">
                        {edu.institution_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatDateRange(edu.start_date, edu.end_date, edu.is_current)}
                        {edu.gpa && ` | GPA: ${edu.gpa}`}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <section className="section">
                <h3 className="mb-4 border-b-2 border-slate-200 pb-2 text-lg font-semibold text-slate-900">
                  Credentials & Certifications
                </h3>
                <div className="space-y-3">
                  {certifications.map((cert, index) => (
                    <div key={index}>
                      <h4 className="font-semibold text-slate-900">
                        {cert.certification_name}
                      </h4>
                      <div className="text-sm text-amber-700">
                        {cert.issuing_organization}
                      </div>
                      <div className="text-xs text-slate-500">
                        Issued {formatDate(cert.issue_date)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Projects */}
          {projects.length > 0 && (
            <section className="section mt-10">
              <h3 className="mb-4 border-b-2 border-slate-200 pb-2 text-lg font-semibold text-slate-900">
                Key Initiatives & Projects
              </h3>
              <div className="grid grid-cols-2 gap-6">
                {projects.map((project, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 p-4">
                    <h4 className="font-semibold text-slate-900">
                      {project.project_name}
                    </h4>
                    {project.role && (
                      <div className="text-sm text-amber-700">{project.role}</div>
                    )}
                    {project.description && (
                      <p className="mt-2 text-xs text-slate-600">
                        {project.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <section className="section mt-10">
              <h3 className="mb-4 border-b-2 border-slate-200 pb-2 text-lg font-semibold text-slate-900">
                Languages
              </h3>
              <div className="flex flex-wrap gap-6">
                {languages.map((lang, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium text-slate-900">{lang.language_name}</span>
                    <span className="ml-2 text-slate-500">({lang.proficiency})</span>
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
