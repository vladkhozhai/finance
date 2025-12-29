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
 * Elegant Template
 * Sophisticated serif design with gold accents on cream/white.
 * Single column with generous spacing for refined professional aesthetic.
 * Best for: Senior executives, luxury brands, creative directors, high-end consultants.
 */
export function ElegantTemplate({
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
    <div className="cv-elegant-template min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50 text-stone-800">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Lato:wght@300;400;700&display=swap');

        .cv-elegant-template {
          font-family: 'Lato', -apple-system, sans-serif;
        }
        .cv-elegant-template h1,
        .cv-elegant-template h2,
        .cv-elegant-template h3 {
          font-family: 'Cormorant Garamond', serif;
        }
        @media print {
          .cv-elegant-template {
            font-size: 10pt;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .cv-elegant-template .section {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="mx-auto max-w-3xl px-12 py-12 print:px-10 print:py-10">
        {/* Decorative Top Border */}
        <div className="mb-8 h-1 w-24 bg-gradient-to-r from-yellow-700 to-amber-600" />

        {/* Header */}
        <header className="mb-10 text-center">
          <h1 className="mb-3 text-5xl font-bold tracking-wide text-stone-900">
            {fullName}
          </h1>
          {profile?.professional_title && (
            <h2 className="mb-6 text-xl font-light tracking-widest text-yellow-800">
              {profile.professional_title.toUpperCase()}
            </h2>
          )}
          <div className="mb-2 h-px w-full bg-gradient-to-r from-transparent via-yellow-700 to-transparent" />
          <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-stone-600">
            {profile?.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-yellow-700" />
                <a href={`mailto:${profile.email}`} className="hover:text-yellow-800">
                  {profile.email}
                </a>
              </div>
            )}
            {profile?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-yellow-700" />
                <span>{profile.phone}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-yellow-700" />
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
                  className="hover:text-yellow-800"
                >
                  {link.platform}
                </a>
              </div>
            ))}
          </div>
        </header>

        {/* Professional Summary */}
        {profile?.professional_summary && (
          <section className="section mb-10">
            <h3 className="mb-4 text-center text-2xl font-semibold tracking-wide text-yellow-800">
              Profile
            </h3>
            <p className="text-center text-sm leading-relaxed text-stone-700">
              {profile.professional_summary}
            </p>
          </section>
        )}

        {/* Work Experience */}
        {workExperiences.length > 0 && (
          <section className="section mb-10">
            <h3 className="mb-6 text-center text-2xl font-semibold tracking-wide text-yellow-800">
              Professional Experience
            </h3>
            <div className="space-y-6">
              {workExperiences.map((work, index) => (
                <div key={index}>
                  <div className="mb-2 text-center">
                    <h4 className="text-lg font-semibold text-stone-900">
                      {work.job_title}
                    </h4>
                    <div className="text-base font-medium italic text-yellow-800">
                      {work.company_name}
                    </div>
                    <div className="text-sm text-stone-600">
                      {work.location && (
                        <>
                          {work.location}
                          {work.is_remote && " (Remote)"} ·{" "}
                        </>
                      )}
                      {formatDateRange(work.start_date, work.end_date, work.is_current)}
                    </div>
                  </div>
                  {work.description && (
                    <p className="mb-2 text-sm leading-relaxed text-stone-700">
                      {work.description}
                    </p>
                  )}
                  {work.achievements && work.achievements.length > 0 && (
                    <ul className="space-y-1 text-sm text-stone-700">
                      {work.achievements.map((achievement, achIndex) => (
                        <li key={achIndex} className="ml-6 list-disc leading-relaxed">
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  )}
                  {index < workExperiences.length - 1 && (
                    <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-stone-300 to-transparent" />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section className="section mb-10">
            <h3 className="mb-6 text-center text-2xl font-semibold tracking-wide text-yellow-800">
              Education
            </h3>
            <div className="space-y-5">
              {education.map((edu, index) => (
                <div key={index} className="text-center">
                  <h4 className="text-base font-semibold text-stone-900">
                    {edu.degree}
                  </h4>
                  <div className="text-sm italic text-yellow-800">
                    {edu.field_of_study}
                  </div>
                  <div className="text-sm text-stone-700">
                    {edu.institution_name}
                    {edu.gpa && ` · GPA: ${edu.gpa}`}
                  </div>
                  <div className="text-sm text-stone-600">
                    {formatDateRange(edu.start_date, edu.end_date, edu.is_current)}
                  </div>
                  {edu.description && (
                    <p className="mt-2 text-sm text-stone-700">{edu.description}</p>
                  )}
                  {index < education.length - 1 && (
                    <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-stone-300 to-transparent" />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <section className="section mb-10">
            <h3 className="mb-4 text-center text-2xl font-semibold tracking-wide text-yellow-800">
              Core Competencies
            </h3>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-stone-700">
              {skills.map((skill, index) => (
                <span key={index}>
                  {skill.skill_name}
                  {index < skills.length - 1 && (
                    <span className="ml-4 text-yellow-700">•</span>
                  )}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section className="section mb-10">
            <h3 className="mb-6 text-center text-2xl font-semibold tracking-wide text-yellow-800">
              Notable Projects
            </h3>
            <div className="space-y-5">
              {projects.map((project, index) => (
                <div key={index} className="text-center">
                  <h4 className="text-base font-semibold text-stone-900">
                    {project.project_name}
                  </h4>
                  {project.role && (
                    <div className="text-sm italic text-yellow-800">{project.role}</div>
                  )}
                  {project.start_date && (
                    <div className="text-sm text-stone-600">
                      {formatDateRange(
                        project.start_date,
                        project.end_date,
                        project.is_ongoing,
                      )}
                    </div>
                  )}
                  {project.description && (
                    <p className="mt-2 text-sm leading-relaxed text-stone-700">
                      {project.description}
                    </p>
                  )}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="mt-1 text-sm text-stone-600">
                      {project.technologies.join(" · ")}
                    </div>
                  )}
                  {index < projects.length - 1 && (
                    <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-stone-300 to-transparent" />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications & Languages Grid */}
        {(certifications.length > 0 || languages.length > 0) && (
          <div className="grid grid-cols-2 gap-10">
            {/* Certifications */}
            {certifications.length > 0 && (
              <section className="section">
                <h3 className="mb-4 text-center text-xl font-semibold tracking-wide text-yellow-800">
                  Certifications
                </h3>
                <div className="space-y-3 text-center text-sm">
                  {certifications.map((cert, index) => (
                    <div key={index}>
                      <h4 className="font-semibold text-stone-900">
                        {cert.certification_name}
                      </h4>
                      <div className="text-stone-700">{cert.issuing_organization}</div>
                      <div className="text-stone-600">{formatDate(cert.issue_date)}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <section className="section">
                <h3 className="mb-4 text-center text-xl font-semibold tracking-wide text-yellow-800">
                  Languages
                </h3>
                <div className="space-y-2 text-center text-sm text-stone-700">
                  {languages.map((lang, index) => (
                    <div key={index}>
                      <span className="font-medium">{lang.language_name}</span>
                      <span className="text-stone-600"> · {lang.proficiency}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Decorative Bottom Border */}
        <div className="mt-8 h-1 w-24 bg-gradient-to-r from-yellow-700 to-amber-600 mx-auto" />
      </div>
    </div>
  );
}
