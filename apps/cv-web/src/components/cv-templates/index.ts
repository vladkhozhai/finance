export { ModernTemplate } from "./ModernTemplate";
export { ProfessionalTemplate } from "./ProfessionalTemplate";
export { CreativeTemplate } from "./CreativeTemplate";
export { MinimalTemplate } from "./MinimalTemplate";
export { ExecutiveTemplate } from "./ExecutiveTemplate";
export { TechnicalTemplate } from "./TechnicalTemplate";
export { SimpleTemplate } from "./SimpleTemplate";
export { CompactTemplate } from "./CompactTemplate";
export { CorporateTemplate } from "./CorporateTemplate";
export { AcademicTemplate } from "./AcademicTemplate";
export { ElegantTemplate } from "./ElegantTemplate";
export { DesignerTemplate } from "./DesignerTemplate";
export type { CVTemplateProps } from "./types";

export const TEMPLATES = {
  modern: {
    id: "modern",
    name: "Modern",
    description: "Clean two-column layout with blue accents",
    component: "ModernTemplate",
  },
  professional: {
    id: "professional",
    name: "Professional",
    description: "Traditional single column, minimal color",
    component: "ProfessionalTemplate",
  },
  creative: {
    id: "creative",
    name: "Creative",
    description: "Colorful modern design with gradient header",
    component: "CreativeTemplate",
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean design with subtle spacing",
    component: "MinimalTemplate",
  },
  executive: {
    id: "executive",
    name: "Executive",
    description: "Elegant serif design with golden accents",
    component: "ExecutiveTemplate",
  },
  technical: {
    id: "technical",
    name: "Technical",
    description: "Developer-focused with terminal aesthetics",
    component: "TechnicalTemplate",
  },
  simple: {
    id: "simple",
    name: "Simple",
    description: "Ultra-minimal monochrome design, maximum readability",
    component: "SimpleTemplate",
  },
  compact: {
    id: "compact",
    name: "Compact",
    description: "Dense single-page layout with teal accents",
    component: "CompactTemplate",
  },
  corporate: {
    id: "corporate",
    name: "Corporate",
    description: "Traditional business format with navy blue",
    component: "CorporateTemplate",
  },
  academic: {
    id: "academic",
    name: "Academic",
    description: "Research-focused with emphasis on education",
    component: "AcademicTemplate",
  },
  elegant: {
    id: "elegant",
    name: "Elegant",
    description: "Sophisticated serif design with gold accents",
    component: "ElegantTemplate",
  },
  designer: {
    id: "designer",
    name: "Designer",
    description: "Bold visual design with vibrant gradients",
    component: "DesignerTemplate",
  },
} as const;

export type TemplateId = keyof typeof TEMPLATES;
