/**
 * Technical PDF Template
 * Dark theme with monospace elements for developers and engineers
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
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
  dark: "#0f172a",
  darker: "#020617",
  primary: "#22d3ee",
  secondary: "#a5f3fc",
  text: "#e2e8f0",
  muted: "#94a3b8",
  accent: "#06b6d4",
  border: "#334155",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Courier",
    fontSize: 9,
    backgroundColor: colors.dark,
    color: colors.text,
    padding: 0,
  },
  header: {
    backgroundColor: colors.darker,
    padding: 25,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  photoContainer: {
    marginRight: 20,
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 4,
    objectFit: "cover",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  photoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 4,
    backgroundColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  photoInitials: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: "bold",
  },
  nameSection: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 4,
  },
  title: {
    fontSize: 11,
    color: colors.muted,
  },
  contactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  contactItem: {
    fontSize: 8,
    color: colors.secondary,
  },
  main: {
    flexDirection: "row",
  },
  sidebar: {
    width: "35%",
    backgroundColor: colors.darker,
    padding: 20,
  },
  content: {
    width: "65%",
    padding: 20,
  },
  sidebarSection: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  skillItem: {
    marginBottom: 6,
  },
  skillName: {
    fontSize: 8,
    color: colors.text,
    marginBottom: 2,
  },
  skillBar: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 1,
  },
  skillBarFill: {
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    fontSize: 8,
  },
  languageName: {
    color: colors.text,
  },
  languageLevel: {
    color: colors.primary,
  },
  certItem: {
    marginBottom: 8,
  },
  certName: {
    fontSize: 8,
    fontWeight: "bold",
    color: colors.text,
  },
  certOrg: {
    fontSize: 7,
    color: colors.muted,
  },
  summary: {
    fontSize: 9,
    lineHeight: 1.5,
    color: colors.muted,
    marginBottom: 18,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  section: {
    marginBottom: 18,
  },
  experienceItem: {
    marginBottom: 12,
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  jobTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.secondary,
  },
  dateRange: {
    fontSize: 8,
    color: colors.muted,
  },
  company: {
    fontSize: 9,
    color: colors.primary,
    marginBottom: 4,
  },
  description: {
    fontSize: 8,
    color: colors.muted,
    lineHeight: 1.4,
    marginBottom: 4,
  },
  achievement: {
    fontSize: 8,
    color: colors.text,
    marginBottom: 2,
    paddingLeft: 8,
  },
  achievementBullet: {
    color: colors.primary,
  },
  educationItem: {
    marginBottom: 10,
  },
  degree: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.secondary,
  },
  institution: {
    fontSize: 9,
    color: colors.muted,
  },
  projectItem: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: colors.darker,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
  },
  projectName: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.secondary,
  },
  projectRole: {
    fontSize: 8,
    color: colors.primary,
    marginBottom: 2,
  },
  technologies: {
    fontSize: 7,
    color: colors.muted,
    marginTop: 4,
  },
  techTag: {
    backgroundColor: colors.border,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    marginRight: 4,
    fontSize: 7,
    color: colors.secondary,
  },
  link: {
    color: colors.secondary,
    textDecoration: "none",
  },
});

function getSkillLevel(level?: string | null): number {
  const levels: Record<string, number> = {
    beginner: 25,
    intermediate: 50,
    advanced: 75,
    expert: 100,
  };
  return levels[level?.toLowerCase() || "intermediate"] || 50;
}

export function TechnicalPDF({
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
  const initials = `${profile.first_name[0] || ""}${profile.last_name[0] || ""}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.photoContainer}>
              {profile.profile_photo_url ? (
                <Image src={profile.profile_photo_url} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoInitials}>{initials}</Text>
                </View>
              )}
            </View>
            <View style={styles.nameSection}>
              <Text style={styles.name}>{fullName}</Text>
              {profile.professional_title && (
                <Text style={styles.title}>{profile.professional_title}</Text>
              )}
            </View>
          </View>
          <View style={styles.contactGrid}>
            {profile.email && (
              <Text style={styles.contactItem}>{profile.email}</Text>
            )}
            {profile.phone && (
              <Text style={styles.contactItem}>{profile.phone}</Text>
            )}
            {location && <Text style={styles.contactItem}>{location}</Text>}
            {socialLinks.slice(0, 3).map((link, index) => (
              <Link key={index} src={link.url} style={styles.link}>
                {getPlatformName(link.platform)}
              </Link>
            ))}
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.main}>
          {/* Sidebar */}
          <View style={styles.sidebar}>
            {/* Skills */}
            {skills.length > 0 && (
              <View style={styles.sidebarSection}>
                <Text style={styles.sectionTitle}>// Skills</Text>
                {skills.slice(0, 10).map((skill, index) => (
                  <View key={index} style={styles.skillItem}>
                    <Text style={styles.skillName}>{skill.skill_name}</Text>
                    <View style={styles.skillBar}>
                      <View
                        style={[
                          styles.skillBarFill,
                          { width: `${getSkillLevel(skill.proficiency_level)}%` },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <View style={styles.sidebarSection}>
                <Text style={styles.sectionTitle}>// Languages</Text>
                {languages.map((lang, index) => (
                  <View key={index} style={styles.languageItem}>
                    <Text style={styles.languageName}>{lang.language_name}</Text>
                    <Text style={styles.languageLevel}>{lang.proficiency}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <View style={styles.sidebarSection}>
                <Text style={styles.sectionTitle}>// Certifications</Text>
                {certifications.map((cert, index) => (
                  <View key={index} style={styles.certItem}>
                    <Text style={styles.certName}>{cert.certification_name}</Text>
                    <Text style={styles.certOrg}>
                      {cert.issuing_organization}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Summary */}
            {profile.professional_summary && (
              <Text style={styles.summary}>{profile.professional_summary}</Text>
            )}

            {/* Work Experience */}
            {workExperiences.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>// Experience</Text>
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
                      {exp.location && ` | ${exp.location}`}
                      {exp.is_remote && " [Remote]"}
                    </Text>
                    {exp.description && (
                      <Text style={styles.description}>{exp.description}</Text>
                    )}
                    {exp.achievements && exp.achievements.length > 0 && (
                      <View>
                        {exp.achievements.map((achievement, idx) => (
                          <Text key={idx} style={styles.achievement}>
                            <Text style={styles.achievementBullet}>→ </Text>
                            {achievement}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>// Projects</Text>
                {projects.slice(0, 4).map((proj, index) => (
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
                        Stack: {proj.technologies.join(" | ")}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Education */}
            {education.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>// Education</Text>
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
                    <Text style={styles.institution}>
                      {edu.institution_name}
                      {edu.gpa && ` | GPA: ${edu.gpa}`}
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