import { PDFDocument } from 'pdf-lib';
import { logger } from '../../../utils/logger';

export interface PdfValidationResult {
  isValid: boolean;
  pageCount: number;
  fileSize: number;
  error?: string;
  isEncrypted?: boolean;
}

export class PdfValidator {
  /**
   * Validates generated PDF buffer for signature, structural parseability, and non-empty pages
   */
  static async validate(pdfBuffer?: Buffer): Promise<PdfValidationResult> {
    if (!pdfBuffer || pdfBuffer.length === 0) {
      return {
        isValid: false,
        pageCount: 0,
        fileSize: 0,
        error: 'OUTPUT_NOT_CREATED: Generated PDF buffer is null or empty',
      };
    }

    const fileSize = pdfBuffer.length;

    // 1. Check %PDF- header magic bytes
    if (fileSize < 5 || !pdfBuffer.subarray(0, 5).toString('ascii').startsWith('%PDF-')) {
      return {
        isValid: false,
        pageCount: 0,
        fileSize,
        error: 'OUTPUT_INVALID: Output file does not contain valid %PDF- signature',
      };
    }

    // 2. Parse structural integrity with PDFDocument
    try {
      const pdfDoc = await PDFDocument.load(new Uint8Array(pdfBuffer), { ignoreEncryption: true });
      const pageCount = pdfDoc.getPageCount();

      if (pageCount === 0) {
        return {
          isValid: false,
          pageCount: 0,
          fileSize,
          error: 'PDF_VALIDATION_FAILED: PDF has 0 rendered pages',
        };
      }

      return {
        isValid: true,
        pageCount,
        fileSize,
      };
    } catch (parseErr: any) {
      logger.error('PdfValidator parsing error:', parseErr);
      return {
        isValid: false,
        pageCount: 0,
        fileSize,
        error: `PDF_PARSE_FAILED: Generated PDF is corrupted or unreadable: ${parseErr.message}`,
      };
    }
  }
}
