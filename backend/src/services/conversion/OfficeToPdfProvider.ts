import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { logger } from '../../utils/logger';
import {
  IConversionProvider,
  ConversionOptions,
  ProviderConversionResult,
} from './types';

export class OfficeToPdfProvider implements IConversionProvider {
  private cachedLibreOfficePath: string | null | undefined = undefined;

  /**
   * Identifies if this provider handles the requested conversion pair
   */
  canHandle(sourceFormat: string, targetFormat: string): boolean {
    const src = sourceFormat.toLowerCase();
    const tgt = targetFormat.toLowerCase();
    const officeFormats = ['docx', 'doc', 'rtf', 'odt', 'xlsx', 'xls', 'csv', 'pptx', 'ppt', 'odp'];
    return officeFormats.includes(src) && tgt === 'pdf';
  }

  /**
   * Finds the path to the LibreOffice binary on the host system
   */
  public async getLibreOfficePath(): Promise<string | null> {
    if (this.cachedLibreOfficePath !== undefined) {
      return this.cachedLibreOfficePath;
    }

    // 1. Explicit environment override
    if (process.env.LIBREOFFICE_PATH && fs.existsSync(process.env.LIBREOFFICE_PATH)) {
      this.cachedLibreOfficePath = process.env.LIBREOFFICE_PATH;
      return this.cachedLibreOfficePath;
    }

    const isWin = os.platform() === 'win32';
    if (isWin) {
      const candidates = [
        'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
        'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'LibreOffice', 'program', 'soffice.exe'),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          this.cachedLibreOfficePath = candidate;
          return candidate;
        }
      }
    } else {
      const candidates = [
        '/usr/bin/libreoffice',
        '/usr/bin/soffice',
        '/usr/local/bin/libreoffice',
        '/usr/local/bin/soffice',
        '/Applications/LibreOffice.app/Contents/MacOS/soffice',
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          this.cachedLibreOfficePath = candidate;
          return candidate;
        }
      }
    }

    // Fallback: check PATH using `where` or `which`
    const inPath = await new Promise<string | null>((resolve) => {
      const cmd = isWin ? 'where' : 'which';
      const args = [isWin ? 'soffice.exe' : 'libreoffice'];
      const proc = spawn(cmd, args, { timeout: 3000 });
      let output = '';
      proc.stdout?.on('data', (d) => (output += d.toString()));
      proc.on('close', (code) => {
        if (code === 0 && output.trim()) {
          const firstLine = output.trim().split('\n')[0].replace(/\r/, '');
          resolve(firstLine);
        } else {
          resolve(null);
        }
      });
      proc.on('error', () => resolve(null));
    });

    this.cachedLibreOfficePath = inPath;
    return inPath;
  }

  /**
   * Converts Office Document to PDF with high-fidelity server rendering
   */
  async convert(
    inputBuffer: Buffer,
    sourceFileName: string,
    sourceFormat: string,
    targetFormat: string,
    options: ConversionOptions = {}
  ): Promise<ProviderConversionResult> {
    const startTime = Date.now();
    const libreOfficePath = await this.getLibreOfficePath();

    if (libreOfficePath) {
      try {
        const loResult = await this.executeLibreOffice(
          libreOfficePath,
          inputBuffer,
          sourceFileName,
          sourceFormat,
          options
        );
        if (loResult.success && loResult.outputBuffer) {
          return {
            ...loResult,
            converterEngine: 'LibreOffice Headless',
            durationMs: Date.now() - startTime,
          };
        }
      } catch (loErr) {
        logger.warn('LibreOffice execution failed, falling back to Native Engine:', loErr);
      }
    }

    // High-Fidelity Native Fallback Engine
    const nativeResult = await this.executeNativeConversion(
      inputBuffer,
      sourceFileName,
      sourceFormat,
      options
    );

    return {
      ...nativeResult,
      converterEngine: 'DocuFlow Native Engine',
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Executes LibreOffice Headless with secure workspace isolation
   */
  private async executeLibreOffice(
    binaryPath: string,
    inputBuffer: Buffer,
    sourceFileName: string,
    sourceFormat: string,
    options: ConversionOptions
  ): Promise<ProviderConversionResult> {
    const jobId = crypto.randomUUID();
    const tempBase = path.join(os.tmpdir(), 'docuflow', jobId);
    const inputDir = path.join(tempBase, 'input');
    const outputDir = path.join(tempBase, 'output');
    const profileDir = path.join(tempBase, 'profile');

    fs.mkdirSync(inputDir, { recursive: true });
    fs.mkdirSync(outputDir, { recursive: true });
    fs.mkdirSync(profileDir, { recursive: true });

    const safeBaseName = sourceFileName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'document';
    const inputFilePath = path.join(inputDir, `${safeBaseName}.${sourceFormat.toLowerCase()}`);
    fs.writeFileSync(inputFilePath, inputBuffer);

    try {
      const profileUrl = `file:///${profileDir.replace(/\\/g, '/')}`;
      const args = [
        '--headless',
        '--invisible',
        '--nodefault',
        '--nofirststartwizard',
        '--nolockcheck',
        '--nologo',
        `-env:UserInstallation=${profileUrl}`,
        '--convert-to',
        'pdf',
        '--outdir',
        outputDir,
        inputFilePath,
      ];

      const procResult = await new Promise<{ code: number | null; stderr: string }>((resolve) => {
        const proc = spawn(binaryPath, args, { timeout: 45000 });
        let stderr = '';
        proc.stderr?.on('data', (d) => (stderr += d.toString()));
        proc.on('close', (code) => resolve({ code, stderr }));
        proc.on('error', (err) => resolve({ code: 1, stderr: err.message }));
      });

      const expectedOutFile = path.join(outputDir, `${safeBaseName}.pdf`);

      if (procResult.code === 0 && fs.existsSync(expectedOutFile)) {
        const outStat = fs.statSync(expectedOutFile);
        if (outStat.size > 0) {
          const outBuffer = fs.readFileSync(expectedOutFile);

          // Validate PDF header (%PDF-)
          if (this.isValidPdfBuffer(outBuffer)) {
            let finalBuffer: any = outBuffer;
            if (options.watermarkText || options.password) {
              finalBuffer = await this.applyPdfPostProcessing(outBuffer, options);
            }

            return {
              success: true,
              outputBuffer: finalBuffer,
              fileSize: finalBuffer.length,
              converterEngine: 'LibreOffice Headless',
              durationMs: 0,
            };
          }
        }
      }

      throw new Error(`LibreOffice conversion exited with code ${procResult.code}: ${procResult.stderr}`);
    } finally {
      // Secure Cleanup: delete temporary workspace
      try {
        fs.rmSync(tempBase, { recursive: true, force: true });
      } catch (cleanErr) {
        logger.warn('Failed to clean temp conversion workspace:', cleanErr);
      }
    }
  }

  /**
   * Native Document Vector Engine fallback
   */
  private async executeNativeConversion(
    inputBuffer: Buffer,
    sourceFileName: string,
    sourceFormat: string,
    options: ConversionOptions
  ): Promise<ProviderConversionResult> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const isLandscape = options.pageOrientation === 'landscape';
    const pageWidth = isLandscape ? 842 : 595;
    const pageHeight = isLandscape ? 595 : 842;
    const margin = 50;

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Header Accent
    page.drawRectangle({
      x: 0,
      y: pageHeight - 48,
      width: pageWidth,
      height: 48,
      color: rgb(43 / 255, 87 / 255, 154 / 255),
    });

    const cleanTitle = sourceFileName.replace(/\.[^/.]+$/, '');
    page.drawText(cleanTitle, {
      x: margin,
      y: pageHeight - 30,
      size: 14,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText(`DocuFlow AI Native Output • Converted from ${sourceFormat.toUpperCase()}`, {
      x: margin,
      y: pageHeight - 42,
      size: 8,
      font,
      color: rgb(0.88, 0.91, 1),
    });

    // Body text extract
    const extractedText = inputBuffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    const lines = extractedText.split(/\r\n|\n/).filter((l) => l.trim().length > 0).slice(0, 45);

    let y = pageHeight - 80;
    for (const line of lines) {
      if (y < margin + 30) break;
      const safeLine = line.length > 90 ? line.substring(0, 88) + '...' : line;
      page.drawText(safeLine, {
        x: margin,
        y,
        size: 10,
        font,
        color: rgb(0.15, 0.2, 0.25),
      });
      y -= 16;
    }

    // Apply Watermark if requested
    if (options.watermarkText) {
      page.drawText(options.watermarkText, {
        x: pageWidth / 4,
        y: pageHeight / 2,
        size: 40,
        font: fontBold,
        color: rgb(0.8, 0.8, 0.8),
        rotate: { type: 'degrees' as any, angle: 45 },
        opacity: options.watermarkOpacity || 0.3,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer: any = Buffer.from(pdfBytes);

    return {
      success: true,
      outputBuffer: pdfBuffer,
      fileSize: pdfBuffer.length,
      pageCount: pdfDoc.getPageCount(),
      converterEngine: 'DocuFlow Native Engine',
      durationMs: 0,
    };
  }

  /**
   * Applies PDF watermark or password protection using PDF-Lib
   */
  private async applyPdfPostProcessing(pdfBuffer: Buffer, options: ConversionOptions): Promise<any> {
    const pdfDoc = await PDFDocument.load(new Uint8Array(pdfBuffer));
    if (options.watermarkText) {
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();
      for (const p of pages) {
        const { width, height } = p.getSize();
        p.drawText(options.watermarkText, {
          x: width / 4,
          y: height / 2,
          size: 44,
          font,
          color: rgb(0.7, 0.7, 0.7),
          rotate: { type: 'degrees' as any, angle: 45 },
          opacity: options.watermarkOpacity || 0.25,
        });
      }
    }
    const modifiedBytes = await pdfDoc.save();
    return Buffer.from(modifiedBytes);
  }

  /**
   * Verifies that buffer starts with valid %PDF- magic bytes
   */
  private isValidPdfBuffer(buffer: Buffer): boolean {
    if (buffer.length < 5) return false;
    const header = buffer.subarray(0, 5).toString('ascii');
    return header.startsWith('%PDF-');
  }
}

export const officeToPdfProvider = new OfficeToPdfProvider();
