/**
 * CV PDF Templates
 * Export all PDF templates for CV generation
 */

import { ModernPDF } from "./ModernPDF";
import { ProfessionalPDF } from "./ProfessionalPDF";
import { CreativePDF } from "./CreativePDF";
import { MinimalPDF } from "./MinimalPDF";
import { ExecutivePDF } from "./ExecutivePDF";
import { TechnicalPDF } from "./TechnicalPDF";
import { SimplePDF } from "./SimplePDF";
import { CompactPDF } from "./CompactPDF";
import { CorporatePDF } from "./CorporatePDF";
import { AcademicPDF } from "./AcademicPDF";
import { ElegantPDF } from "./ElegantPDF";
import { DesignerPDF } from "./DesignerPDF";

// Re-export templates
export {
  ModernPDF,
  ProfessionalPDF,
  CreativePDF,
  MinimalPDF,
  ExecutivePDF,
  TechnicalPDF,
  SimplePDF,
  CompactPDF,
  CorporatePDF,
  AcademicPDF,
  ElegantPDF,
  DesignerPDF,
};
export type { PDFTemplateProps, TemplateType } from "./types";

// Template component map - maps template slugs to PDF components
export const PDF_TEMPLATES = {
  modern: ModernPDF,
  professional: ProfessionalPDF,
  creative: CreativePDF,
  minimal: MinimalPDF,
  executive: ExecutivePDF,
  technical: TechnicalPDF,
  simple: SimplePDF,
  compact: CompactPDF,
  corporate: CorporatePDF,
  academic: AcademicPDF,
  elegant: ElegantPDF,
  designer: DesignerPDF,
} as const;

export type PDFTemplateId = keyof typeof PDF_TEMPLATES;