"use client";

import { Mail, Phone, MapPin, Globe, Linkedin, Github, BookOpen, GraduationCap, Award, FileText } from "lucide-react";
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
 * Academic Template
 * Academic/research focused design with deep blue color scheme.
 * Emphasis on education, publications, and research experience.
 * Best for: Researchers, academics, PhD candidates, scientific positions.
 */
export function AcademicTemplate({
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
    <div className="cv-academic-template min-h-screen bg-white text-gray-900">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Lato:wght@400;700&display=swap');

        .cv-academic-template {
          font-family: 'Lato', -apple-system, sans-serif;
        }
        .cv-academic-template h1,
        .cv-academic-template h2,
        .cv-academic-template h3 {
          font-family: 'Merriweather', serif;
        }
        @media print {
          .cv-academic-template {
            font-size: 10pt;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .cv-academic-template .section {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="mx-auto max-w-4xl px-12 py-10 print:px-8 print:py-8">
        {/* Header */}
        <header className="mb-8 border-b-2 border-blue-800 pb-6 text-center">
          <h1 className="mb-2 text-3xl font-black text-blue-900">{fullName}</h1>
          {profile?.professional_title && (
            <h2 className="mb-4 text-lg font-normal italic text-blue-700">
              {profile.professional_title}
            </h2>
          )}
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-gray-700">
            {profile?.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${profile.email}`} className="hover:text-blue-800">
                  {profile.email}
                </a>
              </div>
            )}
            {profile?.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                <span>{profile.phone}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
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
                  className="hover:text-blue-800"
                >
                  {link.platform}
                </a>
              </div>
            ))}
          </div>
        </header>

        {/* Research Summary */}
        {profile?.professional_summary && (
          <section className="section mb-8">
            <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-blue-900">
              <FileText className="h-5 w-5" />
              Research Summary
            </h3>
            <p className="text-sm leading-relaxed text-gray-800">
              {profile.professional_summary}
            </p>
          </section>
        )}

        {/* Education - Prioritized for academic CVs */}
        {education.length > 0 && (
          <section className="section mb-8">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-blue-900">
              <GraduationCap className="h-5 w-5" />
              Education
            </h3>
            <div className="space-y-5">
              {education.map((edu, index) => (
                <div key={index}>
                  <div className="mb-1 flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-gray-900">{edu.degree}</h4>
                      <div className="text-sm font-medium text-blue-800">
                        {edu.field_of_study}
                      </div>
                      <div className="text-sm text-gray-700">
                        {edu.institution_name}
                        {edu.gpa && ` · GPA: ${edu.gpa}`}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      {formatDateRange(edu.start_date, edu.end_date, edu.is_current)}
                    </span>
                  </div>
                  {edu.description && (
                    <p className="mt-2 text-sm italic text-gray-700">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Research Experience / Work Experience */}
        {workExperiences.length > 0 && (
          <section className="section mb-8">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-blue-900">
              <BookOpen className="h-5 w-5" />
              Research Experience
            </h3>
            <div className="space-y-5">
              {workExperiences.map((work, index) => (
                <div key={index}>
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-gray-900">
                        {work.job_title}
                      </h4>
                      <div className="text-sm font-medium text-blue-800">
                        {work.company_name}
                        {work.location && ` · ${work.location}`}
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

        {/* Research Projects / Publications */}
        {projects.length > 0 && (
          <section className="section mb-8">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-blue-900">
              <FileText className="h-5 w-5" />
              Research Projects
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
                        <div className="text-sm italic text-blue-800">{project.role}</div>
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
                      <span className="font-medium">Methodologies:</span>{" "}
                      {project.technologies.join(", ")}
                    </div>
                  )}
                  {project.project_url && (
                    <a
                      href={project.project_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-700 hover:underline"
                    >
                      View Publication
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications & Awards */}
        {certifications.length > 0 && (
          <section className="section mb-8">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-blue-900">
              <Award className="h-5 w-5" />
              Certifications & Awards
            </h3>
            <div className="space-y-3">
              {certifications.map((cert, index) => (
                <div key={index}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        {cert.certification_name}
                      </h4>
                      <div className="text-sm text-gray-700">
                        {cert.issuing_organization}
                        {cert.credential_id && ` · ID: ${cert.credential_id}`}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      {formatDate(cert.issue_date)}
                    </span>
                  </div>
                  {cert.credential_url && (
                    <a
                      href={cert.credential_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-700 hover:underline"
                    >
                      View Credential
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills / Technical Competencies */}
        {skills.length > 0 && (
          <section className="section mb-8">
            <h3 className="mb-3 text-base font-bold text-blue-900">
              Technical Competencies
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-800">
              {skills.map((skill, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-800" />
                  {skill.skill_name}
                  {skill.proficiency_level && (
                    <span className="text-gray-600">({skill.proficiency_level})</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <section className="section">
            <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-blue-900">
              <Globe className="h-5 w-5" />
              Languages
            </h3>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-800">
              {languages.map((lang, index) => (
                <div key={index}>
                  <span className="font-semibold">{lang.language_name}:</span>{" "}
                  <span className="text-gray-700">{lang.proficiency}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
