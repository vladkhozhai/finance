/**
 * Designer PDF Template
 * Bold creative design with pink/purple gradients and asymmetric layout
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
  primary: "#be185d",
  secondary: "#ec4899",
  accent: "#f472b6",
  purple: "#7c3aed",
  dark: "#1e1b4b",
  text: "#3f3f46",
  muted: "#71717a",
  light: "#fdf4ff",
  pink: "#fce7f3",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    backgroundColor: colors.white,
    color: colors.text,
  },
  header: {
    backgroundColor: colors.dark,
    padding: 25,
    flexDirection: "row",
  },
  photoSection: {
    width: "30%",
    alignItems: "center",
    justifyContent: "center",
  },
  photo: {
    width: 90,
    height: 90,
    borderRadius: 10,
    objectFit: "cover",
    borderWidth: 3,
    borderColor: colors.secondary,
  },
  photoPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.secondary,
  },
  photoInitials: {
    fontSize: 28,
    color: colors.white,
    fontWeight: "bold",
  },
  headerContent: {
    width: "70%",
    paddingLeft: 20,
    justifyContent: "center",
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    color: colors.secondary,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  contactItem: {
    fontSize: 8,
    color: colors.accent,
  },
  main: {
    flexDirection: "row",
  },
  sidebar: {
    width: "32%",
    backgroundColor: colors.light,
    padding: 20,
  },
  content: {
    width: "68%",
    padding: 20,
  },
  sidebarSection: {
    marginBottom: 18,
  },
  sidebarTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: colors.secondary,
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
    height: 4,
    backgroundColor: colors.pink,
    borderRadius: 2,
  },
  skillBarFill: {
    height: 4,
    backgroundColor: colors.secondary,
    borderRadius: 2,
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
    fontSize: 8,
  },
  languageName: {
    color: colors.text,
    fontWeight: "bold",
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
    color: colors.dark,
  },
  certOrg: {
    fontSize: 7,
    color: colors.muted,
  },
  summary: {
    fontSize: 9,
    lineHeight: 1.6,
    color: colors.text,
    marginBottom: 20,
    padding: 12,
    backgroundColor: colors.light,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  experienceItem: {
    marginBottom: 14,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.dark,
  },
  dateRange: {
    fontSize: 8,
    color: colors.primary,
    fontWeight: "bold",
  },
  company: {
    fontSize: 9,
    color: colors.secondary,
    marginBottom: 4,
  },
  description: {
    fontSize: 8,
    color: colors.text,
    lineHeight: 1.5,
    marginBottom: 4,
  },
  achievement: {
    fontSize: 8,
    color: colors.text,
    marginBottom: 2,
    paddingLeft: 8,
  },
  achievementBullet: {
    color: colors.secondary,
  },
  educationItem: {
    marginBottom: 10,
  },
  degree: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.dark,
  },
  institution: {
    fontSize: 9,
    color: colors.muted,
  },
  projectItem: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: colors.light,
    borderRadius: 6,
  },
  projectName: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.dark,
  },
  projectRole: {
    fontSize: 8,
    color: colors.primary,
    marginBottom: 3,
  },
  technologies: {
    fontSize: 7,
    color: colors.muted,
    marginTop: 4,
  },
  techBadge: {
    backgroundColor: colors.pink,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 7,
    color: colors.primary,
    marginRight: 4,
  },
  link: {
    color: colors.accent,
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

export function DesignerPDF({
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
          <View style={styles.photoSection}>
            {profile.profile_photo_url ? (
              <Image src={profile.profile_photo_url} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoInitials}>{initials}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerContent}>
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
              {socialLinks.slice(0, 3).map((link, index) => (
                <Link key={index} src={link.url} style={styles.link}>
                  {getPlatformName(link.platform)}
                </Link>
              ))}
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.main}>
          {/* Sidebar */}
          <View style={styles.sidebar}>
            {/* Skills */}
            {skills.length > 0 && (
              <View style={styles.sidebarSection}>
                <Text style={styles.sidebarTitle}>Skills</Text>
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
                <Text style={styles.sidebarTitle}>Languages</Text>
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
                <Text style={styles.sidebarTitle}>Certifications</Text>
                {certifications.slice(0, 4).map((cert, index) => (
                  <View key={index} style={styles.certItem}>
                    <Text style={styles.certName}>{cert.certification_name}</Text>
                    <Text style={styles.certOrg}>{cert.issuing_organization}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Education in sidebar */}
            {education.length > 0 && (
              <View style={styles.sidebarSection}>
                <Text style={styles.sidebarTitle}>Education</Text>
                {education.map((edu, index) => (
                  <View key={index} style={styles.educationItem}>
                    <Text style={styles.degree}>
                      {edu.degree}
                    </Text>
                    <Text style={styles.institution}>
                      {edu.field_of_study}
                    </Text>
                    <Text style={styles.institution}>
                      {edu.institution_name}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Main Content */}
          <View style={styles.content}>
            {/* Summary */}
            {profile.professional_summary && (
              <Text style={styles.summary}>{profile.professional_summary}</Text>
            )}

            {/* Experience */}
            {workExperiences.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Experience</Text>
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
                      {exp.location && ` • ${exp.location}`}
                      {exp.is_remote && " (Remote)"}
                    </Text>
                    {exp.description && (
                      <Text style={styles.description}>{exp.description}</Text>
                    )}
                    {exp.achievements && exp.achievements.length > 0 && (
                      <View>
                        {exp.achievements.map((achievement, idx) => (
                          <Text key={idx} style={styles.achievement}>
                            <Text style={styles.achievementBullet}>▸ </Text>
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
                <Text style={styles.sectionTitle}>Featured Projects</Text>
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
                        {proj.technologies.join(" • ")}
                      </Text>
                    )}
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