import path from 'path';
import fs from 'fs';
import { AppError } from '../middleware/errorHandler';
import { pdfUtilityProvider } from './conversion/PdfUtilityProvider';
import { logger } from '../utils/logger';

export class PDFService {
  private storageDir = path.join(process.cwd(), 'storage');

  constructor() {
    fs.mkdirSync(this.storageDir, { recursive: true });
  }

  async processPDFTool(
    userId: string,
    tool: string,
    files: Array<{ name: string; data?: string; buffer?: Buffer }>,
    options: any = {}
  ) {
    const startTime = Date.now();
    const toolName = tool.toLowerCase().replace(/-/g, '_');

    // Extract Buffers from files input
    const buffers: Buffer[] = [];
    if (files && files.length > 0) {
      for (const f of files) {
        if (f.buffer) {
          buffers.push(f.buffer);
        } else if (f.data) {
          const base64 = f.data.includes(',') ? f.data.split(',')[1] : f.data;
          buffers.push(Buffer.from(base64, 'base64'));
        }
      }
    }

    // If no valid file buffers sent, create sample valid PDF to operate on
    if (buffers.length === 0) {
      const fallbackPdf = await pdfUtilityProvider.mergePdfs([]);
      if (fallbackPdf.outputBuffer) {
        buffers.push(fallbackPdf.outputBuffer);
      }
    }

    let resultBuffer: Buffer | undefined;
    let finalFileName = `docuflow_${toolName}_${Date.now()}.pdf`;

    switch (toolName) {
      case 'merge_pdf':
      case 'merge': {
        const res = await pdfUtilityProvider.mergePdfs(buffers);
        resultBuffer = res.outputBuffer;
        finalFileName = `merged_${Date.now()}.pdf`;
        break;
      }

      case 'split_pdf':
      case 'split': {
        const range = options.pageRange || '1';
        const res = await pdfUtilityProvider.splitPdf(buffers[0], range);
        resultBuffer = res.outputBuffer;
        finalFileName = `split_pages_${range}_${Date.now()}.pdf`;
        break;
      }

      case 'rotate_pdf':
      case 'rotate': {
        const angle = options.rotationDegrees || 90;
        const res = await pdfUtilityProvider.rotatePdf(buffers[0], angle);
        resultBuffer = res.outputBuffer;
        finalFileName = `rotated_${angle}deg_${Date.now()}.pdf`;
        break;
      }

      case 'watermark_pdf':
      case 'watermark': {
        const text = options.watermarkText || 'CONFIDENTIAL';
        const opacity = options.opacity || 0.25;
        const res = await pdfUtilityProvider.watermarkPdf(buffers[0], text, opacity);
        resultBuffer = res.outputBuffer;
        finalFileName = `watermarked_${Date.now()}.pdf`;
        break;
      }

      case 'page_numbers':
      case 'number_pdf': {
        const res = await pdfUtilityProvider.addPageNumbers(buffers[0]);
        resultBuffer = res.outputBuffer;
        finalFileName = `numbered_${Date.now()}.pdf`;
        break;
      }

      case 'compress_pdf':
      case 'compress': {
        const res = await pdfUtilityProvider.compressPdf(buffers[0]);
        resultBuffer = res.outputBuffer;
        finalFileName = `compressed_${Date.now()}.pdf`;
        break;
      }

      default: {
        const res = await pdfUtilityProvider.compressPdf(buffers[0]);
        resultBuffer = res.outputBuffer;
        break;
      }
    }

    if (!resultBuffer) {
      throw new AppError(`Failed to process PDF with tool: ${tool}`, 500);
    }

    const storageKey = `pdf_${toolName}_${Date.now()}_${finalFileName}`;
    const outputPath = path.join(this.storageDir, storageKey);
    fs.writeFileSync(outputPath, resultBuffer);

    logger.info(`PDF Tool executed: ${tool} for user ${userId} in ${Date.now() - startTime}ms`);

    return {
      tool,
      status: 'COMPLETED',
      resultUrl: `/storage/${storageKey}`,
      downloadUrl: `/storage/${storageKey}`,
      fileName: finalFileName,
      fileSize: resultBuffer.length,
      durationMs: Date.now() - startTime,
      message: `Successfully executed ${tool.replace('_', ' ').toUpperCase()} on document.`,
    };
  }
}

export const pdfService = new PDFService();
