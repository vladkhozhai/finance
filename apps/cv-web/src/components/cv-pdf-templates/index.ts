/**
 * CV PDF Templates
 * Export all PDF templates for CV generation
 */

import { ModernPDF } from "./ModernPDF";
import { ProfessionalPDF } from "./ProfessionalPDF";
import { CreativePDF } from "./CreativePDF";

// Re-export templates
export { ModernPDF, ProfessionalPDF, CreativePDF };
export type { PDFTemplateProps, TemplateType } from "./types";

// Template component map
export const PDF_TEMPLATES = {
  modern: ModernPDF,
  professional: ProfessionalPDF,
  creative: CreativePDF,
} as const;

export type PDFTemplateId = keyof typeof PDF_TEMPLATES;
