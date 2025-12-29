/**
 * Test fixture data for profile sections
 */

export const PROFILE_PERSONAL_DATA = {
  firstName: "John",
  middleName: "Q",
  lastName: "Tester",
  professionalTitle: "Senior QA Engineer",
  phone: "+1 (555) 123-4567",
  addressStreet: "123 Test Street",
  addressCity: "San Francisco",
  addressState: "CA",
  addressCountry: "United States",
  addressPostalCode: "94102",
  professionalSummary:
    "Experienced QA Engineer with 5+ years of expertise in test automation, end-to-end testing, and quality assurance best practices.",
  profilePhotoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
};

export const SOCIAL_LINKS_DATA = [
  {
    platform: "LinkedIn",
    url: "https://linkedin.com/in/johntester",
  },
  {
    platform: "GitHub",
    url: "https://github.com/johntester",
  },
  {
    platform: "Portfolio",
    url: "https://johntester.dev",
  },
];

export const WORK_EXPERIENCE_DATA = {
  companyName: "Tech Solutions Inc",
  jobTitle: "Senior QA Engineer",
  employmentType: "Full-time",
  location: "San Francisco, CA",
  isRemote: false,
  startDate: "2020-01-15",
  endDate: "",
  isCurrent: true,
  description:
    "Lead QA automation initiatives and implement comprehensive test strategies for web applications.",
  achievements: [
    "Reduced bug escape rate by 40%",
    "Implemented E2E test automation framework",
    "Mentored junior QA engineers",
  ],
};

export const EDUCATION_DATA = {
  institutionName: "University of California, Berkeley",
  degree: "Bachelor of Science",
  fieldOfStudy: "Computer Science",
  startDate: "2014-09-01",
  endDate: "2018-05-15",
  isCurrent: false,
  gpa: "3.8",
  description: "Focus on Software Engineering and Quality Assurance",
};

export const SKILLS_DATA = [
  {
    skillName: "Playwright",
    proficiencyLevel: "Expert",
    category: "Test Automation",
  },
  {
    skillName: "TypeScript",
    proficiencyLevel: "Advanced",
    category: "Programming Languages",
  },
  {
    skillName: "CI/CD",
    proficiencyLevel: "Advanced",
    category: "DevOps",
  },
];

export const PROJECT_DATA = {
  projectName: "E2E Test Framework",
  role: "Lead Developer",
  startDate: "2022-01-01",
  endDate: "",
  isOngoing: true,
  description:
    "Built comprehensive end-to-end testing framework using Playwright and TypeScript",
  technologies: ["Playwright", "TypeScript", "Docker", "GitHub Actions"],
  projectUrl: "https://github.com/johntester/e2e-framework",
};

export const CERTIFICATION_DATA = {
  certificationName: "ISTQB Certified Tester",
  issuingOrganization: "International Software Testing Qualifications Board",
  issueDate: "2019-06-01",
  expirationDate: "",
  credentialId: "ISTQB-123456",
  credentialUrl: "https://www.istqb.org/certifications",
};

export const LANGUAGE_DATA = [
  {
    languageName: "English",
    proficiency: "Native",
  },
  {
    languageName: "Spanish",
    proficiency: "Intermediate",
  },
];
