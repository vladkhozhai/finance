/**
 * Modern PDF Template
 * Clean two-column layout with blue accents
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
import { formatDateRange, getFullName, getLocation, getPlatformName } from "./utils";

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  // Sidebar styles
  sidebar: {
    width: "30%",
    backgroundColor: "#1e3a5f",
    color: "#ffffff",
    padding: 20,
  },
  photoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    objectFit: "cover",
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2d4a6f",
    justifyContent: "center",
    alignItems: "center",
  },
  photoInitials: {
    fontSize: 24,
    color: "#ffffff",
    fontWeight: "bold",
  },
  sidebarSection: {
    marginBottom: 15,
  },
  sidebarTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#7db3e8",
  },
  contactItem: {
    flexDirection: "row",
    marginBottom: 5,
    fontSize: 9,
  },
  contactLabel: {
    color: "#7db3e8",
    marginRight: 5,
  },
  contactValue: {
    color: "#ffffff",
    flex: 1,
  },
  skillItem: {
    marginBottom: 6,
  },
  skillName: {
    fontSize: 9,
    marginBottom: 2,
  },
  skillBar: {
    height: 4,
    backgroundColor: "#2d4a6f",
    borderRadius: 2,
  },
  skillBarFill: {
    height: 4,
    backgroundColor: "#7db3e8",
    borderRadius: 2,
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    fontSize: 9,
  },
  // Main content styles
  main: {
    width: "70%",
    padding: 25,
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a5f",
    paddingBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e3a5f",
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    color: "#4a6fa5",
    marginBottom: 8,
  },
  summary: {
    fontSize: 10,
    color: "#555555",
    lineHeight: 1.5,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1e3a5f",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 4,
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
    fontSize: 11,
    fontWeight: "bold",
    color: "#333333",
  },
  dateRange: {
    fontSize: 9,
    color: "#666666",
  },
  company: {
    fontSize: 10,
    color: "#4a6fa5",
    marginBottom: 3,
  },
  description: {
    fontSize: 9,
    color: "#555555",
    lineHeight: 1.4,
    marginBottom: 4,
  },
  achievementsList: {
    paddingLeft: 10,
  },
  achievement: {
    fontSize: 9,
    color: "#555555",
    marginBottom: 2,
  },
  educationItem: {
    marginBottom: 10,
  },
  degree: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#333333",
  },
  institution: {
    fontSize: 10,
    color: "#4a6fa5",
  },
  projectItem: {
    marginBottom: 10,
  },
  projectName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#333333",
  },
  projectRole: {
    fontSize: 9,
    color: "#4a6fa5",
    marginBottom: 2,
  },
  technologies: {
    fontSize: 8,
    color: "#666666",
    fontStyle: "italic",
  },
  certItem: {
    marginBottom: 8,
  },
  certName: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#333333",
  },
  certOrg: {
    fontSize: 9,
    color: "#666666",
  },
  link: {
    color: "#4a6fa5",
    textDecoration: "none",
  },
});

// Helper to get skill level as percentage
function getSkillLevel(level?: string | null): number {
  const levels: Record<string, number> = {
    beginner: 25,
    intermediate: 50,
    advanced: 75,
    expert: 100,
  };
  return levels[level?.toLowerCase() || "intermediate"] || 50;
}

export function ModernPDF({
  profile,
  socialLinks,
  workExperiences,
  education,
  skills,
  projects,
  certifications,
  languages
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

          {/* Contact Information */}
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarTitle}>Contact</Text>
            {profile.email && (
              <View style={styles.contactItem}>
                <Text style={styles.contactValue}>{profile.email}</Text>
              </View>
            )}
            {profile.phone && (
              <View style={styles.contactItem}>
                <Text style={styles.contactValue}>{profile.phone}</Text>
              </View>
            )}
            {location && (
              <View style={styles.contactItem}>
                <Text style={styles.contactValue}>{location}</Text>
              </View>
            )}
          </View>

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarTitle}>Links</Text>
              {socialLinks.map((link, index) => (
                <View key={index} style={styles.contactItem}>
                  <Text style={styles.contactLabel}>
                    {getPlatformName(link.platform)}:
                  </Text>
                  <Link src={link.url} style={[styles.contactValue, styles.link]}>
                    {link.url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                  </Link>
                </View>
              ))}
            </View>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarTitle}>Skills</Text>
              {skills.slice(0, 8).map((skill, index) => (
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
                  <Text>{lang.language_name}</Text>
                  <Text style={{ color: "#7db3e8" }}>{lang.proficiency}</Text>
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

          {/* Work Experience */}
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
                    {exp.location && ` - ${exp.location}`}
                    {exp.is_remote && " (Remote)"}
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
                    {edu.gpa && ` - GPA: ${edu.gpa}`}
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
                  <Text style={styles.projectName}>{proj.project_name}</Text>
                  {proj.role && <Text style={styles.projectRole}>{proj.role}</Text>}
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
                    {cert.issuing_organization} - {formatDateRange(cert.issue_date, null)}
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
