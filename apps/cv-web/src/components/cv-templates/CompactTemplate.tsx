"use client";

import { Mail, Phone, MapPin, Globe, Linkedin, Github, Briefcase, GraduationCap, Award, Code, Languages } from "lucide-react";
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
    return <Linkedin className="h-3 w-3" />;
  }
  if (lowerPlatform.includes("github")) {
    return <Github className="h-3 w-3" />;
  }
  return <Globe className="h-3 w-3" />;
}

/**
 * Compact Template
 * Dense single-page layout with two-column 25%/75% split.
 * Teal accents, minimal whitespace to fit more content.
 * Best for: Experienced professionals with extensive content, single-page requirements.
 */
export function CompactTemplate({
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
      const category = skill.category || "other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(skill);
      return acc;
    },
    {} as Record<string, typeof skills>,
  );

  return (
    <div className="cv-compact-template min-h-screen bg-white text-gray-900">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .cv-compact-template {
          font-family: 'Inter', -apple-system, sans-serif;
        }
        @media print {
          .cv-compact-template {
            font-size: 8.5pt;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .cv-compact-template .section {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="bg-teal-600 px-8 py-6 text-white print:px-6 print:py-4">
          <h1 className="mb-1 text-3xl font-bold">{fullName}</h1>
          {profile?.professional_title && (
            <h2 className="mb-3 text-lg font-medium text-teal-50">
              {profile.professional_title}
            </h2>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-teal-50">
            {profile?.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span>{profile.email}</span>
              </div>
            )}
            {profile?.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>{profile.phone}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{location}</span>
              </div>
            )}
            {socialLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-1">
                {getSocialIcon(link.platform)}
                <span>{link.platform}</span>
              </div>
            ))}
          </div>
        </header>

        <div className="flex">
          {/* Left Sidebar (25%) */}
          <aside className="w-1/4 space-y-5 bg-gray-50 px-5 py-6 print:px-4 print:py-4">
            {/* Skills */}
            {skills.length > 0 && (
              <section className="section">
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-teal-700">
                  <Code className="h-3.5 w-3.5" />
                  Skills
                </h3>
                <div className="space-y-3">
                  {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                    <div key={category}>
                      <h4 className="mb-1 text-xs font-semibold text-gray-700 capitalize">
                        {category}
                      </h4>
                      <div className="space-y-0.5 text-xs text-gray-700">
                        {categorySkills.map((skill, index) => (
                          <div key={index}>• {skill.skill_name}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {education.length > 0 && (
              <section className="section">
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-teal-700">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Education
                </h3>
                <div className="space-y-3 text-xs">
                  {education.map((edu, index) => (
                    <div key={index}>
                      <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                      <div className="text-gray-700">{edu.field_of_study}</div>
                      <div className="text-gray-600">{edu.institution_name}</div>
                      <div className="mt-0.5 text-gray-500">
                        {formatDateRange(edu.start_date, edu.end_date, edu.is_current)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <section className="section">
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-teal-700">
                  <Award className="h-3.5 w-3.5" />
                  Certifications
                </h3>
                <div className="space-y-2 text-xs">
                  {certifications.map((cert, index) => (
                    <div key={index}>
                      <h4 className="font-semibold text-gray-900">
                        {cert.certification_name}
                      </h4>
                      <div className="text-gray-600">{cert.issuing_organization}</div>
                      <div className="text-gray-500">{formatDate(cert.issue_date)}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <section className="section">
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-teal-700">
                  <Languages className="h-3.5 w-3.5" />
                  Languages
                </h3>
                <div className="space-y-1 text-xs text-gray-700">
                  {languages.map((lang, index) => (
                    <div key={index}>
                      <span className="font-medium">{lang.language_name}:</span>{" "}
                      {lang.proficiency}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </aside>

          {/* Main Content (75%) */}
          <main className="w-3/4 space-y-5 px-8 py-6 print:px-6 print:py-4">
            {/* Professional Summary */}
            {profile?.professional_summary && (
              <section className="section">
                <h3 className="mb-2 border-b-2 border-teal-600 pb-1 text-sm font-bold uppercase tracking-wide text-teal-700">
                  Profile
                </h3>
                <p className="text-xs leading-relaxed text-gray-800">
                  {profile.professional_summary}
                </p>
              </section>
            )}

            {/* Work Experience */}
            {workExperiences.length > 0 && (
              <section className="section">
                <h3 className="mb-3 flex items-center gap-2 border-b-2 border-teal-600 pb-1 text-sm font-bold uppercase tracking-wide text-teal-700">
                  <Briefcase className="h-4 w-4" />
                  Experience
                </h3>
                <div className="space-y-4">
                  {workExperiences.map((work, index) => (
                    <div key={index}>
                      <div className="mb-1 flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">
                            {work.job_title}
                          </h4>
                          <div className="text-xs font-medium text-teal-700">
                            {work.company_name}
                            {work.location && ` · ${work.location}`}
                            {work.is_remote && " (Remote)"}
                          </div>
                        </div>
                        <span className="whitespace-nowrap text-xs text-gray-600">
                          {formatDateRange(work.start_date, work.end_date, work.is_current)}
                        </span>
                      </div>
                      {work.description && (
                        <p className="mb-1 text-xs text-gray-700">{work.description}</p>
                      )}
                      {work.achievements && work.achievements.length > 0 && (
                        <ul className="space-y-0.5 text-xs text-gray-700">
                          {work.achievements.map((achievement, achIndex) => (
                            <li key={achIndex} className="ml-3 list-disc">
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

            {/* Projects */}
            {projects.length > 0 && (
              <section className="section">
                <h3 className="mb-3 border-b-2 border-teal-600 pb-1 text-sm font-bold uppercase tracking-wide text-teal-700">
                  Projects
                </h3>
                <div className="space-y-3">
                  {projects.map((project, index) => (
                    <div key={index}>
                      <div className="mb-0.5 flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">
                            {project.project_name}
                          </h4>
                          {project.role && (
                            <div className="text-xs text-teal-700">{project.role}</div>
                          )}
                        </div>
                        {project.start_date && (
                          <span className="whitespace-nowrap text-xs text-gray-600">
                            {formatDateRange(
                              project.start_date,
                              project.end_date,
                              project.is_ongoing,
                            )}
                          </span>
                        )}
                      </div>
                      {project.description && (
                        <p className="mb-0.5 text-xs text-gray-700">{project.description}</p>
                      )}
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Tech:</span>{" "}
                          {project.technologies.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
