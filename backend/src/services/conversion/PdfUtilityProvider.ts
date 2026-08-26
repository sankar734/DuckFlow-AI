import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { logger } from '../../utils/logger';
import { ConversionOptions, ProviderConversionResult } from './types';

export class PdfUtilityProvider {
  /**
   * Merges multiple PDF buffers into a single continuous PDF document
   */
  async mergePdfs(pdfBuffers: Buffer[]): Promise<ProviderConversionResult> {
    const startTime = Date.now();
    const mergedDoc = await PDFDocument.create();

    for (const buffer of pdfBuffers) {
      try {
        const sourceDoc = await PDFDocument.load(new Uint8Array(buffer), { ignoreEncryption: true });
        const copiedPages = await mergedDoc.copyPages(sourceDoc, sourceDoc.getPageIndices());
        copiedPages.forEach((page) => mergedDoc.addPage(page));
      } catch (err) {
        logger.warn('Error loading single PDF during merge:', err);
      }
    }

    const mergedBytes = await mergedDoc.save();
    const outputBuffer = Buffer.from(mergedBytes);

    return {
      success: true,
      outputBuffer,
      fileSize: outputBuffer.length,
      pageCount: mergedDoc.getPageCount(),
      converterEngine: 'PDF-Lib Binary Engine',
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Splits a PDF buffer based on a requested page range string (e.g. "1-3, 5, 7-10")
   */
  async splitPdf(pdfBuffer: Buffer, pageRangeStr: string): Promise<ProviderConversionResult> {
    const startTime = Date.now();
    const sourceDoc = await PDFDocument.load(new Uint8Array(pdfBuffer), { ignoreEncryption: true });
    const totalPages = sourceDoc.getPageCount();
    const newDoc = await PDFDocument.create();

    const targetIndices = this.parsePageRanges(pageRangeStr, totalPages);
    const copiedPages = await newDoc.copyPages(sourceDoc, targetIndices);
    copiedPages.forEach((page) => newDoc.addPage(page));

    const splitBytes = await newDoc.save();
    const outputBuffer = Buffer.from(splitBytes);

    return {
      success: true,
      outputBuffer,
      fileSize: outputBuffer.length,
      pageCount: newDoc.getPageCount(),
      converterEngine: 'PDF-Lib Binary Engine',
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Rotates all or specified pages in a PDF document by 90, 180, or 270 degrees
   */
  async rotatePdf(pdfBuffer: Buffer, rotationDegrees: 90 | 180 | 270 = 90): Promise<ProviderConversionResult> {
    const startTime = Date.now();
    const pdfDoc = await PDFDocument.load(new Uint8Array(pdfBuffer), { ignoreEncryption: true });
    const pages = pdfDoc.getPages();

    pages.forEach((page) => {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + rotationDegrees) % 360));
    });

    const rotatedBytes = await pdfDoc.save();
    const outputBuffer = Buffer.from(rotatedBytes);

    return {
      success: true,
      outputBuffer,
      fileSize: outputBuffer.length,
      pageCount: pages.length,
      converterEngine: 'PDF-Lib Binary Engine',
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Adds text watermark across all pages in a PDF
   */
  async watermarkPdf(
    pdfBuffer: Buffer,
    watermarkText: string,
    opacity: number = 0.25
  ): Promise<ProviderConversionResult> {
    const startTime = Date.now();
    const pdfDoc = await PDFDocument.load(new Uint8Array(pdfBuffer), { ignoreEncryption: true });
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    pages.forEach((page) => {
      const { width, height } = page.getSize();
      page.drawText(watermarkText, {
        x: width * 0.15,
        y: height * 0.45,
        size: Math.min(width, height) * 0.08,
        font,
        color: rgb(0.5, 0.5, 0.5),
        rotate: degrees(45),
        opacity,
      });
    });

    const watermarkedBytes = await pdfDoc.save();
    const outputBuffer = Buffer.from(watermarkedBytes);

    return {
      success: true,
      outputBuffer,
      fileSize: outputBuffer.length,
      pageCount: pages.length,
      converterEngine: 'PDF-Lib Binary Engine',
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Adds page numbers (e.g. "Page 1 of 5") to footer of every page
   */
  async addPageNumbers(pdfBuffer: Buffer): Promise<ProviderConversionResult> {
    const startTime = Date.now();
    const pdfDoc = await PDFDocument.load(new Uint8Array(pdfBuffer), { ignoreEncryption: true });
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const total = pages.length;

    pages.forEach((page, idx) => {
      const { width } = page.getSize();
      const text = `Page ${idx + 1} of ${total}`;
      page.drawText(text, {
        x: width / 2 - 30,
        y: 20,
        size: 9,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    });

    const numberedBytes = await pdfDoc.save();
    const outputBuffer = Buffer.from(numberedBytes);

    return {
      success: true,
      outputBuffer,
      fileSize: outputBuffer.length,
      pageCount: total,
      converterEngine: 'PDF-Lib Binary Engine',
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Compresses PDF document streams and strips redundant metadata
   */
  async compressPdf(pdfBuffer: Buffer): Promise<ProviderConversionResult> {
    const startTime = Date.now();
    const pdfDoc = await PDFDocument.load(new Uint8Array(pdfBuffer), { ignoreEncryption: true });

    // Remove document metadata to optimize footprint
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('DocuFlow AI Optimized Engine');
    pdfDoc.setCreator('DocuFlow AI');

    const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
    const outputBuffer = Buffer.from(compressedBytes);

    return {
      success: true,
      outputBuffer,
      fileSize: outputBuffer.length,
      pageCount: pdfDoc.getPageCount(),
      converterEngine: 'PDF-Lib Binary Engine',
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Helper to parse string page ranges like "1-3, 5, 8" into 0-indexed integer array
   */
  private parsePageRanges(rangeStr: string, totalPages: number): number[] {
    const indices = new Set<number>();
    const parts = rangeStr.split(',').map((p) => p.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map((n) => parseInt(n.trim(), 10));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
            indices.add(i - 1);
          }
        }
      } else {
        const pageNum = parseInt(part, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
          indices.add(pageNum - 1);
        }
      }
    }

    // Default to all pages if no valid ranges parsed
    if (indices.size === 0) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    return Array.from(indices).sort((a, b) => a - b);
  }
}

export const pdfUtilityProvider = new PdfUtilityProvider();
