/**
 * Minimal PDF Template
 * Ultra-clean single column design with subtle spacing and minimal decoration
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
    color: "#333333",
  },
  header: {
    marginBottom: 20,
    textAlign: "center",
  },
  name: {
    fontSize: 22,
    fontWeight: "light",
    letterSpacing: 1,
    color: "#1a1a1a",
    marginBottom: 4,
  },
  title: {
    fontSize: 11,
    color: "#666666",
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 12,
    fontSize: 8,
    color: "#666666",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  summary: {
    fontSize: 9,
    lineHeight: 1.6,
    color: "#555555",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#888888",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 4,
    marginBottom: 10,
  },
  experienceItem: {
    marginBottom: 10,
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  dateRange: {
    fontSize: 8,
    color: "#888888",
  },
  company: {
    fontSize: 9,
    color: "#555555",
    marginBottom: 3,
  },
  description: {
    fontSize: 8,
    color: "#666666",
    lineHeight: 1.5,
  },
  achievement: {
    fontSize: 8,
    color: "#666666",
    marginBottom: 2,
    paddingLeft: 8,
  },
  educationItem: {
    marginBottom: 8,
  },
  degree: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  institution: {
    fontSize: 9,
    color: "#555555",
  },
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  skillItem: {
    fontSize: 8,
    color: "#555555",
  },
  skillDot: {
    color: "#cccccc",
    marginLeft: 8,
  },
  projectItem: {
    marginBottom: 8,
  },
  projectName: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  projectRole: {
    fontSize: 8,
    color: "#888888",
  },
  technologies: {
    fontSize: 8,
    color: "#888888",
  },
  twoColumnRow: {
    flexDirection: "row",
    gap: 30,
  },
  column: {
    flex: 1,
  },
  certItem: {
    marginBottom: 6,
  },
  certName: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  certOrg: {
    fontSize: 8,
    color: "#666666",
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    fontSize: 8,
  },
  languageName: {
    color: "#1a1a1a",
    fontWeight: "bold",
  },
  languageLevel: {
    color: "#888888",
  },
  link: {
    color: "#555555",
    textDecoration: "none",
  },
});

export function MinimalPDF({
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
          <Text style={styles.summary}>{profile.professional_summary}</Text>
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

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsRow}>
              {skills.map((skill, index) => (
                <Text key={index} style={styles.skillItem}>
                  {skill.skill_name}
                  {index < skills.length - 1 && (
                    <Text style={styles.skillDot}> · </Text>
                  )}
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
                  <Text style={styles.projectName}>
                    {proj.project_name}
                    {proj.role && (
                      <Text style={styles.projectRole}> ({proj.role})</Text>
                    )}
                  </Text>
                  {proj.start_date && (
                    <Text style={styles.dateRange}>
                      {formatDateRange(proj.start_date, proj.end_date, proj.is_ongoing)}
                    </Text>
                  )}
                </View>
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

        {/* Certifications & Languages */}
        <View style={styles.twoColumnRow}>
          {certifications.length > 0 && (
            <View style={styles.column}>
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