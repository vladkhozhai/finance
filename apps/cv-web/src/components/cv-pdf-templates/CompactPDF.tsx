/**
 * Compact PDF Template
 * Dense two-column layout with teal accents for maximizing content
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
  primary: "#0d9488",
  secondary: "#14b8a6",
  dark: "#134e4a",
  text: "#1f2937",
  muted: "#6b7280",
  light: "#f0fdfa",
  border: "#99f6e4",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8,
    flexDirection: "row",
    backgroundColor: colors.white,
  },
  sidebar: {
    width: "28%",
    backgroundColor: colors.dark,
    padding: 15,
    color: colors.white,
  },
  main: {
    width: "72%",
    padding: 20,
    color: colors.text,
  },
  photoContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    objectFit: "cover",
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  photoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  photoInitials: {
    fontSize: 18,
    color: colors.white,
    fontWeight: "bold",
  },
  sidebarSection: {
    marginBottom: 12,
  },
  sidebarTitle: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.secondary,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingBottom: 3,
  },
  contactItem: {
    fontSize: 7,
    marginBottom: 3,
    color: colors.white,
  },
  skillItem: {
    marginBottom: 4,
  },
  skillName: {
    fontSize: 7,
    color: colors.white,
    marginBottom: 1,
  },
  skillBar: {
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  skillBarFill: {
    height: 2,
    backgroundColor: colors.secondary,
    borderRadius: 1,
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
    fontSize: 7,
  },
  languageName: {
    color: colors.white,
  },
  languageLevel: {
    color: colors.secondary,
  },
  certItem: {
    marginBottom: 5,
  },
  certName: {
    fontSize: 7,
    fontWeight: "bold",
    color: colors.white,
  },
  certOrg: {
    fontSize: 6,
    color: colors.secondary,
  },
  header: {
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 2,
  },
  title: {
    fontSize: 10,
    color: colors.primary,
    marginBottom: 4,
  },
  summary: {
    fontSize: 8,
    lineHeight: 1.4,
    color: colors.muted,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 2,
  },
  experienceItem: {
    marginBottom: 8,
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  jobTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.text,
  },
  dateRange: {
    fontSize: 7,
    color: colors.primary,
  },
  company: {
    fontSize: 8,
    color: colors.primary,
    marginBottom: 2,
  },
  description: {
    fontSize: 7,
    color: colors.muted,
    lineHeight: 1.3,
    marginBottom: 2,
  },
  achievement: {
    fontSize: 7,
    color: colors.text,
    marginBottom: 1,
    paddingLeft: 6,
  },
  educationItem: {
    marginBottom: 6,
  },
  degree: {
    fontSize: 8,
    fontWeight: "bold",
    color: colors.text,
  },
  institution: {
    fontSize: 7,
    color: colors.muted,
  },
  projectItem: {
    marginBottom: 6,
  },
  projectName: {
    fontSize: 8,
    fontWeight: "bold",
    color: colors.text,
  },
  projectRole: {
    fontSize: 7,
    color: colors.primary,
  },
  technologies: {
    fontSize: 6,
    color: colors.muted,
    fontStyle: "italic",
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

export function CompactPDF({
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
        {/* Sidebar */}
        <View style={styles.sidebar}>
          {/* Photo */}
          <View style={styles.photoContainer}>
            {profile.profile_photo_url ? (
              <Image src={profile.profile_photo_url} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoInitials}>{initials}</Text>
              </View>
            )}
          </View>

          {/* Contact */}
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarTitle}>Contact</Text>
            {profile.email && (
              <Text style={styles.contactItem}>{profile.email}</Text>
            )}
            {profile.phone && (
              <Text style={styles.contactItem}>{profile.phone}</Text>
            )}
            {location && <Text style={styles.contactItem}>{location}</Text>}
          </View>

          {/* Links */}
          {socialLinks.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarTitle}>Links</Text>
              {socialLinks.map((link, index) => (
                <Link key={index} src={link.url} style={styles.link}>
                  <Text style={styles.contactItem}>
                    {getPlatformName(link.platform)}
                  </Text>
                </Link>
              ))}
            </View>
          )}

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
        </View>

        {/* Main Content */}
        <View style={styles.main}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.name}>{fullName}</Text>
            {profile.professional_title && (
              <Text style={styles.title}>{profile.professional_title}</Text>
            )}
            {profile.professional_summary && (
              <Text style={styles.summary}>{profile.professional_summary}</Text>
            )}
          </View>

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
                    {exp.location && ` · ${exp.location}`}
                  </Text>
                  {exp.description && (
                    <Text style={styles.description}>{exp.description}</Text>
                  )}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <View>
                      {exp.achievements.slice(0, 3).map((achievement, idx) => (
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

          {/* Education */}
          {education.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Education</Text>
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
                    {edu.gpa && ` · GPA: ${edu.gpa}`}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Projects</Text>
              {projects.slice(0, 3).map((proj, index) => (
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
                      {proj.technologies.join(" · ")}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}