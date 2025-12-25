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

export function ModernTemplate({
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
    <div className="cv-modern-template min-h-screen bg-white text-gray-900">
      <style jsx global>{`
        @media print {
          .cv-modern-template {
            font-size: 10pt;
          }
          .cv-modern-template .sidebar {
            break-inside: avoid;
          }
          .cv-modern-template .section {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="flex min-h-screen">
        {/* Left Sidebar - 30% */}
        <div className="sidebar w-[30%] bg-gray-50 p-8 print:p-6">
          {/* Profile Photo */}
          {profile?.profile_photo_url && (
            <div className="mb-6">
              <img
                src={profile.profile_photo_url}
                alt={fullName}
                className="h-32 w-32 rounded-full object-cover"
              />
            </div>
          )}

          {/* Contact Information */}
          <div className="mb-8">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-blue-600">
              Contact
            </h3>
            <div className="space-y-3 text-sm">
              {profile?.email && (
                <div className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-600" />
                  <a
                    href={`mailto:${profile.email}`}
                    className="break-all text-gray-700 hover:text-blue-600"
                  >
                    {profile.email}
                  </a>
                </div>
              )}
              {profile?.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-600" />
                  <a
                    href={`tel:${profile.phone}`}
                    className="text-gray-700 hover:text-blue-600"
                  >
                    {profile.phone}
                  </a>
                </div>
              )}
              {location && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-600" />
                  <span className="text-gray-700">{location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-blue-600">
                Links
              </h3>
              <div className="space-y-3 text-sm">
                {socialLinks.map((link, index) => (
                  <div key={index} className="flex items-start gap-2">
                    {getSocialIcon(link.platform)}
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-gray-700 hover:text-blue-600"
                    >
                      {link.platform}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-blue-600">
                Skills
              </h3>
              <div className="space-y-4">
                {Object.entries(skillsByCategory).map(
                  ([category, categorySkills]) => (
                    <div key={category}>
                      {Object.keys(skillsByCategory).length > 1 && (
                        <h4 className="mb-2 text-xs font-semibold text-gray-600">
                          {category}
                        </h4>
                      )}
                      <div className="space-y-2">
                        {categorySkills.map((skill, index) => (
                          <div key={index} className="text-sm">
                            <div className="font-medium text-gray-800">
                              {skill.skill_name}
                            </div>
                            {skill.proficiency_level && (
                              <div className="text-xs text-gray-600">
                                {skill.proficiency_level}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-blue-600">
                Languages
              </h3>
              <div className="space-y-2">
                {languages.map((lang, index) => (
                  <div key={index} className="text-sm">
                    <div className="font-medium text-gray-800">
                      {lang.language_name}
                    </div>
                    <div className="text-xs text-gray-600">
                      {lang.proficiency}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Main Area - 70% */}
        <div className="w-[70%] p-8 print:p-6">
          {/* Header */}
          <div className="mb-8 border-b-2 border-blue-600 pb-6">
            <h1 className="mb-2 text-4xl font-bold text-gray-900">
              {fullName}
            </h1>
            {profile?.professional_title && (
              <h2 className="text-xl font-medium text-blue-600">
                {profile.professional_title}
              </h2>
            )}
          </div>

          {/* Professional Summary */}
          {profile?.professional_summary && (
            <div className="section mb-8">
              <h3 className="mb-4 text-lg font-semibold uppercase tracking-wider text-gray-900">
                Professional Summary
              </h3>
              <p className="text-sm leading-relaxed text-gray-700">
                {profile.professional_summary}
              </p>
            </div>
          )}

          {/* Work Experience */}
          {workExperiences.length > 0 && (
            <div className="section mb-8">
              <h3 className="mb-4 text-lg font-semibold uppercase tracking-wider text-gray-900">
                Work Experience
              </h3>
              <div className="space-y-6">
                {workExperiences.map((work, index) => (
                  <div key={index}>
                    <div className="mb-2">
                      <h4 className="text-base font-semibold text-gray-900">
                        {work.job_title}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="font-medium">
                          {work.company_name}
                        </span>
                        {work.location && (
                          <>
                            <span>•</span>
                            <span>
                              {work.location}
                              {work.is_remote && " (Remote)"}
                            </span>
                          </>
                        )}
                        {work.employment_type && (
                          <>
                            <span>•</span>
                            <span>{work.employment_type}</span>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatDateRange(
                          work.start_date,
                          work.end_date,
                          work.is_current,
                        )}
                      </div>
                    </div>
                    {work.description && (
                      <p className="mb-2 text-sm text-gray-700">
                        {work.description}
                      </p>
                    )}
                    {work.achievements && work.achievements.length > 0 && (
                      <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
                        {work.achievements.map((achievement, achIndex) => (
                          <li key={achIndex}>{achievement}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {education.length > 0 && (
            <div className="section mb-8">
              <h3 className="mb-4 text-lg font-semibold uppercase tracking-wider text-gray-900">
                Education
              </h3>
              <div className="space-y-4">
                {education.map((edu, index) => (
                  <div key={index}>
                    <h4 className="text-base font-semibold text-gray-900">
                      {edu.degree} in {edu.field_of_study}
                    </h4>
                    <div className="text-sm text-gray-700">
                      {edu.institution_name}
                    </div>
                    <div className="text-xs text-gray-600">
                      {formatDateRange(
                        edu.start_date,
                        edu.end_date,
                        edu.is_current,
                      )}
                      {edu.gpa && ` • GPA: ${edu.gpa}`}
                    </div>
                    {edu.description && (
                      <p className="mt-1 text-sm text-gray-700">
                        {edu.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <div className="section mb-8">
              <h3 className="mb-4 text-lg font-semibold uppercase tracking-wider text-gray-900">
                Projects
              </h3>
              <div className="space-y-4">
                {projects.map((project, index) => (
                  <div key={index}>
                    <div className="mb-1">
                      <h4 className="text-base font-semibold text-gray-900">
                        {project.project_name}
                        {project.role && (
                          <span className="ml-2 text-sm font-normal text-gray-600">
                            ({project.role})
                          </span>
                        )}
                      </h4>
                      {project.start_date && (
                        <div className="text-xs text-gray-600">
                          {formatDateRange(
                            project.start_date,
                            project.end_date,
                            project.is_ongoing,
                          )}
                        </div>
                      )}
                    </div>
                    {project.description && (
                      <p className="mb-2 text-sm text-gray-700">
                        {project.description}
                      </p>
                    )}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((tech, techIndex) => (
                          <span
                            key={techIndex}
                            className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    {project.project_url && (
                      <a
                        href={project.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                      >
                        View Project
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <div className="section mb-8">
              <h3 className="mb-4 text-lg font-semibold uppercase tracking-wider text-gray-900">
                Certifications
              </h3>
              <div className="space-y-3">
                {certifications.map((cert, index) => (
                  <div key={index}>
                    <h4 className="text-base font-semibold text-gray-900">
                      {cert.certification_name}
                    </h4>
                    <div className="text-sm text-gray-700">
                      {cert.issuing_organization}
                    </div>
                    <div className="text-xs text-gray-600">
                      Issued: {formatDate(cert.issue_date)}
                      {cert.expiration_date &&
                        ` • Expires: ${formatDate(cert.expiration_date)}`}
                    </div>
                    {cert.credential_url && (
                      <a
                        href={cert.credential_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                      >
                        View Credential
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
