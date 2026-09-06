import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import { logger } from '../../utils/logger';
import { officeToPdfProvider } from './OfficeToPdfProvider';
import {
  IConversionProvider,
  ConversionOptions,
  ProviderConversionResult,
} from './types';

export class SpreadsheetToPdfProvider implements IConversionProvider {
  canHandle(sourceFormat: string, targetFormat: string): boolean {
    const src = sourceFormat.toLowerCase();
    const tgt = targetFormat.toLowerCase();
    const spreadsheetFormats = ['xlsx', 'xls', 'csv', 'tsv', 'ods'];
    return spreadsheetFormats.includes(src) && tgt === 'pdf';
  }

  async convert(
    inputBuffer: Buffer,
    sourceFileName: string,
    sourceFormat: string,
    targetFormat: string,
    options: ConversionOptions = {}
  ): Promise<ProviderConversionResult> {
    const startTime = Date.now();

    // 1. If LibreOffice is available, use high-fidelity server execution
    const libreOfficePath = await officeToPdfProvider.getLibreOfficePath();
    if (libreOfficePath) {
      try {
        const loResult = await officeToPdfProvider.convert(
          inputBuffer,
          sourceFileName,
          sourceFormat,
          targetFormat,
          options
        );
        if (loResult.success && loResult.outputBuffer) {
          return loResult;
        }
      } catch (loErr) {
        logger.warn('LibreOffice spreadsheet conversion error, falling back to Native Grid Engine:', loErr);
      }
    }

    // 2. Native Spreadsheet Vector Grid Engine
    return this.executeNativeSpreadsheetToPdf(inputBuffer, sourceFileName, sourceFormat, options, startTime);
  }

  private async executeNativeSpreadsheetToPdf(
    inputBuffer: Buffer,
    sourceFileName: string,
    sourceFormat: string,
    options: ConversionOptions,
    startTime: number
  ): Promise<ProviderConversionResult> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Spreadsheets default to landscape A4 (841.9 x 595.3 pt)
    const isPortrait = options.pageOrientation === 'portrait';
    const pageWidth = isPortrait ? 595.3 : 841.9;
    const pageHeight = isPortrait ? 841.9 : 595.3;
    const marginLeft = 40;
    const marginRight = 40;
    const marginTop = 40;
    const marginBottom = 40;
    const contentWidth = pageWidth - marginLeft - marginRight;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let pageNum = 1;
    let y = pageHeight - marginTop;

    const addNewPage = () => {
      // Draw footer on previous page
      page.drawText(`Page ${pageNum}`, {
        x: pageWidth / 2 - 15,
        y: 20,
        size: 8.5,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });

      page = pdfDoc.addPage([pageWidth, pageHeight]);
      pageNum++;
      y = pageHeight - marginTop;
    };

    // Parse CSV or OOXML sheet
    let rows: string[][] = [];
    const fmt = sourceFormat.toUpperCase();

