export { ModernTemplate } from "./ModernTemplate";
export { ProfessionalTemplate } from "./ProfessionalTemplate";
export { CreativeTemplate } from "./CreativeTemplate";
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
} as const;

export type TemplateId = keyof typeof TEMPLATES;
