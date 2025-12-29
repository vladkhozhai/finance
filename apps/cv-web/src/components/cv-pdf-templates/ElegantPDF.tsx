/**
 * Elegant PDF Template
 * Sophisticated serif design with gold accents on cream background
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
  primary: "#78350f",
  secondary: "#b45309",
  accent: "#d97706",
  gold: "#ca8a04",
  dark: "#1c1917",
  text: "#44403c",
  muted: "#78716c",
  cream: "#fefce8",
  light: "#fef9c3",
  border: "#d6d3d1",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 10,
    backgroundColor: colors.cream,
    color: colors.text,
    padding: 0,
  },
  header: {
    padding: 30,
    borderBottomWidth: 3,
    borderBottomColor: colors.gold,
    backgroundColor: colors.white,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  photoContainer: {
    marginRight: 25,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    objectFit: "cover",
    borderWidth: 3,
    borderColor: colors.gold,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.light,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.gold,
  },
  photoInitials: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: "bold",
  },
  nameSection: {
    flex: 1,
  },
  name: {
    fontSize: 26,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 4,
    letterSpacing: 1,
  },
  title: {
    fontSize: 13,
    color: colors.secondary,
    fontStyle: "italic",
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },
  contactItem: {
    fontSize: 9,
    color: colors.muted,
  },
  main: {
    padding: 30,
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.7,
    color: colors.text,
    marginBottom: 25,
    padding: 15,
    backgroundColor: colors.white,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    fontStyle: "italic",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.gold,
    paddingBottom: 5,
  },
  experienceItem: {
    marginBottom: 14,
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  jobTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.dark,
  },
  dateRange: {
    fontSize: 9,
    color: colors.secondary,
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
  },
  achievementsList: {
    paddingLeft: 12,
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
  twoColumnSection: {
    flexDirection: "row",
    gap: 30,
  },
  column: {
    flex: 1,
  },
  skillItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    fontSize: 9,
  },
  skillBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
    marginRight: 8,
  },
  skillName: {
    color: colors.text,
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderBottomStyle: "dotted",
    fontSize: 9,
  },
  languageName: {
    color: colors.dark,
  },
  languageLevel: {
    color: colors.secondary,
    fontStyle: "italic",
  },
  projectItem: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: colors.white,
    borderRadius: 4,
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
    marginBottom: 8,
  },
  certName: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.dark,
  },
  certOrg: {
    fontSize: 9,
    color: colors.muted,
    fontStyle: "italic",
  },
  link: {
    color: colors.secondary,
    textDecoration: "none",
  },
});

export function ElegantPDF({
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
          <View style={styles.headerContent}>
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
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.main}>
          {/* Summary */}
          {profile.professional_summary && (
            <Text style={styles.summary}>{profile.professional_summary}</Text>
          )}

          {/* Experience */}
          {workExperiences.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Professional Experience</Text>
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
                    {exp.location && ` — ${exp.location}`}
                    {exp.is_remote && " (Remote)"}
                  </Text>
                  {exp.description && (
                    <Text style={styles.description}>{exp.description}</Text>
                  )}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <View style={styles.achievementsList}>
                      {exp.achievements.map((achievement, idx) => (
                        <Text key={idx} style={styles.achievement}>
                          ✦ {achievement}
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
                    {edu.gpa && ` — GPA: ${edu.gpa}`}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Two Column: Skills & Languages */}
          <View style={styles.twoColumnSection}>
            {skills.length > 0 && (
              <View style={styles.column}>
                <Text style={styles.sectionTitle}>Expertise</Text>
                {skills.slice(0, 10).map((skill, index) => (
                  <View key={index} style={styles.skillItem}>
                    <View style={styles.skillBullet} />
                    <Text style={styles.skillName}>{skill.skill_name}</Text>
                  </View>
                ))}
              </View>
            )}

            {languages.length > 0 && (
              <View style={styles.column}>
                <Text style={styles.sectionTitle}>Languages</Text>
                {languages.map((lang, index) => (
                  <View key={index} style={styles.languageItem}>
                    <Text style={styles.languageName}>{lang.language_name}</Text>
                    <Text style={styles.languageLevel}>{lang.proficiency}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Projects */}
          {projects.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notable Projects</Text>
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
                      Technologies: {proj.technologies.join(", ")}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Certifications</Text>
              {certifications.map((cert, index) => (
                <View key={index} style={styles.certItem}>
                  <Text style={styles.certName}>{cert.certification_name}</Text>
                  <Text style={styles.certOrg}>
                    {cert.issuing_organization} — {formatDateRange(cert.issue_date, null)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}