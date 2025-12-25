/**
 * Professional PDF Template
 * Traditional single-column layout with minimal styling
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
import { formatDateRange, getFullName, getLocation, getPlatformName } from "./utils";

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#333333",
  },
  // Header styles
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
    textAlign: "center",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  title: {
    fontSize: 12,
    color: "#555555",
    textAlign: "center",
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 15,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    fontSize: 9,
  },
  contactDivider: {
    marginHorizontal: 8,
    color: "#999999",
  },
  // Section styles
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
    paddingBottom: 3,
  },
  // Summary
  summary: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#444444",
    textAlign: "justify",
  },
  // Experience styles
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
    color: "#555555",
  },
  company: {
    fontSize: 10,
    color: "#555555",
    marginBottom: 4,
  },
  description: {
    fontSize: 9,
    color: "#444444",
    lineHeight: 1.4,
    marginBottom: 3,
  },
  bulletList: {
    paddingLeft: 10,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bullet: {
    width: 10,
    fontSize: 9,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: "#444444",
  },
  // Education styles
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
    color: "#555555",
  },
  gpa: {
    fontSize: 9,
    color: "#666666",
    fontStyle: "italic",
  },
  // Skills section
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  skillCategory: {
    marginBottom: 6,
  },
  skillCategoryTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 2,
  },
  skillsList: {
    fontSize: 9,
    color: "#444444",
  },
  // Projects
  projectItem: {
    marginBottom: 10,
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  projectName: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000000",
  },
  projectRole: {
    fontSize: 9,
    color: "#555555",
    fontStyle: "italic",
  },
  technologies: {
    fontSize: 8,
    color: "#666666",
    marginTop: 2,
  },
  // Certifications
  certItem: {
    marginBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  certName: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000000",
    flex: 1,
  },
  certOrg: {
    fontSize: 9,
    color: "#555555",
  },
  certDate: {
    fontSize: 9,
    color: "#666666",
  },
  // Languages
  languagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },
  languageItem: {
    fontSize: 9,
  },
  languageName: {
    fontWeight: "bold",
  },
  languageLevel: {
    color: "#555555",
  },
  // Links
  link: {
    color: "#0066cc",
    textDecoration: "none",
  },
  linksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 5,
  },
  linkItem: {
    fontSize: 9,
  },
});

// Group skills by category
function groupSkillsByCategory(
  skills: PDFTemplateProps["skills"]
): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  for (const skill of skills) {
    const category = skill.category || "General";
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(skill.skill_name);
  }
  return grouped;
}

export function ProfessionalPDF({
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
  const groupedSkills = groupSkillsByCategory(skills);

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
              <>
                <Text style={styles.contactDivider}>|</Text>
                <Text style={styles.contactItem}>{profile.phone}</Text>
              </>
            )}
            {location && (
              <>
                <Text style={styles.contactDivider}>|</Text>
                <Text style={styles.contactItem}>{location}</Text>
              </>
            )}
          </View>
          {socialLinks.length > 0 && (
            <View style={styles.linksRow}>
              {socialLinks.map((link, index) => (
                <Link key={index} src={link.url} style={styles.link}>
                  <Text style={styles.linkItem}>
                    {getPlatformName(link.platform)}
                  </Text>
                </Link>
              ))}
            </View>
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
                  {exp.location && `, ${exp.location}`}
                  {exp.is_remote && " (Remote)"}
                </Text>
                {exp.description && (
                  <Text style={styles.description}>{exp.description}</Text>
                )}
                {exp.achievements && exp.achievements.length > 0 && (
                  <View style={styles.bulletList}>
                    {exp.achievements.map((achievement, idx) => (
                      <View key={idx} style={styles.bulletItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.bulletText}>{achievement}</Text>
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
                <Text style={styles.institution}>{edu.institution_name}</Text>
                {edu.gpa && <Text style={styles.gpa}>GPA: {edu.gpa}</Text>}
                {edu.description && (
                  <Text style={styles.description}>{edu.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            {Object.entries(groupedSkills).map(([category, skillNames]) => (
              <View key={category} style={styles.skillCategory}>
                <Text style={styles.skillCategoryTitle}>{category}:</Text>
                <Text style={styles.skillsList}>{skillNames.join(", ")}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.map((proj, index) => (
              <View key={index} style={styles.projectItem}>
                <View style={styles.projectHeader}>
                  <Text style={styles.projectName}>{proj.project_name}</Text>
                  {(proj.start_date || proj.end_date) && (
                    <Text style={styles.dateRange}>
                      {formatDateRange(
                        proj.start_date || "",
                        proj.end_date,
                        proj.is_ongoing
                      )}
                    </Text>
                  )}
                </View>
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
                <View style={{ flex: 1 }}>
                  <Text style={styles.certName}>{cert.certification_name}</Text>
                  <Text style={styles.certOrg}>{cert.issuing_organization}</Text>
                </View>
                <Text style={styles.certDate}>
                  {formatDateRange(cert.issue_date, null)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <View style={styles.languagesContainer}>
              {languages.map((lang, index) => (
                <Text key={index} style={styles.languageItem}>
                  <Text style={styles.languageName}>{lang.language_name}</Text>
                  <Text style={styles.languageLevel}> ({lang.proficiency})</Text>
                </Text>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}
