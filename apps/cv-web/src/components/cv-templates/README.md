# CV Templates

Three professional CV template React components for CVFlow Phase 3.

## Templates

1. **ModernTemplate** - Clean two-column layout with blue accents
   - Left sidebar (30%): photo, contact info, skills, languages
   - Right main area (70%): name, title, summary, experience, education, projects
   - Colors: neutral grays with blue accent

2. **ProfessionalTemplate** - Traditional single column, corporate style
   - Header: name, title, contact info in one row
   - Sections stacked vertically
   - Colors: black/white with minimal color

3. **CreativeTemplate** - Colorful modern design with gradient header
   - Bold header with gradient color block
   - Two-column layout below header
   - More visual elements, badges for skills
   - Colors: vibrant purple/pink/orange gradient

## Usage

```typescript
import { ModernTemplate, ProfessionalTemplate, CreativeTemplate } from "@/components/cv-templates";
import type { CVTemplateProps } from "@/components/cv-templates";

// Example data
const cvData: CVTemplateProps = {
  profile: {
    first_name: "John",
    last_name: "Doe",
    professional_title: "Senior Software Engineer",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    address_city: "San Francisco",
    address_country: "USA",
    professional_summary: "Experienced software engineer with 10+ years...",
    profile_photo_url: "/path/to/photo.jpg"
  },
  socialLinks: [
    { platform: "LinkedIn", url: "https://linkedin.com/in/johndoe" },
    { platform: "GitHub", url: "https://github.com/johndoe" }
  ],
  workExperiences: [
    {
      company_name: "Tech Corp",
      job_title: "Senior Software Engineer",
      employment_type: "Full-time",
      location: "San Francisco, CA",
      is_remote: false,
      start_date: "2020-01-01",
      end_date: null,
      is_current: true,
      description: "Leading development of core platform features...",
      achievements: [
        "Reduced API response time by 40%",
        "Led team of 5 engineers"
      ]
    }
  ],
  education: [
    {
      institution_name: "University of California",
      degree: "Bachelor of Science",
      field_of_study: "Computer Science",
      start_date: "2010-09-01",
      end_date: "2014-06-01",
      is_current: false,
      gpa: "3.8"
    }
  ],
  skills: [
    { skill_name: "React", proficiency_level: "Expert", category: "Frontend" },
    { skill_name: "Node.js", proficiency_level: "Advanced", category: "Backend" }
  ],
  projects: [],
  certifications: [],
  languages: [
    { language_name: "English", proficiency: "Native" },
    { language_name: "Spanish", proficiency: "Intermediate" }
  ]
};

// Render a template
function CVPreview({ templateId }: { templateId: string }) {
  switch (templateId) {
    case "modern":
      return <ModernTemplate {...cvData} />;
    case "professional":
      return <ProfessionalTemplate {...cvData} />;
    case "creative":
      return <CreativeTemplate {...cvData} />;
    default:
      return <ModernTemplate {...cvData} />;
  }
}
```

## Features

- **Responsive Design**: All templates scale properly for preview and print
- **Print-Friendly**: Includes @media print styles for proper printing
- **Null/Empty Handling**: Gracefully handles missing or null data
- **Date Formatting**: Formats dates nicely (e.g., "Jan 2020 - Present")
- **Lucide Icons**: Uses Lucide icons for contact info and social links
- **Tailwind CSS**: Styled with Tailwind utility classes
- **Client Components**: All templates use "use client" directive

## Template Map

The `index.ts` file exports a `TEMPLATES` object that can be used to map template IDs to their metadata:

```typescript
import { TEMPLATES } from "@/components/cv-templates";

// List all templates
Object.values(TEMPLATES).forEach(template => {
  console.log(template.name, template.description);
});

// Get template by ID
const modernTemplate = TEMPLATES.modern;
```

## File Structure

```
cv-templates/
├── types.ts                    # Shared TypeScript types
├── ModernTemplate.tsx          # Modern two-column template
├── ProfessionalTemplate.tsx    # Professional single-column template
├── CreativeTemplate.tsx        # Creative gradient header template
├── index.ts                    # Export all templates + template map
└── README.md                   # This file
```
