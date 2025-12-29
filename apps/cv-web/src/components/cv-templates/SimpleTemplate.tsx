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
 * Simple Template
 * Ultra-minimal monochrome design with single column layout.
 * Black and gray only, maximum readability, clean typography.
 * Best for: Conservative roles, traditional industries, maximum ATS compatibility.
 */
export function SimpleTemplate({
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
    <div className="cv-simple-template min-h-screen bg-white text-black">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .cv-simple-template {
          font-family: 'Inter', -apple-system, sans-serif;
        }
        @media print {
          .cv-simple-template {
            font-size: 10pt;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .cv-simple-template .section {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="mx-auto max-w-4xl px-12 py-12 print:px-8 print:py-8">
        {/* Header */}
        <header className="mb-8 border-b-2 border-black pb-6">
          <h1 className="mb-2 text-4xl font-bold uppercase tracking-tight">
            {fullName}
          </h1>
          {profile?.professional_title && (
            <h2 className="mb-4 text-xl font-medium text-gray-700">
              {profile.professional_title}
            </h2>
          )}

          {/* Contact Information */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
            {profile?.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                <a href={`mailto:${profile.email}`} className="hover:underline">
                  {profile.email}
                </a>
              </div>
            )}
            {profile?.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                <span>{profile.phone}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                <span>{location}</span>
              </div>
            )}
            {socialLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-1.5">
                {getSocialIcon(link.platform)}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {link.platform}
                </a>
              </div>
            ))}
          </div>
        </header>

        {/* Professional Summary */}
        {profile?.professional_summary && (
          <section className="section mb-8">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-black">
              Professional Summary
            </h3>
            <p className="text-sm leading-relaxed text-gray-800">
              {profile.professional_summary}
            </p>
          </section>
        )}

        {/* Work Experience */}
        {workExperiences.length > 0 && (
          <section className="section mb-8">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-black">
              Work Experience
            </h3>
            <div className="space-y-5">
              {workExperiences.map((work, index) => (
                <div key={index}>
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-semibold">{work.job_title}</h4>
                      <div className="text-sm text-gray-700">
                        {work.company_name}
                        {work.location && (
                          <>
                            {" "}
                            · {work.location}
                            {work.is_remote && " (Remote)"}
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">
                      {formatDateRange(work.start_date, work.end_date, work.is_current)}
                    </span>
                  </div>
                  {work.description && (
                    <p className="mb-2 text-sm text-gray-800">{work.description}</p>
                  )}
                  {work.achievements && work.achievements.length > 0 && (
                    <ul className="space-y-1 text-sm text-gray-800">
                      {work.achievements.map((achievement, achIndex) => (
                        <li key={achIndex} className="ml-4 list-disc">
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
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-black">
              Education
            </h3>
            <div className="space-y-4">
              {education.map((edu, index) => (
                <div key={index}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-semibold">
                        {edu.degree} in {edu.field_of_study}
                      </h4>
                      <div className="text-sm text-gray-700">
                        {edu.institution_name}
                        {edu.gpa && ` · GPA: ${edu.gpa}`}
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">
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
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-black">
              Skills
            </h3>
            <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-gray-800">
              {skills.map((skill, index) => (
                <span key={index}>
                  {skill.skill_name}
                  {index < skills.length - 1 && " ·"}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section className="section mb-8">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-black">
              Projects
            </h3>
            <div className="space-y-4">
              {projects.map((project, index) => (
                <div key={index}>
                  <div className="mb-1 flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-semibold">
                        {project.project_name}
                      </h4>
                      {project.role && (
                        <div className="text-sm text-gray-700">{project.role}</div>
                      )}
                    </div>
                    {project.start_date && (
                      <span className="text-sm text-gray-600">
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

        {/* Certifications */}
        {certifications.length > 0 && (
          <section className="section mb-8">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-black">
              Certifications
            </h3>
            <div className="space-y-3">
              {certifications.map((cert, index) => (
                <div key={index}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-semibold">
                        {cert.certification_name}
                      </h4>
                      <div className="text-sm text-gray-700">
                        {cert.issuing_organization}
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">
                      {formatDate(cert.issue_date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <section className="section">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-black">
              Languages
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-800">
              {languages.map((lang, index) => (
                <div key={index}>
                  <span className="font-medium">{lang.language_name}</span>
                  <span className="text-gray-600"> - {lang.proficiency}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
