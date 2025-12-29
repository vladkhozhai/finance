/**
 * Executive PDF Template
 * Elegant design with amber/gold accents for senior professionals
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
  primary: "#92400e",
  secondary: "#d97706",
  accent: "#fbbf24",
  dark: "#1c1917",
  text: "#44403c",
  light: "#fafaf9",
  border: "#e7e5e4",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    backgroundColor: colors.light,
    color: colors.text,
  },
  header: {
    backgroundColor: colors.dark,
    padding: 30,
    flexDirection: "row",
    alignItems: "center",
  },
  photoContainer: {
    marginRight: 25,
  },
  photo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    objectFit: "cover",
    borderWidth: 2,
    borderColor: colors.accent,
  },
  photoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.accent,
  },
  photoInitials: {
    fontSize: 22,
    color: "#ffffff",
    fontWeight: "bold",
  },
  headerContent: {
    flex: 1,
  },
  name: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    color: colors.accent,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },
  contactItem: {
    fontSize: 9,
    color: "#d6d3d1",
  },
  main: {
    padding: 30,
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.6,
    color: colors.text,
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
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
    borderLeftColor: colors.secondary,
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
  },
  company: {
    fontSize: 10,
    color: colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 9,
    color: colors.text,
    lineHeight: 1.5,
    marginBottom: 4,
  },
  achievement: {
    fontSize: 9,
    color: colors.text,
    marginBottom: 2,
    paddingLeft: 10,
  },
  educationItem: {
    marginBottom: 10,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: colors.secondary,
  },
  degree: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.dark,
  },
  institution: {
    fontSize: 10,
    color: colors.text,
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
  skillCategoryName: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 4,
  },
  skillItem: {
    fontSize: 9,
    color: colors.text,
    marginBottom: 2,
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    fontSize: 9,
  },
  languageName: {
    fontWeight: "bold",
    color: colors.dark,
  },
  languageLevel: {
    color: colors.secondary,
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
    marginBottom: 2,
  },
  technologies: {
    fontSize: 8,
    color: colors.text,
    fontStyle: "italic",
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
    color: colors.text,
  },
  link: {
    color: "#d6d3d1",
    textDecoration: "none",
  },
});

export function ExecutivePDF({
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
          <View style={styles.photoContainer}>
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
              {socialLinks.slice(0, 2).map((link, index) => (
                <Link key={index} src={link.url} style={styles.link}>
                  {getPlatformName(link.platform)}
                </Link>
              ))}
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.main}>
          {/* Summary */}
          {profile.professional_summary && (
            <Text style={styles.summary}>{profile.professional_summary}</Text>
          )}

          {/* Work Experience */}
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
                    {exp.location && ` · ${exp.location}`}
                    {exp.is_remote && " (Remote)"}
                  </Text>
                  {exp.description && (
                    <Text style={styles.description}>{exp.description}</Text>
                  )}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <View>
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

          {/* Two Column: Skills & Languages */}
          <View style={styles.twoColumnSection}>
            {skills.length > 0 && (
              <View style={styles.column}>
                <Text style={styles.sectionTitle}>Skills</Text>
                {skills.slice(0, 10).map((skill, index) => (
                  <Text key={index} style={styles.skillItem}>
                    • {skill.skill_name}
                  </Text>
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
              <Text style={styles.sectionTitle}>Key Projects</Text>
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
                    {cert.issuing_organization} · {formatDateRange(cert.issue_date, null)}
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