"use client";

import { Mail, Phone, MapPin, Globe, Linkedin, Github, Sparkles, Palette, Code2, Award } from "lucide-react";
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
 * Designer Template
 * Bold visual design for creatives with vibrant multi-color gradient (pink/purple).
 * Asymmetric layout with skill bars and visual elements.
 * Best for: Graphic designers, UX/UI designers, creative professionals, artists.
 */
export function DesignerTemplate({
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

  // Group skills by category for visual organization
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
    <div className="cv-designer-template min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&family=Space+Grotesk:wght@500;700&display=swap');

        .cv-designer-template {
          font-family: 'Poppins', -apple-system, sans-serif;
        }
        .cv-designer-template h1,
        .cv-designer-template h2,
        .cv-designer-template h3 {
          font-family: 'Space Grotesk', sans-serif;
        }
        @media print {
          .cv-designer-template {
            font-size: 9pt;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .cv-designer-template .section {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="mx-auto max-w-4xl">
        {/* Hero Header with Gradient */}
        <header className="relative overflow-hidden bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 px-10 py-12 text-white print:px-8 print:py-10">
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-300" />
              <span className="text-sm font-medium uppercase tracking-widest text-pink-100">
                Portfolio CV
              </span>
            </div>
            <h1 className="mb-3 text-5xl font-extrabold tracking-tight">
              {fullName}
            </h1>
            {profile?.professional_title && (
              <h2 className="mb-6 text-2xl font-semibold text-purple-100">
                {profile.professional_title}
              </h2>
            )}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-purple-100">
              {profile?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{profile.email}</span>
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
                  <span>{link.platform}</span>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Left Sidebar (35%) */}
          <aside className="w-[35%] space-y-6 bg-white/80 px-6 py-8 backdrop-blur-sm print:px-5 print:py-6">
            {/* About Me */}
            {profile?.professional_summary && (
              <section className="section">
                <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-purple-900">
                  <Sparkles className="h-5 w-5 text-pink-500" />
                  About Me
                </h3>
                <p className="text-xs leading-relaxed text-gray-700">
                  {profile.professional_summary}
                </p>
              </section>
            )}

            {/* Skills with Visual Bars */}
            {skills.length > 0 && (
              <section className="section">
                <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-purple-900">
                  <Palette className="h-5 w-5 text-pink-500" />
                  Skills
                </h3>
                <div className="space-y-4">
                  {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                    <div key={category}>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                        {category}
                      </h4>
                      <div className="space-y-2">
                        {categorySkills.map((skill, index) => (
                          <div key={index}>
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="font-medium text-gray-800">
                                {skill.skill_name}
                              </span>
                              {skill.proficiency_level && (
                                <span className="text-gray-600">
                                  {skill.proficiency_level}
                                </span>
                              )}
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                                style={{
                                  width: skill.proficiency_level === "Expert"
                                    ? "100%"
                                    : skill.proficiency_level === "Advanced"
                                    ? "80%"
                                    : skill.proficiency_level === "Intermediate"
                                    ? "60%"
                                    : "40%",
                                }}
                              />
                            </div>
                          </div>
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
                <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-purple-900">
                  <Code2 className="h-5 w-5 text-pink-500" />
                  Education
                </h3>
                <div className="space-y-3 text-xs">
                  {education.map((edu, index) => (
                    <div key={index}>
                      <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                      <div className="font-medium text-purple-700">{edu.field_of_study}</div>
                      <div className="text-gray-600">{edu.institution_name}</div>
                      <div className="text-gray-500">
                        {formatDateRange(edu.start_date, edu.end_date, edu.is_current)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <section className="section">
                <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-purple-900">
                  <Globe className="h-5 w-5 text-pink-500" />
                  Languages
                </h3>
                <div className="space-y-2 text-xs">
                  {languages.map((lang, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">
                        {lang.language_name}
                      </span>
                      <span className="rounded-full bg-gradient-to-r from-pink-100 to-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        {lang.proficiency}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </aside>

          {/* Main Content (65%) */}
          <main className="w-[65%] space-y-6 px-8 py-8 print:px-6 print:py-6">
            {/* Work Experience */}
            {workExperiences.length > 0 && (
              <section className="section">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-purple-900">
                  <div className="h-1 w-1 rounded-full bg-pink-500" />
                  Experience
                </h3>
                <div className="space-y-5">
                  {workExperiences.map((work, index) => (
                    <div
                      key={index}
                      className="rounded-lg border-l-4 border-pink-500 bg-white/60 p-4 backdrop-blur-sm"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <h4 className="text-base font-bold text-gray-900">
                            {work.job_title}
                          </h4>
                          <div className="text-sm font-semibold text-purple-700">
                            {work.company_name}
                            {work.location && (
                              <span className="font-normal text-gray-600">
                                {" "}
                                · {work.location}
                                {work.is_remote && " (Remote)"}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="whitespace-nowrap rounded-full bg-gradient-to-r from-pink-100 to-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                          {formatDateRange(work.start_date, work.end_date, work.is_current)}
                        </span>
                      </div>
                      {work.description && (
                        <p className="mb-2 text-sm text-gray-700">{work.description}</p>
                      )}
                      {work.achievements && work.achievements.length > 0 && (
                        <ul className="space-y-1 text-sm text-gray-700">
                          {work.achievements.map((achievement, achIndex) => (
                            <li key={achIndex} className="flex items-start gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-pink-500" />
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
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-purple-900">
                  <div className="h-1 w-1 rounded-full bg-pink-500" />
                  Featured Projects
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {projects.map((project, index) => (
                    <div
                      key={index}
                      className="rounded-lg border-l-4 border-indigo-500 bg-white/60 p-4 backdrop-blur-sm"
                    >
                      <div className="mb-1 flex items-start justify-between">
                        <div>
                          <h4 className="text-base font-bold text-gray-900">
                            {project.project_name}
                          </h4>
                          {project.role && (
                            <div className="text-sm text-purple-700">{project.role}</div>
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
                        <p className="mb-2 text-sm text-gray-700">{project.description}</p>
                      )}
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {project.technologies.map((tech, techIndex) => (
                            <span
                              key={techIndex}
                              className="rounded-full bg-gradient-to-r from-pink-100 to-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <section className="section">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-purple-900">
                  <Award className="h-5 w-5 text-pink-500" />
                  Certifications
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {certifications.map((cert, index) => (
                    <div
                      key={index}
                      className="rounded-lg bg-white/60 p-3 backdrop-blur-sm"
                    >
                      <h4 className="text-sm font-bold text-gray-900">
                        {cert.certification_name}
                      </h4>
                      <div className="text-xs text-gray-700">
                        {cert.issuing_organization}
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatDate(cert.issue_date)}
                      </div>
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
