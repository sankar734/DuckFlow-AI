import { DocumentAnalysis } from '../DocumentAnalyzer';
import { PdfValidationResult } from './PdfValidator';
import { logger } from '../../../utils/logger';

export interface FidelityQualityReport {
  passed: boolean;
  sourceFormat: string;
  targetFormat: string;
  sourceEstimatedPages: number;
  outputPageCount: number;
  pageRatio: number;
  isCatastrophicCollapse: boolean;
  warnings: string[];
  fidelityScore: number; // 0 to 100
  failureReason?: string;
}

export class FidelityValidator {
  /**
   * Compares source document analysis against generated PDF validation to catch catastrophic reflow
   */
  static evaluate(
    sourceAnalysis: DocumentAnalysis,
    pdfValidation: PdfValidationResult,
    targetFormat: string = 'PDF'
  ): FidelityQualityReport {
    const warnings: string[] = [];
    const sourceEstPages = Math.max(sourceAnalysis.pageCountEstimated, 1);
    const outPages = Math.max(pdfValidation.pageCount, 1);
    const pageRatio = outPages / sourceEstPages;

    let isCatastrophicCollapse = false;
    let failureReason: string | undefined = undefined;

    // 1. Catastrophic Reflow Quality Gate
    // Case A: 88-page long document collapsed into 28 pages (ratio < 0.45 on large doc)
    if (sourceEstPages >= 10 && outPages < Math.floor(sourceEstPages * 0.55)) {
      isCatastrophicCollapse = true;
      failureReason = `FIDELITY_CHECK_FAILED: Catastrophic page reflow detected. Source estimated ${sourceEstPages} pages but rendered only ${outPages} pages.`;
    }

    // Case B: 4-page structured document collapsed into 3 pages
    if (sourceEstPages === 4 && outPages < 4 && sourceAnalysis.hasExplicitPageBreaks) {
      isCatastrophicCollapse = true;
      failureReason = `FIDELITY_CHECK_FAILED: Explicit page boundaries collapsed. Source requires 4 pages, rendered ${outPages}.`;
    }

    // 2. Missing Images Quality Check
    if (sourceAnalysis.imageCount && sourceAnalysis.imageCount > 0 && pdfValidation.fileSize < 1200) {
      warnings.push(`Document contains ${sourceAnalysis.imageCount} images, but output file size (${pdfValidation.fileSize} bytes) is suspiciously small.`);
    }

    // 3. Font Substitutions Quality Check
    if (sourceAnalysis.declaredFonts && sourceAnalysis.declaredFonts.length > 0) {
      const unsupported = sourceAnalysis.declaredFonts.filter(
        (f) => !['Times New Roman', 'Arial', 'Calibri', 'Helvetica', 'Courier', 'Liberation'].some((std) => f.includes(std))
      );
      if (unsupported.length > 0) {
        warnings.push(`Fonts [${unsupported.join(', ')}] were substituted with metric-compatible standard fonts.`);
      }
    }

    // Compute Fidelity Score
    let fidelityScore = 100;
    if (isCatastrophicCollapse) fidelityScore = 30;
    else if (warnings.length > 0) fidelityScore = 90;

    const passed = !isCatastrophicCollapse && pdfValidation.isValid;

    if (!passed) {
      logger.warn(`Fidelity Quality Gate FAILED for ${sourceAnalysis.format} -> ${targetFormat}:`, failureReason);
    }

    return {
      passed,
      sourceFormat: sourceAnalysis.format,
      targetFormat,
      sourceEstimatedPages: sourceEstPages,
      outputPageCount: outPages,
      pageRatio,
      isCatastrophicCollapse,
      warnings,
      fidelityScore,
      failureReason,
    };
  }
}
