/**
 * Academic PDF Template
 * Research-focused design with blue accents and centered headers
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";
import type { PDFTemplateProps } from "./types";
import {
  formatDateRange,
  getFullName,
  getLocation,
  getPlatformName,
} from "./utils";

const colors = {
  primary: "#1e40af",
  secondary: "#3b82f6",
  accent: "#60a5fa",
  dark: "#1e293b",
  text: "#334155",
  muted: "#64748b",
  light: "#f1f5f9",
  border: "#cbd5e1",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 10,
    padding: 40,
    backgroundColor: colors.white,
    color: colors.text,
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  title: {
    fontSize: 12,
    color: colors.primary,
    marginBottom: 10,
    fontStyle: "italic",
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 15,
    fontSize: 9,
  },
  contactItem: {
    color: colors.muted,
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.6,
    color: colors.text,
    marginBottom: 20,
    textAlign: "justify",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 10,
    textTransform: "uppercase",
    textAlign: "center",
    letterSpacing: 1,
  },
  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    paddingHorizontal: 15,
    fontSize: 11,
    fontWeight: "bold",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  experienceItem: {
    marginBottom: 12,
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.dark,
  },
  dateRange: {
    fontSize: 9,
    color: colors.muted,
    fontStyle: "italic",
  },
  company: {
    fontSize: 10,
    color: colors.secondary,
    marginBottom: 4,
  },
  description: {
    fontSize: 9,
    color: colors.text,
    lineHeight: 1.5,
    marginBottom: 4,
    textAlign: "justify",
  },
  achievementsList: {
    paddingLeft: 15,
  },
  achievement: {
    fontSize: 9,
    color: colors.text,
    marginBottom: 2,
  },
  educationItem: {
    marginBottom: 12,
  },
  degree: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.dark,
  },
  institution: {
    fontSize: 10,
    color: colors.secondary,
    fontStyle: "italic",
  },
  educationDetails: {
    fontSize: 9,
    color: colors.muted,
    marginTop: 2,
  },
  twoColumnSection: {
    flexDirection: "row",
    gap: 30,
  },
  column: {
    flex: 1,
  },
  skillCategory: {
    marginBottom: 8,
  },
  skillCategoryTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 3,
  },
  skillList: {
    fontSize: 9,
    color: colors.text,
    lineHeight: 1.4,
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    fontSize: 9,
  },
  languageName: {
    color: colors.dark,
  },
  languageLevel: {
    color: colors.muted,
    fontStyle: "italic",
  },
  publicationItem: {
    marginBottom: 8,
  },
  publicationTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.dark,
  },
  publicationDetails: {
    fontSize: 8,
    color: colors.muted,
    fontStyle: "italic",
  },
  projectItem: {
    marginBottom: 10,
  },
  projectName: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.dark,
  },
  projectRole: {
    fontSize: 9,
    color: colors.secondary,
    fontStyle: "italic",
    marginBottom: 2,
  },
  technologies: {
    fontSize: 8,
    color: colors.muted,
  },
  certItem: {
    marginBottom: 6,
  },
  certName: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.dark,
  },
  certOrg: {
    fontSize: 8,
    color: colors.muted,
    fontStyle: "italic",
  },
  link: {
    color: colors.secondary,
    textDecoration: "none",
  },
});

export function AcademicPDF({
  profile,
  socialLinks,
  workExperiences,
  education,
  skills,
  projects,
  certifications,
  languages,
}: PDFTemplateProps) {
  if (!profile) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>No profile data available</Text>
        </Page>
      </Document>
    );
  }

  const fullName = getFullName(profile);
  const location = getLocation(profile.address_city, profile.address_country);

  // Group skills by category if available
  const groupedSkills = skills.reduce(
    (acc, skill) => {
      const category = skill.category || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(skill.skill_name);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{fullName}</Text>
          {profile.professional_title && (
            <Text style={styles.title}>{profile.professional_title}</Text>
          )}
          <View style={styles.contactRow}>
            {profile.email && (
              <Text style={styles.contactItem}>{profile.email}</Text>
            )}
            {profile.phone && (
              <Text style={styles.contactItem}>{profile.phone}</Text>
            )}
            {location && <Text style={styles.contactItem}>{location}</Text>}
            {socialLinks.slice(0, 2).map((link, index) => (
              <Link key={index} src={link.url} style={styles.link}>
                {getPlatformName(link.platform)}
              </Link>
            ))}
          </View>
        </View>

        {/* Summary */}
        {profile.professional_summary && (
          <View style={styles.section}>
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Research Interests</Text>
              <View style={styles.dividerLine} />
            </View>
            <Text style={styles.summary}>{profile.professional_summary}</Text>
          </View>
        )}

        {/* Education - Prioritized for academic CV */}
        {education.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Education</Text>
              <View style={styles.dividerLine} />
            </View>
            {education.map((edu, index) => (
              <View key={index} style={styles.educationItem}>
                <View style={styles.experienceHeader}>
                  <Text style={styles.degree}>
                    {edu.degree} in {edu.field_of_study}
                  </Text>
                  <Text style={styles.dateRange}>
                    {formatDateRange(edu.start_date, edu.end_date, edu.is_current)}
                  </Text>
                </View>
                <Text style={styles.institution}>{edu.institution_name}</Text>
                {(edu.gpa || edu.description) && (
                  <Text style={styles.educationDetails}>
                    {edu.gpa && `GPA: ${edu.gpa}`}
                    {edu.gpa && edu.description && " · "}
                    {edu.description}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Experience */}
        {workExperiences.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Professional Experience</Text>
              <View style={styles.dividerLine} />
            </View>
            {workExperiences.map((exp, index) => (
              <View key={index} style={styles.experienceItem}>
                <View style={styles.experienceHeader}>
                  <Text style={styles.jobTitle}>{exp.job_title}</Text>
                  <Text style={styles.dateRange}>
                    {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
                  </Text>
                </View>
                <Text style={styles.company}>
                  {exp.company_name}
                  {exp.location && `, ${exp.location}`}
                </Text>
                {exp.description && (
                  <Text style={styles.description}>{exp.description}</Text>
                )}
                {exp.achievements && exp.achievements.length > 0 && (
                  <View style={styles.achievementsList}>
                    {exp.achievements.map((achievement, idx) => (
                      <Text key={idx} style={styles.achievement}>
                        • {achievement}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Projects (as Publications/Research) */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Research & Projects</Text>
              <View style={styles.dividerLine} />
            </View>
            {projects.map((proj, index) => (
              <View key={index} style={styles.projectItem}>
                <Text style={styles.projectName}>{proj.project_name}</Text>
                {proj.role && (
                  <Text style={styles.projectRole}>{proj.role}</Text>
                )}
                {proj.description && (
                  <Text style={styles.description}>{proj.description}</Text>
                )}
                {proj.technologies && proj.technologies.length > 0 && (
                  <Text style={styles.technologies}>
                    Methods/Tools: {proj.technologies.join(", ")}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Two Column: Skills & Languages */}
        <View style={styles.twoColumnSection}>
          {skills.length > 0 && (
            <View style={styles.column}>
              <View style={styles.sectionDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Skills</Text>
                <View style={styles.dividerLine} />
              </View>
              {Object.entries(groupedSkills).map(([category, skillList], index) => (
                <View key={index} style={styles.skillCategory}>
                  <Text style={styles.skillCategoryTitle}>{category}:</Text>
                  <Text style={styles.skillList}>{skillList.join(", ")}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.column}>
            {languages.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Languages</Text>
                  <View style={styles.dividerLine} />
                </View>
                {languages.map((lang, index) => (
                  <View key={index} style={styles.languageItem}>
                    <Text style={styles.languageName}>{lang.language_name}</Text>
                    <Text style={styles.languageLevel}>{lang.proficiency}</Text>
                  </View>
                ))}
              </View>
            )}

            {certifications.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Certifications</Text>
                  <View style={styles.dividerLine} />
                </View>
                {certifications.map((cert, index) => (
                  <View key={index} style={styles.certItem}>
                    <Text style={styles.certName}>{cert.certification_name}</Text>
                    <Text style={styles.certOrg}>
                      {cert.issuing_organization}, {formatDateRange(cert.issue_date, null)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}