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
    return <Linkedin className="h-4 w-4" />;
  }
  if (lowerPlatform.includes("github")) {
    return <Github className="h-4 w-4" />;
  }
  return <Globe className="h-4 w-4" />;
}

/**
 * Corporate Template
 * Traditional business format with navy blue and gray colors.
 * Conservative, ATS-compatible structure with standard corporate styling.
 * Best for: Corporate roles, finance, consulting, management positions.
 */
export function CorporateTemplate({
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
    <div className="cv-corporate-template min-h-screen bg-white text-gray-900">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Roboto+Slab:wght@600;700&display=swap');

        .cv-corporate-template {
          font-family: 'Roboto', -apple-system, sans-serif;
        }
        .cv-corporate-template h1,
        .cv-corporate-template h2,
        .cv-corporate-template h3 {
          font-family: 'Roboto Slab', serif;
        }
        @media print {
          .cv-corporate-template {
            font-size: 10pt;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .cv-corporate-template .section {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-900 to-blue-800 px-10 py-8 text-white print:px-8 print:py-6">
          <h1 className="mb-2 text-4xl font-bold">{fullName}</h1>
          {profile?.professional_title && (
            <h2 className="mb-4 text-xl font-semibold text-blue-100">
              {profile.professional_title}
            </h2>
          )}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-blue-100">
            {profile?.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${profile.email}`} className="hover:text-white">
                  {profile.email}
                </a>
              </div>
            )}
            {profile?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{profile.phone}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{location}</span>
              </div>
            )}
            {socialLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                {getSocialIcon(link.platform)}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  {link.platform}
                </a>
              </div>
            ))}
          </div>
        </header>

        <div className="px-10 py-8 print:px-8 print:py-6">
          {/* Professional Summary */}
          {profile?.professional_summary && (
            <section className="section mb-8">
              <h3 className="mb-3 border-b-2 border-blue-900 pb-2 text-lg font-bold text-blue-900">
                PROFESSIONAL SUMMARY
              </h3>
              <p className="text-sm leading-relaxed text-gray-800">
                {profile.professional_summary}
              </p>
            </section>
          )}

          {/* Work Experience */}
          {workExperiences.length > 0 && (
            <section className="section mb-8">
              <h3 className="mb-4 border-b-2 border-blue-900 pb-2 text-lg font-bold text-blue-900">
                PROFESSIONAL EXPERIENCE
              </h3>
              <div className="space-y-6">
                {workExperiences.map((work, index) => (
                  <div key={index}>
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-bold text-gray-900">
                          {work.job_title}
                        </h4>
                        <div className="text-sm font-medium text-blue-900">
                          {work.company_name}
                          {work.location && (
                            <>
                              {" "}
                              | {work.location}
                              {work.is_remote && " (Remote)"}
                            </>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-600">
                        {formatDateRange(work.start_date, work.end_date, work.is_current)}
                      </span>
                    </div>
                    {work.description && (
                      <p className="mb-2 text-sm text-gray-800">{work.description}</p>
                    )}
                    {work.achievements && work.achievements.length > 0 && (
                      <ul className="space-y-1 text-sm text-gray-800">
                        {work.achievements.map((achievement, achIndex) => (
                          <li key={achIndex} className="ml-5 list-disc leading-relaxed">
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

          {/* Education */}
          {education.length > 0 && (
            <section className="section mb-8">
              <h3 className="mb-4 border-b-2 border-blue-900 pb-2 text-lg font-bold text-blue-900">
                EDUCATION
              </h3>
              <div className="space-y-4">
                {education.map((edu, index) => (
                  <div key={index}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-bold text-gray-900">
                          {edu.degree}
                        </h4>
                        <div className="text-sm text-gray-800">
                          {edu.field_of_study} | {edu.institution_name}
                          {edu.gpa && ` | GPA: ${edu.gpa}`}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-600">
                        {formatDateRange(edu.start_date, edu.end_date, edu.is_current)}
                      </span>
                    </div>
                    {edu.description && (
                      <p className="mt-1 text-sm text-gray-800">{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <section className="section mb-8">
              <h3 className="mb-3 border-b-2 border-blue-900 pb-2 text-lg font-bold text-blue-900">
                CORE COMPETENCIES
              </h3>
              <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-sm text-gray-800">
                {skills.map((skill, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-900" />
                    {skill.skill_name}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <section className="section mb-8">
              <h3 className="mb-4 border-b-2 border-blue-900 pb-2 text-lg font-bold text-blue-900">
                KEY PROJECTS
              </h3>
              <div className="space-y-4">
                {projects.map((project, index) => (
                  <div key={index}>
                    <div className="mb-1 flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-bold text-gray-900">
                          {project.project_name}
                        </h4>
                        {project.role && (
                          <div className="text-sm text-blue-900">{project.role}</div>
                        )}
                      </div>
                      {project.start_date && (
                        <span className="text-sm font-medium text-gray-600">
                          {formatDateRange(
                            project.start_date,
                            project.end_date,
                            project.is_ongoing,
                          )}
                        </span>
                      )}
                    </div>
                    {project.description && (
                      <p className="mb-1 text-sm text-gray-800">{project.description}</p>
                    )}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Technologies:</span>{" "}
                        {project.technologies.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certifications & Languages Grid */}
          <div className="grid grid-cols-2 gap-8">
            {/* Certifications */}
            {certifications.length > 0 && (
              <section className="section">
                <h3 className="mb-3 border-b-2 border-blue-900 pb-2 text-lg font-bold text-blue-900">
                  CERTIFICATIONS
                </h3>
                <div className="space-y-3">
                  {certifications.map((cert, index) => (
                    <div key={index}>
                      <h4 className="text-sm font-bold text-gray-900">
                        {cert.certification_name}
                      </h4>
                      <div className="text-sm text-gray-700">
                        {cert.issuing_organization}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDate(cert.issue_date)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <section className="section">
                <h3 className="mb-3 border-b-2 border-blue-900 pb-2 text-lg font-bold text-blue-900">
                  LANGUAGES
                </h3>
                <div className="space-y-2 text-sm text-gray-800">
                  {languages.map((lang, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-900" />
                      <span className="font-medium">{lang.language_name}:</span>{" "}
                      {lang.proficiency}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
