/**
 * Modern PDF Template
 * Clean two-column layout with light gray sidebar and blue accents
 * Matches the ModernTemplate web component design
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

// Colors matching the web template
const colors = {
  white: "#ffffff",
  gray50: "#f9fafb", // bg-gray-50 - sidebar background
  gray600: "#4b5563", // text-gray-600
  gray700: "#374151", // text-gray-700
  gray800: "#1f2937", // text-gray-800
  gray900: "#111827", // text-gray-900
  blue600: "#2563eb", // text-blue-600 - accent color
  blue100: "#dbeafe", // bg-blue-100
  blue700: "#1d4ed8", // text-blue-700
};

const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    fontFamily: "Helvetica",
    fontSize: 10,
    backgroundColor: colors.white,
  },
  // Sidebar - 30%
  sidebar: {
    width: "30%",
    backgroundColor: colors.gray50,
    padding: 25,
  },
  photoContainer: {
    marginBottom: 15,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    objectFit: "cover",
  },
  sidebarSection: {
    marginBottom: 18,
  },
  sidebarTitle: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.blue600,
    marginBottom: 10,
  },
  contactItem: {
    flexDirection: "row",
    marginBottom: 6,
    fontSize: 9,
  },
  contactText: {
    color: colors.gray700,
  },
  skillCategory: {
    marginBottom: 8,
  },
  skillCategoryTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: colors.gray600,
    marginBottom: 4,
  },
  skillItem: {
    marginBottom: 4,
  },
  skillName: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.gray800,
  },
  skillLevel: {
    fontSize: 8,
    color: colors.gray600,
  },
  languageItem: {
    marginBottom: 4,
  },
  languageName: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.gray800,
  },
  languageLevel: {
    fontSize: 8,
    color: colors.gray600,
  },
  // Main content - 70%
  main: {
    width: "70%",
    padding: 25,
    backgroundColor: colors.white,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: colors.blue600,
  },
  name: {
    fontSize: 26,
    fontWeight: "bold",
    color: colors.gray900,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.blue600,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.gray900,
    marginBottom: 10,
  },
  summary: {
    fontSize: 9,
    lineHeight: 1.5,
    color: colors.gray700,
  },
  experienceItem: {
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.gray900,
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
    fontSize: 9,
    color: colors.gray700,
  },
  companyName: {
    fontWeight: "bold",
  },
  dot: {
    marginHorizontal: 4,
  },
  dateRange: {
    fontSize: 8,
    color: colors.gray600,
    marginBottom: 4,
  },
  description: {
    fontSize: 9,
    color: colors.gray700,
    lineHeight: 1.4,
    marginBottom: 4,
  },
  achievementsList: {
    paddingLeft: 10,
  },
  achievement: {
    fontSize: 9,
    color: colors.gray700,
    marginBottom: 2,
  },
  educationItem: {
    marginBottom: 10,
  },
  degree: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.gray900,
  },
  institution: {
    fontSize: 9,
    color: colors.gray700,
  },
  projectItem: {
    marginBottom: 10,
  },
  projectHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  projectName: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.gray900,
  },
  projectRole: {
    fontSize: 9,
    color: colors.gray600,
    marginLeft: 6,
  },
  technologies: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  techBadge: {
    fontSize: 8,
    color: colors.blue700,
    backgroundColor: colors.blue100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  certItem: {
    marginBottom: 8,
  },
  certName: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.gray900,
  },
  certOrg: {
    fontSize: 9,
    color: colors.gray700,
  },
  certDate: {
    fontSize: 8,
    color: colors.gray600,
  },
  link: {
    color: colors.blue600,
    textDecoration: "none",
  },
});

export function ModernPDF({
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
          <View style={styles.main}>
            <Text>No profile data available</Text>
          </View>
        </Page>
      </Document>
    );
  }

  const fullName = getFullName(profile);
  const location = getLocation(profile.address_city, profile.address_country);

  // Group skills by category
  const skillsByCategory = skills.reduce(
    (acc, skill) => {
      const category = skill.category || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(skill);
      return acc;
    },
    {} as Record<string, typeof skills>,
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Sidebar - 30% */}
        <View style={styles.sidebar}>
          {/* Profile Photo */}
          {profile.profile_photo_url && (
            <View style={styles.photoContainer}>
              <Image src={profile.profile_photo_url} style={styles.photo} />
            </View>
          )}

          {/* Contact Information */}
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarTitle}>Contact</Text>
            {profile.email && (
              <View style={styles.contactItem}>
                <Text style={styles.contactText}>{profile.email}</Text>
              </View>
            )}
            {profile.phone && (
              <View style={styles.contactItem}>
                <Text style={styles.contactText}>{profile.phone}</Text>
              </View>
            )}
            {location && (
              <View style={styles.contactItem}>
                <Text style={styles.contactText}>{location}</Text>
              </View>
            )}
          </View>

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarTitle}>Links</Text>
              {socialLinks.map((link, index) => (
                <View key={index} style={styles.contactItem}>
                  <Link src={link.url} style={styles.link}>
                    {getPlatformName(link.platform)}
                  </Link>
                </View>
              ))}
            </View>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarTitle}>Skills</Text>
              {Object.entries(skillsByCategory).map(
                ([category, categorySkills], catIndex) => (
                  <View key={catIndex} style={styles.skillCategory}>
                    {Object.keys(skillsByCategory).length > 1 && (
                      <Text style={styles.skillCategoryTitle}>{category}</Text>
                    )}
                    {categorySkills.map((skill, index) => (
                      <View key={index} style={styles.skillItem}>
                        <Text style={styles.skillName}>{skill.skill_name}</Text>
                        {skill.proficiency_level && (
                          <Text style={styles.skillLevel}>
                            {skill.proficiency_level}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                ),
              )}
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
        </View>

        {/* Main Content - 70% */}
        <View style={styles.main}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.name}>{fullName}</Text>
            {profile.professional_title && (
              <Text style={styles.title}>{profile.professional_title}</Text>
            )}
          </View>

          {/* Professional Summary */}
          {profile.professional_summary && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Professional Summary</Text>
              <Text style={styles.summary}>{profile.professional_summary}</Text>
            </View>
          )}

          {/* Work Experience */}
          {workExperiences.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Work Experience</Text>
              {workExperiences.map((exp, index) => (
                <View key={index} style={styles.experienceItem}>
                  <Text style={styles.jobTitle}>{exp.job_title}</Text>
                  <View style={styles.companyRow}>
                    <Text style={styles.companyName}>{exp.company_name}</Text>
                    {exp.location && (
                      <>
                        <Text style={styles.dot}>•</Text>
                        <Text>
                          {exp.location}
                          {exp.is_remote && " (Remote)"}
                        </Text>
                      </>
                    )}
                    {exp.employment_type && (
                      <>
                        <Text style={styles.dot}>•</Text>
                        <Text>{exp.employment_type}</Text>
                      </>
                    )}
                  </View>
                  <Text style={styles.dateRange}>
                    {formatDateRange(
                      exp.start_date,
                      exp.end_date,
                      exp.is_current,
                    )}
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

          {/* Education */}
          {education.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Education</Text>
              {education.map((edu, index) => (
                <View key={index} style={styles.educationItem}>
                  <Text style={styles.degree}>
                    {edu.degree} in {edu.field_of_study}
                  </Text>
                  <Text style={styles.institution}>{edu.institution_name}</Text>
                  <Text style={styles.dateRange}>
                    {formatDateRange(
                      edu.start_date,
                      edu.end_date,
                      edu.is_current,
                    )}
                    {edu.gpa && ` • GPA: ${edu.gpa}`}
                  </Text>
                  {edu.description && (
                    <Text style={styles.description}>{edu.description}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Projects</Text>
              {projects.slice(0, 4).map((proj, index) => (
                <View key={index} style={styles.projectItem}>
                  <View style={styles.projectHeader}>
                    <Text style={styles.projectName}>{proj.project_name}</Text>
                    {proj.role && (
                      <Text style={styles.projectRole}>({proj.role})</Text>
                    )}
                  </View>
                  {proj.start_date && (
                    <Text style={styles.dateRange}>
                      {formatDateRange(
                        proj.start_date,
                        proj.end_date,
                        proj.is_ongoing,
                      )}
                    </Text>
                  )}
                  {proj.description && (
                    <Text style={styles.description}>{proj.description}</Text>
                  )}
                  {proj.technologies && proj.technologies.length > 0 && (
                    <View style={styles.technologies}>
                      {proj.technologies.map((tech, idx) => (
                        <Text key={idx} style={styles.techBadge}>
                          {tech}
                        </Text>
                      ))}
                    </View>
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
                    {cert.issuing_organization}
                  </Text>
                  <Text style={styles.certDate}>
                    Issued: {formatDateRange(cert.issue_date, null)}
                    {cert.expiration_date &&
                      ` • Expires: ${formatDateRange(cert.expiration_date, null)}`}
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
