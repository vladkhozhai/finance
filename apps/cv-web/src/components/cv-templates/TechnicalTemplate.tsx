"use client";

import { Mail, Phone, MapPin, Globe, Linkedin, Github, ExternalLink, Terminal, Code2 } from "lucide-react";
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
 * Technical Template
 * Developer-focused design with code-like styling, monospace fonts, and tech aesthetics.
 * Best for: Software engineers, developers, DevOps, system architects.
 */
export function TechnicalTemplate({
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

  const categoryLabels: Record<string, string> = {
    programming: "Languages",
    frameworks: "Frameworks",
    tools: "Tools & DevOps",
    "soft-skills": "Soft Skills",
    languages: "Languages",
    other: "Other",
  };

  return (
    <div className="cv-technical-template min-h-screen bg-slate-950 text-slate-100">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap');

        .cv-technical-template {
          font-family: 'Inter', -apple-system, sans-serif;
        }
        .cv-technical-template .mono {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }
        @media print {
          .cv-technical-template {
            font-size: 9pt;
            background: #0f172a;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .cv-technical-template .section {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="mx-auto max-w-4xl px-8 py-8 print:px-6 print:py-6">
        {/* Terminal-style Header */}
        <header className="mb-8 rounded-lg border border-slate-800 bg-slate-900">
          {/* Terminal bar */}
          <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="mono ml-4 text-xs text-slate-500">~/portfolio/resume.json</span>
          </div>

          <div className="p-6">
            <div className="mono mb-4 text-sm text-slate-500">
              <span className="text-emerald-400">const</span>{" "}
              <span className="text-cyan-400">developer</span> = {"{"}
            </div>

            <div className="pl-6">
              <h1 className="mono mb-1 text-2xl font-semibold text-white">
                <span className="text-slate-500">&quot;</span>
                {fullName}
                <span className="text-slate-500">&quot;</span>
              </h1>
              {profile?.professional_title && (
                <h2 className="mono mb-4 text-base text-emerald-400">
                  <span className="text-slate-500">// </span>
                  {profile.professional_title}
                </h2>
              )}

              {/* Contact as code comments */}
              <div className="mono space-y-1 text-xs text-slate-400">
                {profile?.email && (
                  <div>
                    <span className="text-slate-500">email:</span>{" "}
                    <a href={`mailto:${profile.email}`} className="text-cyan-400 hover:underline">
                      &quot;{profile.email}&quot;
                    </a>
                    <span className="text-slate-600">,</span>
                  </div>
                )}
                {profile?.phone && (
                  <div>
                    <span className="text-slate-500">phone:</span>{" "}
                    <span className="text-yellow-400">&quot;{profile.phone}&quot;</span>
                    <span className="text-slate-600">,</span>
                  </div>
                )}
                {location && (
                  <div>
                    <span className="text-slate-500">location:</span>{" "}
                    <span className="text-yellow-400">&quot;{location}&quot;</span>
                    <span className="text-slate-600">,</span>
                  </div>
                )}
                {socialLinks.length > 0 && (
                  <div>
                    <span className="text-slate-500">links:</span> [
                    {socialLinks.map((link, index) => (
                      <span key={index}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:underline"
                        >
                          &quot;{link.platform}&quot;
                        </a>
                        {index < socialLinks.length - 1 && <span className="text-slate-600">, </span>}
                      </span>
                    ))}
                    ]
                  </div>
                )}
              </div>
            </div>

            <div className="mono mt-4 text-sm text-slate-500">{"}"}</div>
          </div>
        </header>

        {/* About / Summary */}
        {profile?.professional_summary && (
          <section className="section mb-8">
            <h3 className="mono mb-3 flex items-center gap-2 text-sm font-medium text-emerald-400">
              <Terminal className="h-4 w-4" />
              README.md
            </h3>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-sm leading-relaxed text-slate-300">
                {profile.professional_summary}
              </p>
            </div>
          </section>
        )}

        {/* Skills / Tech Stack */}
        {skills.length > 0 && (
          <section className="section mb-8">
            <h3 className="mono mb-3 flex items-center gap-2 text-sm font-medium text-emerald-400">
              <Code2 className="h-4 w-4" />
              tech_stack
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                <div key={category} className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                  <h4 className="mono mb-2 text-xs font-medium text-slate-400">
                    {categoryLabels[category] || category}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {categorySkills.map((skill, index) => (
                      <span
                        key={index}
                        className="mono rounded bg-slate-800 px-2 py-1 text-xs text-cyan-400"
                      >
                        {skill.skill_name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Work Experience */}
        {workExperiences.length > 0 && (
          <section className="section mb-8">
            <h3 className="mono mb-3 flex items-center gap-2 text-sm font-medium text-emerald-400">
              <Terminal className="h-4 w-4" />
              experience.log
            </h3>
            <div className="space-y-4">
              {workExperiences.map((work, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-slate-800 bg-slate-900/50 p-4"
                >
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-medium text-white">{work.job_title}</h4>
                      <div className="mono text-sm text-cyan-400">
                        @{work.company_name}
                        {work.location && (
                          <span className="text-slate-500"> · {work.location}</span>
                        )}
                        {work.is_remote && (
                          <span className="ml-2 rounded bg-emerald-900/50 px-1.5 py-0.5 text-xs text-emerald-400">
                            remote
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="mono whitespace-nowrap text-xs text-slate-500">
                      {formatDateRange(work.start_date, work.end_date, work.is_current)}
                    </span>
                  </div>
                  {work.description && (
                    <p className="mb-2 text-sm text-slate-400">{work.description}</p>
                  )}
                  {work.achievements && work.achievements.length > 0 && (
                    <ul className="space-y-1">
                      {work.achievements.map((achievement, achIndex) => (
                        <li key={achIndex} className="mono flex items-start gap-2 text-xs text-slate-400">
                          <span className="text-emerald-400">→</span>
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
          <section className="section mb-8">
            <h3 className="mono mb-3 flex items-center gap-2 text-sm font-medium text-emerald-400">
              <Github className="h-4 w-4" />
              projects/
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {projects.map((project, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-slate-800 bg-slate-900/50 p-4"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <h4 className="font-medium text-white">
                      {project.project_name}
                      {project.project_url && (
                        <a
                          href={project.project_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 inline-flex text-slate-500 hover:text-cyan-400"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </h4>
                  </div>
                  {project.role && (
                    <div className="mono mb-1 text-xs text-cyan-400">{project.role}</div>
                  )}
                  {project.description && (
                    <p className="mb-2 text-xs text-slate-400">{project.description}</p>
                  )}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="mono rounded bg-slate-800 px-1.5 py-0.5 text-xs text-emerald-400"
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

        {/* Education & Certifications Grid */}
        <div className="grid grid-cols-2 gap-8">
          {/* Education */}
          {education.length > 0 && (
            <section className="section">
              <h3 className="mono mb-3 flex items-center gap-2 text-sm font-medium text-emerald-400">
                <Terminal className="h-4 w-4" />
                education
              </h3>
              <div className="space-y-3">
                {education.map((edu, index) => (
                  <div key={index} className="rounded border border-slate-800 bg-slate-900/50 p-3">
                    <h4 className="text-sm font-medium text-white">{edu.degree}</h4>
                    <div className="mono text-xs text-cyan-400">{edu.field_of_study}</div>
                    <div className="text-xs text-slate-400">{edu.institution_name}</div>
                    <div className="mono mt-1 text-xs text-slate-500">
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
              <h3 className="mono mb-3 flex items-center gap-2 text-sm font-medium text-emerald-400">
                <Terminal className="h-4 w-4" />
                certifications
              </h3>
              <div className="space-y-3">
                {certifications.map((cert, index) => (
                  <div key={index} className="rounded border border-slate-800 bg-slate-900/50 p-3">
                    <h4 className="text-sm font-medium text-white">
                      {cert.certification_name}
                      {cert.credential_url && (
                        <a
                          href={cert.credential_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 inline-flex text-slate-500 hover:text-cyan-400"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </h4>
                    <div className="text-xs text-slate-400">{cert.issuing_organization}</div>
                    <div className="mono mt-1 text-xs text-slate-500">
                      {formatDate(cert.issue_date)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Languages */}
        {languages.length > 0 && (
          <section className="section mt-8">
            <h3 className="mono mb-3 flex items-center gap-2 text-sm font-medium text-emerald-400">
              <Globe className="h-4 w-4" />
              languages
            </h3>
            <div className="flex flex-wrap gap-3">
              {languages.map((lang, index) => (
                <div
                  key={index}
                  className="mono rounded border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm"
                >
                  <span className="text-white">{lang.language_name}</span>
                  <span className="ml-2 text-slate-500">// {lang.proficiency}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
