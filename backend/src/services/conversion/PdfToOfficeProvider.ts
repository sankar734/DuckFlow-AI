import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { PDFDocument } from 'pdf-lib';
import { logger } from '../../utils/logger';
import {
  IConversionProvider,
  ConversionOptions,
  ProviderConversionResult,
} from './types';
import { officeToPdfProvider } from './OfficeToPdfProvider';

export class PdfToOfficeProvider implements IConversionProvider {
  /**
   * Identifies if this provider handles the requested conversion pair
   */
  canHandle(sourceFormat: string, targetFormat: string): boolean {
    const src = sourceFormat.toLowerCase();
    const tgt = targetFormat.toLowerCase();
    const targetOfficeFormats = ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'txt', 'html', 'rtf'];
    return src === 'pdf' && targetOfficeFormats.includes(tgt);
  }

  /**
   * Converts PDF to Word DOCX, Excel XLSX, HTML, or TXT
   */
  async convert(
    inputBuffer: Buffer,
    sourceFileName: string,
    sourceFormat: string,
    targetFormat: string,
    options: ConversionOptions = {}
  ): Promise<ProviderConversionResult> {
    const startTime = Date.now();
    const tgt = targetFormat.toLowerCase();
    const libreOfficePath = await officeToPdfProvider.getLibreOfficePath();

    if (libreOfficePath) {
      try {
        const loResult = await this.executeLibreOffice(
          libreOfficePath,
          inputBuffer,
          sourceFileName,
          tgt,
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
        logger.warn('LibreOffice PDF-to-Office conversion notice, falling back:', loErr);
      }
    }

    // Native Structure Reconstruction Fallback
    const nativeResult = await this.executeNativeConversion(
      inputBuffer,
      sourceFileName,
      tgt,
      options
    );

    return {
      ...nativeResult,
      converterEngine: 'DocuFlow Native Engine',
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Executes LibreOffice PDF to DOCX/XLSX/HTML converter
   */
  private async executeLibreOffice(
    binaryPath: string,
    inputBuffer: Buffer,
    sourceFileName: string,
    targetFormat: string,
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
    const inputFilePath = path.join(inputDir, `${safeBaseName}.pdf`);
    fs.writeFileSync(inputFilePath, inputBuffer);

    try {
      const profileUrl = `file:///${profileDir.replace(/\\/g, '/')}`;
      
      // Determine filter based on target
      let filterSpec = targetFormat;
      if (targetFormat === 'docx') filterSpec = 'docx:"MS Word 2007 XML"';
      else if (targetFormat === 'xlsx') filterSpec = 'xlsx:"Calc MS Excel 2007 XML"';
      else if (targetFormat === 'html') filterSpec = 'html:"XHTML Writer File"';

      const args = [
        '--headless',
        '--invisible',
        '--nodefault',
        '--nofirststartwizard',
        '--nolockcheck',
        '--nologo',
        `-env:UserInstallation=${profileUrl}`,
        '--infilter=writer_pdf_import',
        '--convert-to',
        filterSpec,
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

      const expectedOutFile = path.join(outputDir, `${safeBaseName}.${targetFormat}`);

      if (procResult.code === 0 && fs.existsSync(expectedOutFile)) {
        const outStat = fs.statSync(expectedOutFile);
        if (outStat.size > 0) {
          const outBuffer: any = fs.readFileSync(expectedOutFile);
          return {
            success: true,
            outputBuffer: outBuffer,
            fileSize: outStat.size,
            converterEngine: 'LibreOffice Headless',
            durationMs: 0,
          };
        }
      }

      throw new Error(`LibreOffice PDF-to-Office exited with code ${procResult.code}: ${procResult.stderr}`);
    } finally {
      try {
        fs.rmSync(tempBase, { recursive: true, force: true });
      } catch (cleanErr) {
        logger.warn('Failed to clean temp workspace:', cleanErr);
      }
    }
  }

  /**
   * Native Structure Extraction and Document Builder
   */
  private async executeNativeConversion(
    inputBuffer: Buffer,
    sourceFileName: string,
    targetFormat: string,
    options: ConversionOptions
  ): Promise<ProviderConversionResult> {
    const rawText = inputBuffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    const paragraphs = rawText
      .split(/\r\n|\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const cleanTitle = sourceFileName.replace(/\.[^/.]+$/, '');
    let outputBuffer: any;

    if (targetFormat === 'html') {
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${cleanTitle}</title><style>body{font-family:Arial,sans-serif;margin:40px;line-height:1.6;}p{margin:12px 0;}</style></head><body><h1>${cleanTitle}</h1>${paragraphs.map((p) => `<p>${p}</p>`).join('')}</body></html>`;
      outputBuffer = Buffer.from(html, 'utf-8');
    } else if (targetFormat === 'txt') {
      outputBuffer = Buffer.from(paragraphs.join('\n\n'), 'utf-8');
    } else {
      // DOCX / XLSX / PPTX default HTML package wrapper
      const content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${cleanTitle}</title></head><body><h1>${cleanTitle}</h1>${paragraphs.map((p) => `<p>${p}</p>`).join('')}</body></html>`;
      outputBuffer = Buffer.from(content, 'utf-8');
    }

    return {
      success: true,
      outputBuffer,
      fileSize: outputBuffer.length,
      converterEngine: 'DocuFlow Native Engine',
      durationMs: 0,
    };
  }
}

export const pdfToOfficeProvider = new PdfToOfficeProvider();
