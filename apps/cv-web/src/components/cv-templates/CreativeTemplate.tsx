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

export function CreativeTemplate({
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
    <div className="cv-creative-template min-h-screen bg-white text-gray-900">
      <style jsx global>{`
        @media print {
          .cv-creative-template {
            font-size: 10pt;
          }
          .cv-creative-template .section {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .cv-creative-template .header-gradient {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Bold Header with Gradient */}
      <header className="header-gradient bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 px-8 py-12 text-white print:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-start gap-6">
            {/* Profile Photo */}
            {profile?.profile_photo_url && (
              <div className="flex-shrink-0">
                <img
                  src={profile.profile_photo_url}
                  alt={fullName}
                  className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-lg"
                />
              </div>
            )}

            {/* Name and Title */}
            <div className="flex-1">
              <h1 className="mb-2 text-4xl font-bold">{fullName}</h1>
              {profile?.professional_title && (
                <h2 className="mb-4 text-xl font-light opacity-95">
                  {profile.professional_title}
                </h2>
              )}

              {/* Contact Info */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {profile?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <a
                      href={`mailto:${profile.email}`}
                      className="hover:underline"
                    >
                      {profile.email}
                    </a>
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${profile.phone}`} className="hover:underline">
                      {profile.phone}
                    </a>
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
                      className="hover:underline"
                    >
                      {link.platform}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Two-Column Layout */}
      <div className="mx-auto max-w-5xl px-8 py-8 print:p-6">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Left Column - Sidebar */}
          <div className="md:col-span-1">
            {/* Professional Summary */}
            {profile?.professional_summary && (
              <div className="section mb-8">
                <h3 className="mb-3 text-lg font-bold text-purple-600">
                  About Me
                </h3>
                <p className="text-sm leading-relaxed text-gray-700">
                  {profile.professional_summary}
                </p>
              </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div className="section mb-8">
                <h3 className="mb-4 text-lg font-bold text-purple-600">
                  Skills
                </h3>
                <div className="space-y-4">
                  {Object.entries(skillsByCategory).map(
                    ([category, categorySkills]) => (
                      <div key={category}>
                        {Object.keys(skillsByCategory).length > 1 && (
                          <h4 className="mb-2 text-sm font-semibold text-gray-800">
                            {category}
                          </h4>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {categorySkills.map((skill, index) => (
                            <span
                              key={index}
                              className="rounded-full bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 text-xs font-medium text-purple-700"
                            >
                              {skill.skill_name}
                            </span>
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
              <div className="section mb-8">
                <h3 className="mb-4 text-lg font-bold text-purple-600">
                  Languages
                </h3>
                <div className="space-y-3">
                  {languages.map((lang, index) => (
                    <div key={index}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-800">
                          {lang.language_name}
                        </span>
                        <span className="text-xs text-gray-600">
                          {lang.proficiency}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                          style={{
                            width:
                              lang.proficiency.toLowerCase() === "native"
                                ? "100%"
                                : lang.proficiency.toLowerCase() === "fluent"
                                  ? "90%"
                                  : lang.proficiency.toLowerCase() ===
                                      "advanced"
                                    ? "75%"
                                    : lang.proficiency.toLowerCase() ===
                                        "intermediate"
                                      ? "60%"
                                      : "40%",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <div className="section mb-8">
                <h3 className="mb-4 text-lg font-bold text-purple-600">
                  Certifications
                </h3>
                <div className="space-y-3">
                  {certifications.map((cert, index) => (
                    <div key={index} className="text-sm">
                      <h4 className="font-semibold text-gray-800">
                        {cert.certification_name}
                      </h4>
                      <div className="text-xs text-gray-600">
                        {cert.issuing_organization}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(cert.issue_date)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Main Content */}
          <div className="md:col-span-2">
            {/* Work Experience */}
            {workExperiences.length > 0 && (
              <div className="section mb-8">
                <h3 className="mb-5 text-xl font-bold text-purple-600">
                  Work Experience
                </h3>
                <div className="space-y-6">
                  {workExperiences.map((work, index) => (
                    <div
                      key={index}
                      className="relative border-l-4 border-purple-500 pl-6"
                    >
                      <div className="absolute -left-2.5 top-0 h-4 w-4 rounded-full bg-purple-500" />
                      <div className="mb-2">
                        <h4 className="text-base font-bold text-gray-900">
                          {work.job_title}
                        </h4>
                        <div className="text-sm font-medium text-purple-600">
                          {work.company_name}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>
                            {formatDateRange(
                              work.start_date,
                              work.end_date,
                              work.is_current,
                            )}
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

            {/* Projects */}
            {projects.length > 0 && (
              <div className="section mb-8">
                <h3 className="mb-5 text-xl font-bold text-purple-600">
                  Projects
                </h3>
                <div className="space-y-5">
                  {projects.map((project, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-purple-200 bg-purple-50 p-4"
                    >
                      <div className="mb-2">
                        <h4 className="text-base font-bold text-gray-900">
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
                        <p className="mb-3 text-sm text-gray-700">
                          {project.description}
                        </p>
                      )}
                      {project.technologies &&
                        project.technologies.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-2">
                            {project.technologies.map((tech, techIndex) => (
                              <span
                                key={techIndex}
                                className="rounded bg-purple-600 px-2 py-1 text-xs text-white"
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
                          className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:underline"
                        >
                          <Globe className="h-3 w-3" />
                          View Project
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {education.length > 0 && (
              <div className="section mb-8">
                <h3 className="mb-5 text-xl font-bold text-purple-600">
                  Education
                </h3>
                <div className="space-y-4">
                  {education.map((edu, index) => (
                    <div
                      key={index}
                      className="relative border-l-4 border-pink-500 pl-6"
                    >
                      <div className="absolute -left-2.5 top-0 h-4 w-4 rounded-full bg-pink-500" />
                      <h4 className="font-bold text-gray-900">
                        {edu.degree} in {edu.field_of_study}
                      </h4>
                      <div className="text-sm font-medium text-pink-600">
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
          </div>
        </div>
      </div>
    </div>
  );
}
