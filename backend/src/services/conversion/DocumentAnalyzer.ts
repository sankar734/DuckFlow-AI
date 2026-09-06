import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { logger } from '../../utils/logger';

export interface DocumentAnalysis {
  format: string;
  pageCountEstimated: number;
  paragraphCount?: number;
  tableCount?: number;
  imageCount?: number;
  slideCount?: number;
  sheetCount?: number;
  declaredFonts: string[];
  hasExplicitPageBreaks: boolean;
  hasSideBySideTabs: boolean;
  hasHeadersOrFooters: boolean;
  isDigitalPdfWithText?: boolean;
  complexityScore: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class DocumentAnalyzer {
  /**
   * Analyzes an uploaded document before conversion to determine structural metrics and complexity
   */
  static async analyze(buffer: Buffer, format: string): Promise<DocumentAnalysis> {
    const fmt = format.toUpperCase();

    if (fmt === 'DOCX') {
      return this.analyzeDocx(buffer);
    }
    if (fmt === 'XLSX') {
      return this.analyzeXlsx(buffer);
    }
    if (fmt === 'PPTX') {
      return this.analyzePptx(buffer);
    }
    if (fmt === 'PDF') {
      return this.analyzePdf(buffer);
    }

    return {
      format: fmt,
      pageCountEstimated: 1,
      declaredFonts: [],
      hasExplicitPageBreaks: false,
      hasSideBySideTabs: false,
      hasHeadersOrFooters: false,
      complexityScore: 'LOW',
    };
  }

  /**
   * Deep analysis of DOCX package structure
   */
  private static async analyzeDocx(buffer: Buffer): Promise<DocumentAnalysis> {
    const declaredFonts = new Set<string>();
    let explicitPageBreaks = 0;
    let paragraphCount = 0;
    let tableCount = 0;
    let imageCount = 0;
    let hasSideBySideTabs = false;
    let hasHeadersOrFooters = false;

    try {
      const isZip = buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
      if (!isZip) {
        return {
          format: 'DOCX',
          pageCountEstimated: 1,
          declaredFonts: ['Times-Roman'],
          hasExplicitPageBreaks: false,
          hasSideBySideTabs: false,
          hasHeadersOrFooters: false,
          complexityScore: 'LOW',
        };
      }

      const zip = await JSZip.loadAsync(buffer);

      // Check fontTable.xml
      const fontTableStr = await zip.file('word/fontTable.xml')?.async('text');
      if (fontTableStr) {
        const fontMatches = Array.from(fontTableStr.matchAll(/<w:font[^>]+w:name="([^"]+)"/g));
        fontMatches.forEach((m) => declaredFonts.add(m[1]));
      }

      // Check document.xml
      const docXmlStr = await zip.file('word/document.xml')?.async('text');
      if (docXmlStr) {
        paragraphCount = (docXmlStr.match(/<w:p[ >]/g) || []).length;
        tableCount = (docXmlStr.match(/<w:tbl[ >]/g) || []).length;
        imageCount = (docXmlStr.match(/<w:drawing[ >]/g) || []).length;

        // Count explicit page breaks
        const brBreaks = (docXmlStr.match(/w:type="page"/g) || []).length;
        const pPrBreaks = (docXmlStr.match(/<w:pageBreakBefore/g) || []).length;
        const lastRendered = (docXmlStr.match(/<w:lastRenderedPageBreak/g) || []).length;
        explicitPageBreaks = Math.max(brBreaks + pPrBreaks, lastRendered);

        if (docXmlStr.includes('<w:tab/>') || docXmlStr.includes('<w:tab ')) {
          hasSideBySideTabs = true;
        }

        // Fonts in runs
        const rFontMatches = Array.from(docXmlStr.matchAll(/<w:rFonts[^>]+w:ascii="([^"]+)"/g));
        rFontMatches.forEach((m) => declaredFonts.add(m[1]));
      }

      // Check headers/footers
      const headerFooterFiles = Object.keys(zip.files).filter((k) =>
        k.match(/^word\/(header|footer)\d+\.xml$/)
      );
      if (headerFooterFiles.length > 0) hasHeadersOrFooters = true;

      // Estimated page count: 1 base + explicit breaks or density estimation
      const estimatedPages = Math.max(1 + explicitPageBreaks, Math.ceil(paragraphCount / 18));
      const complexity: 'LOW' | 'MEDIUM' | 'HIGH' =
        estimatedPages > 20 || tableCount > 10 || imageCount > 10
          ? 'HIGH'
          : estimatedPages > 5 || tableCount > 2
          ? 'MEDIUM'
          : 'LOW';

      return {
        format: 'DOCX',
        pageCountEstimated: estimatedPages,
        paragraphCount,
        tableCount,
        imageCount,
        declaredFonts: Array.from(declaredFonts),
        hasExplicitPageBreaks: explicitPageBreaks > 0,
        hasSideBySideTabs,
        hasHeadersOrFooters,
        complexityScore: complexity,
      };
    } catch (err) {
      logger.warn('DocumentAnalyzer DOCX error:', err);
      return {
        format: 'DOCX',
        pageCountEstimated: 1,
        declaredFonts: ['Times-Roman'],
        hasExplicitPageBreaks: false,
        hasSideBySideTabs: false,
        hasHeadersOrFooters: false,
        complexityScore: 'LOW',
      };
    }
  }

  /**
   * Analysis of XLSX package structure
   */
  private static async analyzeXlsx(buffer: Buffer): Promise<DocumentAnalysis> {
    try {
      const zip = await JSZip.loadAsync(buffer);
      const sheetFiles = Object.keys(zip.files).filter((k) => k.match(/^xl\/worksheets\/sheet\d+\.xml$/));
      const sheetCount = Math.max(sheetFiles.length, 1);

      return {
        format: 'XLSX',
        pageCountEstimated: sheetCount,
        sheetCount,
        declaredFonts: ['Calibri', 'Arial'],
        hasExplicitPageBreaks: false,
        hasSideBySideTabs: false,
        hasHeadersOrFooters: false,
        complexityScore: sheetCount > 5 ? 'HIGH' : 'MEDIUM',
      };
    } catch {
      return {
        format: 'XLSX',
        pageCountEstimated: 1,
        sheetCount: 1,
        declaredFonts: ['Calibri'],
        hasExplicitPageBreaks: false,
        hasSideBySideTabs: false,
        hasHeadersOrFooters: false,
        complexityScore: 'LOW',
      };
    }
  }

  /**
   * Analysis of PPTX presentation structure
   */
  private static async analyzePptx(buffer: Buffer): Promise<DocumentAnalysis> {
    try {
      const zip = await JSZip.loadAsync(buffer);
      const slideFiles = Object.keys(zip.files).filter((k) => k.match(/^ppt\/slides\/slide\d+\.xml$/));
      const slideCount = Math.max(slideFiles.length, 1);

      return {
        format: 'PPTX',
        pageCountEstimated: slideCount,
        slideCount,
        declaredFonts: ['Calibri', 'Arial'],
        hasExplicitPageBreaks: true,
        hasSideBySideTabs: false,
        hasHeadersOrFooters: false,
        complexityScore: slideCount > 20 ? 'HIGH' : 'MEDIUM',
      };
    } catch {
      return {
        format: 'PPTX',
        pageCountEstimated: 1,
        slideCount: 1,
        declaredFonts: ['Calibri'],
        hasExplicitPageBreaks: false,
        hasSideBySideTabs: false,
        hasHeadersOrFooters: false,
        complexityScore: 'LOW',
      };
    }
  }

  /**
   * Analysis of PDF structure
   */
  private static async analyzePdf(buffer: Buffer): Promise<DocumentAnalysis> {
    try {
      const pdfDoc = await PDFDocument.load(new Uint8Array(buffer), { ignoreEncryption: true });
      const pageCount = pdfDoc.getPageCount();
      const rawText = buffer.toString('latin1');
      const hasTextStream = rawText.includes('/Font') || rawText.includes('/Text') || rawText.includes('BT');

      return {
        format: 'PDF',
        pageCountEstimated: pageCount,
        declaredFonts: ['Helvetica'],
        hasExplicitPageBreaks: true,
        hasSideBySideTabs: false,
        hasHeadersOrFooters: false,
        isDigitalPdfWithText: hasTextStream,
        complexityScore: pageCount > 50 ? 'HIGH' : pageCount > 10 ? 'MEDIUM' : 'LOW',
      };
    } catch {
      return {
        format: 'PDF',
        pageCountEstimated: 1,
        declaredFonts: ['Helvetica'],
        hasExplicitPageBreaks: false,
        hasSideBySideTabs: false,
        hasHeadersOrFooters: false,
        isDigitalPdfWithText: true,
        complexityScore: 'LOW',
      };
    }
  }
}
