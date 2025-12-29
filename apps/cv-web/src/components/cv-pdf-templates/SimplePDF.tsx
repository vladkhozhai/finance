/**
 * Simple PDF Template
 * Clean monochrome ATS-compatible design
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

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    backgroundColor: "#ffffff",
    color: "#000000",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
    paddingBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  title: {
    fontSize: 12,
    color: "#333333",
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    fontSize: 9,
  },
  contactItem: {
    color: "#333333",
  },
  contactSeparator: {
    color: "#666666",
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.6,
    color: "#333333",
    marginBottom: 20,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 10,
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
    paddingBottom: 4,
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
    color: "#000000",
  },
  dateRange: {
    fontSize: 10,
    color: "#333333",
  },
  company: {
    fontSize: 10,
    color: "#333333",
    marginBottom: 4,
  },
  description: {
    fontSize: 9,
    color: "#333333",
    lineHeight: 1.5,
    marginBottom: 4,
  },
  achievementsList: {
    paddingLeft: 10,
  },
  achievement: {
    fontSize: 9,
    color: "#333333",
    marginBottom: 2,
  },
  educationItem: {
    marginBottom: 10,
  },
  degree: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000000",
  },
  institution: {
    fontSize: 10,
    color: "#333333",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  skillItem: {
    fontSize: 9,
    color: "#333333",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  projectItem: {
    marginBottom: 10,
  },
  projectName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000000",
  },
  projectRole: {
    fontSize: 9,
    color: "#666666",
    marginBottom: 2,
  },
  technologies: {
    fontSize: 8,
    color: "#666666",
    fontStyle: "italic",
  },
  twoColumnSection: {
    flexDirection: "row",
    gap: 30,
  },
  column: {
    flex: 1,
  },
  certItem: {
    marginBottom: 8,
  },
  certName: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000000",
  },
  certOrg: {
    fontSize: 9,
    color: "#333333",
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    fontSize: 9,
  },
  languageName: {
    fontWeight: "bold",
    color: "#000000",
  },
  languageLevel: {
    color: "#333333",
  },
  link: {
    color: "#333333",
    textDecoration: "none",
  },
});

export function SimplePDF({
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
            {profile.email && profile.phone && (
              <Text style={styles.contactSeparator}>|</Text>
            )}
            {profile.phone && (
              <Text style={styles.contactItem}>{profile.phone}</Text>
            )}
            {profile.phone && location && (
              <Text style={styles.contactSeparator}>|</Text>
            )}
            {location && <Text style={styles.contactItem}>{location}</Text>}
            {socialLinks.slice(0, 2).map((link, index) => (
              <View key={index} style={{ flexDirection: "row" }}>
                <Text style={styles.contactSeparator}>|</Text>
                <Link src={link.url} style={styles.link}>
                  {getPlatformName(link.platform)}
                </Link>
              </View>
            ))}
          </View>
        </View>

        {/* Summary */}
        {profile.professional_summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.summary}>{profile.professional_summary}</Text>
          </View>
        )}

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
                  {exp.location && `, ${exp.location}`}
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
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {skills.map((skill, index) => (
                <Text key={index} style={styles.skillItem}>
                  {skill.skill_name}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.slice(0, 4).map((proj, index) => (
              <View key={index} style={styles.projectItem}>
                <View style={styles.experienceHeader}>
                  <Text style={styles.projectName}>{proj.project_name}</Text>
                  {proj.start_date && (
                    <Text style={styles.dateRange}>
                      {formatDateRange(proj.start_date, proj.end_date, proj.is_ongoing)}
                    </Text>
                  )}
                </View>
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

        {/* Two Column: Certifications & Languages */}
        <View style={styles.twoColumnSection}>
          {certifications.length > 0 && (
            <View style={styles.column}>
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
      </Page>
    </Document>
  );
}