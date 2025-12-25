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

export function ProfessionalTemplate({
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
      const category = skill.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(skill);
      return acc;
    },
    {} as Record<string, typeof skills>,
  );

  return (
    <div className="cv-professional-template min-h-screen bg-white text-black">
      <style jsx global>{`
        @media print {
          .cv-professional-template {
            font-size: 10pt;
          }
          .cv-professional-template .section {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="mx-auto max-w-4xl p-8 print:p-6">
        {/* Header */}
        <header className="mb-6 border-b-2 border-black pb-4">
          <h1 className="mb-1 text-3xl font-bold uppercase tracking-wide">
            {fullName}
          </h1>
          {profile?.professional_title && (
            <h2 className="mb-3 text-lg font-medium">
              {profile.professional_title}
            </h2>
          )}

          {/* Contact Info Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {profile?.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                <a
                  href={`mailto:${profile.email}`}
                  className="hover:underline"
                >
                  {profile.email}
                </a>
              </div>
            )}
            {profile?.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                <a href={`tel:${profile.phone}`} className="hover:underline">
                  {profile.phone}
                </a>
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
          <section className="section mb-6">
            <h3 className="mb-3 border-b border-gray-300 pb-1 text-sm font-bold uppercase tracking-wider">
              Professional Summary
            </h3>
            <p className="text-sm leading-relaxed">
              {profile.professional_summary}
            </p>
          </section>
        )}

        {/* Work Experience */}
        {workExperiences.length > 0 && (
          <section className="section mb-6">
            <h3 className="mb-3 border-b border-gray-300 pb-1 text-sm font-bold uppercase tracking-wider">
              Professional Experience
            </h3>
            <div className="space-y-5">
              {workExperiences.map((work, index) => (
                <div key={index}>
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{work.job_title}</h4>
                      <div className="text-sm">
                        <span className="font-medium">{work.company_name}</span>
                        {work.location && (
                          <span>
                            {" "}
                            • {work.location}
                            {work.is_remote && " (Remote)"}
                          </span>
                        )}
                        {work.employment_type && (
                          <span> • {work.employment_type}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      {formatDateRange(
                        work.start_date,
                        work.end_date,
                        work.is_current,
                      )}
                    </div>
                  </div>
                  {work.description && (
                    <p className="mb-2 text-sm">{work.description}</p>
                  )}
                  {work.achievements && work.achievements.length > 0 && (
                    <ul className="list-inside list-disc space-y-1 text-sm">
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
          <section className="section mb-6">
            <h3 className="mb-3 border-b border-gray-300 pb-1 text-sm font-bold uppercase tracking-wider">
              Education
            </h3>
            <div className="space-y-4">
              {education.map((edu, index) => (
                <div key={index}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">
                        {edu.degree} in {edu.field_of_study}
                      </h4>
                      <div className="text-sm">{edu.institution_name}</div>
                      {edu.gpa && (
                        <div className="text-sm">GPA: {edu.gpa}</div>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      {formatDateRange(
                        edu.start_date,
                        edu.end_date,
                        edu.is_current,
                      )}
                    </div>
                  </div>
                  {edu.description && (
                    <p className="mt-1 text-sm">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <section className="section mb-6">
            <h3 className="mb-3 border-b border-gray-300 pb-1 text-sm font-bold uppercase tracking-wider">
              Skills
            </h3>
            <div className="space-y-3">
              {Object.entries(skillsByCategory).map(
                ([category, categorySkills]) => (
                  <div key={category} className="text-sm">
                    <span className="font-semibold">{category}:</span>{" "}
                    {categorySkills.map((skill, index) => (
                      <span key={index}>
                        {skill.skill_name}
                        {skill.proficiency_level &&
                          ` (${skill.proficiency_level})`}
                        {index < categorySkills.length - 1 && ", "}
                      </span>
                    ))}
                  </div>
                ),
              )}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section className="section mb-6">
            <h3 className="mb-3 border-b border-gray-300 pb-1 text-sm font-bold uppercase tracking-wider">
              Projects
            </h3>
            <div className="space-y-4">
              {projects.map((project, index) => (
                <div key={index}>
                  <div className="mb-1 flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">
                        {project.project_name}
                        {project.role && (
                          <span className="ml-2 text-sm font-normal text-gray-600">
                            ({project.role})
                          </span>
                        )}
                      </h4>
                    </div>
                    {project.start_date && (
                      <div className="text-right text-sm text-gray-600">
                        {formatDateRange(
                          project.start_date,
                          project.end_date,
                          project.is_ongoing,
                        )}
                      </div>
                    )}
                  </div>
                  {project.description && (
                    <p className="mb-2 text-sm">{project.description}</p>
                  )}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Technologies:</span>{" "}
                      {project.technologies.join(", ")}
                    </div>
                  )}
                  {project.project_url && (
                    <a
                      href={project.project_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-sm underline"
                    >
                      View Project
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <section className="section mb-6">
            <h3 className="mb-3 border-b border-gray-300 pb-1 text-sm font-bold uppercase tracking-wider">
              Certifications
            </h3>
            <div className="space-y-3">
              {certifications.map((cert, index) => (
                <div key={index}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">
                        {cert.certification_name}
                      </h4>
                      <div className="text-sm">
                        {cert.issuing_organization}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      {formatDate(cert.issue_date)}
                      {cert.expiration_date && (
                        <div>Expires: {formatDate(cert.expiration_date)}</div>
                      )}
                    </div>
                  </div>
                  {cert.credential_url && (
                    <a
                      href={cert.credential_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-sm underline"
                    >
                      View Credential
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <section className="section mb-6">
            <h3 className="mb-3 border-b border-gray-300 pb-1 text-sm font-bold uppercase tracking-wider">
              Languages
            </h3>
            <div className="text-sm">
              {languages.map((lang, index) => (
                <span key={index}>
                  {lang.language_name} ({lang.proficiency})
                  {index < languages.length - 1 && " • "}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
