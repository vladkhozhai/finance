/**
 * Creative PDF Template
 * Colorful modern design with gradient header
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
  Image,
} from "@react-pdf/renderer";
import type { PDFTemplateProps } from "./types";
import { formatDateRange, getFullName, getLocation, getPlatformName } from "./utils";

// Define styles with vibrant colors
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#333333",
  },
  // Header with gradient simulation (using solid color)
  header: {
    backgroundColor: "#7c3aed",
    padding: 30,
    color: "#ffffff",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  photoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  photo: {
    width: 90,
    height: 90,
    objectFit: "cover",
  },
  photoPlaceholder: {
    width: 90,
    height: 90,
    backgroundColor: "#9333ea",
    justifyContent: "center",
    alignItems: "center",
  },
  photoInitials: {
    fontSize: 32,
    color: "#ffffff",
    fontWeight: "bold",
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    color: "#e9d5ff",
    marginBottom: 10,
  },
  headerContact: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  headerContactItem: {
    fontSize: 9,
    color: "#f3e8ff",
  },
  // Main content area
  body: {
    flexDirection: "row",
    padding: 0,
  },
  sidebar: {
    width: "35%",
    backgroundColor: "#f5f3ff",
    padding: 20,
  },
  main: {
    width: "65%",
    padding: 20,
    backgroundColor: "#ffffff",
  },
  // Section styles
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#7c3aed",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionTitleAlt: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#5b21b6",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottomWidth: 2,
    borderBottomColor: "#7c3aed",
    paddingBottom: 4,
  },
  // Summary
  summary: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#4b5563",
  },
  // Skills badges
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  skillBadge: {
    backgroundColor: "#ddd6fe",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  skillText: {
    fontSize: 8,
    color: "#5b21b6",
    fontWeight: "bold",
  },
  // Languages with visual bars
  languageItem: {
    marginBottom: 10,
  },
  languageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  languageName: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151",
  },
  languageLevel: {
    fontSize: 9,
    color: "#6b7280",
  },
  languageBar: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
  },
  languageBarFill: {
    height: 6,
    backgroundColor: "#7c3aed",
    borderRadius: 3,
  },
  // Links
  linksContainer: {
    gap: 6,
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  linkBullet: {
    width: 6,
    height: 6,
    backgroundColor: "#7c3aed",
    borderRadius: 3,
  },
  linkText: {
    fontSize: 9,
    color: "#7c3aed",
    textDecoration: "none",
  },
  // Experience with timeline
  experienceItem: {
    marginBottom: 15,
    paddingLeft: 15,
    borderLeftWidth: 2,
    borderLeftColor: "#ddd6fe",
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1f2937",
  },
  dateRange: {
    fontSize: 9,
    color: "#7c3aed",
    fontWeight: "bold",
  },
  company: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 4,
  },
  description: {
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1.4,
    marginBottom: 4,
  },
  achievementsList: {
    paddingLeft: 8,
  },
  achievement: {
    flexDirection: "row",
    marginBottom: 2,
  },
  achievementBullet: {
    color: "#7c3aed",
    marginRight: 4,
    fontSize: 9,
  },
  achievementText: {
    flex: 1,
    fontSize: 9,
    color: "#4b5563",
  },
  // Education
  educationItem: {
    marginBottom: 12,
    paddingLeft: 15,
    borderLeftWidth: 2,
    borderLeftColor: "#ddd6fe",
  },
  degree: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1f2937",
  },
  institution: {
    fontSize: 10,
    color: "#6b7280",
  },
  gpa: {
    fontSize: 9,
    color: "#7c3aed",
    fontStyle: "italic",
    marginTop: 2,
  },
  // Projects as cards
  projectCard: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: "#faf5ff",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#7c3aed",
  },
  projectName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#5b21b6",
    marginBottom: 2,
  },
  projectRole: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 4,
  },
  technologies: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 6,
  },
  techBadge: {
    backgroundColor: "#ede9fe",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  techText: {
    fontSize: 7,
    color: "#7c3aed",
  },
  // Certifications
  certItem: {
    marginBottom: 8,
    flexDirection: "row",
    gap: 8,
  },
  certBullet: {
    width: 8,
    height: 8,
    backgroundColor: "#7c3aed",
    borderRadius: 4,
    marginTop: 3,
  },
  certContent: {
    flex: 1,
  },
  certName: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1f2937",
  },
  certOrg: {
    fontSize: 9,
    color: "#6b7280",
  },
  certDate: {
    fontSize: 8,
    color: "#7c3aed",
  },
});

// Helper to get language level as percentage
function getLanguageLevel(proficiency: string): number {
  const levels: Record<string, number> = {
    native: 100,
    fluent: 90,
    advanced: 75,
    intermediate: 50,
    basic: 25,
    beginner: 15,
  };
  return levels[proficiency.toLowerCase()] || 50;
}

export function CreativePDF({
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
          <View style={{ padding: 40 }}>
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
        {/* Colorful Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
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

            {/* Name and Title */}
            <View style={styles.headerText}>
              <Text style={styles.name}>{fullName}</Text>
              {profile.professional_title && (
                <Text style={styles.title}>{profile.professional_title}</Text>
              )}
              <View style={styles.headerContact}>
                {profile.email && (
                  <Text style={styles.headerContactItem}>{profile.email}</Text>
                )}
                {profile.phone && (
                  <Text style={styles.headerContactItem}>{profile.phone}</Text>
                )}
                {location && (
                  <Text style={styles.headerContactItem}>{location}</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Two-column body */}
        <View style={styles.body}>
          {/* Sidebar */}
          <View style={styles.sidebar}>
            {/* Skills */}
            {skills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Skills</Text>
                <View style={styles.skillsContainer}>
                  {skills.map((skill, index) => (
                    <View key={index} style={styles.skillBadge}>
                      <Text style={styles.skillText}>{skill.skill_name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Languages</Text>
                {languages.map((lang, index) => (
                  <View key={index} style={styles.languageItem}>
                    <View style={styles.languageHeader}>
                      <Text style={styles.languageName}>{lang.language_name}</Text>
                      <Text style={styles.languageLevel}>{lang.proficiency}</Text>
                    </View>
                    <View style={styles.languageBar}>
                      <View
                        style={[
                          styles.languageBarFill,
                          { width: `${getLanguageLevel(lang.proficiency)}%` },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Links</Text>
                <View style={styles.linksContainer}>
                  {socialLinks.map((link, index) => (
                    <View key={index} style={styles.linkItem}>
                      <View style={styles.linkBullet} />
                      <Link src={link.url} style={styles.linkText}>
                        {getPlatformName(link.platform)}
                      </Link>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Certifications in sidebar */}
            {certifications.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Certifications</Text>
                {certifications.map((cert, index) => (
                  <View key={index} style={styles.certItem}>
                    <View style={styles.certBullet} />
                    <View style={styles.certContent}>
                      <Text style={styles.certName}>{cert.certification_name}</Text>
                      <Text style={styles.certOrg}>{cert.issuing_organization}</Text>
                      <Text style={styles.certDate}>
                        {formatDateRange(cert.issue_date, null)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Main Content */}
          <View style={styles.main}>
            {/* Summary */}
            {profile.professional_summary && (
              <View style={styles.section}>
                <Text style={styles.sectionTitleAlt}>About Me</Text>
                <Text style={styles.summary}>{profile.professional_summary}</Text>
              </View>
            )}

            {/* Experience */}
            {workExperiences.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitleAlt}>Experience</Text>
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
                      {exp.is_remote && " • Remote"}
                    </Text>
                    {exp.description && (
                      <Text style={styles.description}>{exp.description}</Text>
                    )}
                    {exp.achievements && exp.achievements.length > 0 && (
                      <View style={styles.achievementsList}>
                        {exp.achievements.map((achievement, idx) => (
                          <View key={idx} style={styles.achievement}>
                            <Text style={styles.achievementBullet}>▸</Text>
                            <Text style={styles.achievementText}>{achievement}</Text>
                          </View>
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
                <Text style={styles.sectionTitleAlt}>Education</Text>
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
                    {edu.gpa && <Text style={styles.gpa}>GPA: {edu.gpa}</Text>}
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
                <Text style={styles.sectionTitleAlt}>Projects</Text>
                {projects.slice(0, 3).map((proj, index) => (
                  <View key={index} style={styles.projectCard}>
                    <Text style={styles.projectName}>{proj.project_name}</Text>
                    {proj.role && <Text style={styles.projectRole}>{proj.role}</Text>}
                    {proj.description && (
                      <Text style={styles.description}>{proj.description}</Text>
                    )}
                    {proj.technologies && proj.technologies.length > 0 && (
                      <View style={styles.technologies}>
                        {proj.technologies.slice(0, 6).map((tech, idx) => (
                          <View key={idx} style={styles.techBadge}>
                            <Text style={styles.techText}>{tech}</Text>
                          </View>
                        ))}
                      </View>
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