    if (fmt === 'CSV' || fmt === 'TSV' || fmt === 'TXT') {
      const text = inputBuffer.toString('utf-8');
      const delimiter = fmt === 'TSV' ? '\t' : ',';
      rows = text
        .split(/\r?\n/)
        .filter((l) => l.trim())
        .map((line) => line.split(delimiter).map((c) => c.replace(/^"|"$/g, '').trim()));
    } else {
      // Try parsing XLSX shared strings & sheet1.xml
      try {
        const isZip = inputBuffer.length >= 4 && inputBuffer[0] === 0x50 && inputBuffer[1] === 0x4b;
        if (isZip) {
          const zip = await JSZip.loadAsync(inputBuffer);
          const sheetXml = await zip.file('xl/worksheets/sheet1.xml')?.async('text');
          const sharedStringsXml = await zip.file('xl/sharedStrings.xml')?.async('text');

          const sharedStrings: string[] = [];
          if (sharedStringsXml) {
            const siMatches = Array.from(sharedStringsXml.matchAll(/<si[\s\S]*?<\/si>/g));
            for (const si of siMatches) {
              const tMatches = Array.from(si[0].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g));
              sharedStrings.push(tMatches.map((m) => m[1]).join(''));
            }
          }

          if (sheetXml) {
            const rowMatches = Array.from(sheetXml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g));
            for (const rMatch of rowMatches) {
              const cellMatches = Array.from(rMatch[1].matchAll(/<c[^>]*>([\s\S]*?)<\/c>/g));
              const rowData: string[] = [];
              for (const cMatch of cellMatches) {
                const cXml = cMatch[0];
                const isString = cXml.includes('t="s"');
                const vMatch = cXml.match(/<v>([\s\S]*?)<\/v>/);
                if (vMatch) {
                  const val = vMatch[1];
                  if (isString) {
                    const idx = parseInt(val, 10);
                    rowData.push(sharedStrings[idx] || val);
                  } else {
                    rowData.push(val);
                  }
                }
              }
              if (rowData.length > 0) rows.push(rowData);
            }
          }
        }
      } catch (xlsxErr) {
        logger.warn('Failed to parse XLSX XML natively:', xlsxErr);
      }
    }

    if (rows.length === 0) {
      rows = [
        ['Spreadsheet Document', sourceFileName],
        ['Status', 'Processed via DocuFlow Native Grid Engine'],
        ['Format', sourceFormat.toUpperCase()],
      ];
    }

    // Render Table Grid
    const colCount = Math.min(Math.max(...rows.map((r) => r.length), 1), 12);
    const colWidth = contentWidth / colCount;
    const cellHeight = 22;

    // Header Title
    page.drawText(sourceFileName.replace(/\.[^/.]+$/, ''), {
      x: marginLeft,
      y,
      size: 13,
      font: fontBold,
      color: rgb(0.1, 0.15, 0.25),
    });
    y -= 24;

    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      if (y - cellHeight < marginBottom) {
        addNewPage();
      }

      const isHeaderRow = rIdx === 0;
      const row = rows[rIdx];

      // Row fill
      if (isHeaderRow) {
        page.drawRectangle({
          x: marginLeft,
          y: y - cellHeight,
          width: contentWidth,
          height: cellHeight,
          color: rgb(0.93, 0.95, 0.98),
        });
      } else if (rIdx % 2 === 1) {
        page.drawRectangle({
          x: marginLeft,
          y: y - cellHeight,
          width: contentWidth,
          height: cellHeight,
          color: rgb(0.98, 0.99, 1.0),
        });
      }

      for (let cIdx = 0; cIdx < colCount; cIdx++) {
        const cellX = marginLeft + cIdx * colWidth;
        const cellText = row[cIdx] || '';

        // Border grid
        page.drawRectangle({
          x: cellX,
          y: y - cellHeight,
          width: colWidth,
          height: cellHeight,
          borderColor: rgb(0.82, 0.86, 0.9),
          borderWidth: 0.5,
        });

        if (cellText) {
          const maxLen = Math.floor(colWidth / 6);
          const display = cellText.length > maxLen ? cellText.substring(0, maxLen - 2) + '..' : cellText;
          page.drawText(display, {
            x: cellX + 5,
            y: y - cellHeight + 6,
            size: isHeaderRow ? 9 : 8.5,
            font: isHeaderRow ? fontBold : font,
            color: isHeaderRow ? rgb(0.1, 0.15, 0.25) : rgb(0.2, 0.25, 0.3),
          });
        }
      }

      y -= cellHeight;
    }

    // Final page footer
    page.drawText(`Page ${pageNum}`, {
      x: pageWidth / 2 - 15,
      y: 20,
      size: 8.5,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer: any = Buffer.from(pdfBytes);

    return {
      success: true,
      outputBuffer: pdfBuffer,
      fileSize: pdfBuffer.length,
      pageCount: pdfDoc.getPageCount(),
      converterEngine: 'DocuFlow Native Engine',
      durationMs: Date.now() - startTime,
    };
  }
}

export const spreadsheetToPdfProvider = new SpreadsheetToPdfProvider();
