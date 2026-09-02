import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { docxDeepParser, DeepParsedSection } from './docxDeepParser';

export interface PDFConversionOptions {
  watermarkText?: string;
  rotationAngle?: number;
  headerTitle?: string;
  footerText?: string;
  landscape?: boolean;
  sectionSetup?: DeepParsedSection;
  documentStyle?: 'academic' | 'standard' | 'minimal';
  lineSpacingMultiplier?: number;
  fontSizePt?: number;
}

export interface ConvertedPDFResult {
  blob: Blob;
  url: string;
  extractedText: string;
  htmlContent?: string;
  tableData?: { headers: string[]; rows: string[][] };
  slides?: Array<{ title: string; subtitle?: string; content: string[] }>;
  pageCount: number;
  fileName: string;
}

/**
 * High-Fidelity Vector Multi-Page PDF Exporter for Word Editor
 */
export const exportPagesToPDF = (
  pages: Array<{ content: string; headerText?: string; footerText?: string }>,
  fileName: string,
  options: PDFConversionOptions = {}
): ConvertedPDFResult => {
  const fullHtml = pages.map((p) => p.content).join('<div class="page-break" data-page-break="true"></div>');
  const rawText = pages.map((p) => p.content.replace(/<[^>]+>/g, ' ')).join('\n\n');
  return generateFormattedDocumentPDF(fileName, rawText, fullHtml, options, options.sectionSetup);
};

/**
 * Exports a DOM element directly as a PDF document.
 */
export const exportElementToPDF = async (element: HTMLElement, fileName: string): Promise<void> => {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = pdfHeight;
    let position = 0;
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }

    const baseName = fileName.replace(/\.[^/.]+$/, '');
    pdf.save(`${baseName}.pdf`);
  } catch (error) {
    console.error('Error generating PDF from element:', error);
    const pdf = new jsPDF('p', 'pt', 'a4');
    pdf.setFontSize(14);
    const text = element.innerText || 'DocuFlow Document';
    const splitText = pdf.splitTextToSize(text, 500);
    pdf.text(splitText, 40, 60);
    pdf.save(`${fileName.replace(/\.[^/.]+$/, '')}.pdf`);
  }
};

/**
 * Creates a structured PDF from table headers and rows (Excel / CSV).
 */
export const exportTableToPDF = (
  headers: string[],
  data: string[][],
  fileName: string,
  options: PDFConversionOptions = {}
): ConvertedPDFResult => {
  const isWide = headers.length > 5 || options.landscape;
  const doc = new jsPDF(isWide ? 'l' : 'p', 'pt', 'a4');
  const pageWidth = isWide ? 842 : 595.3;
  const pageHeight = isWide ? 595.3 : 841.9;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  const baseName = fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

  // Document Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(baseName.toUpperCase(), pageWidth / 2, 45, { align: 'center' });

  let y = 75;
  const colCount = Math.max(headers.length, 1);
  const colWidth = contentWidth / colCount;

  // Header Row
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y - 14, contentWidth, 24, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y - 14, contentWidth, 24, 'S');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  headers.forEach((h, i) => {
    const text = String(h || `Col ${i + 1}`).substring(0, 20);
    doc.text(text, margin + 6 + i * colWidth, y + 2);
  });
  y += 20;

  // Rows
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  let pageNumber = 1;

  data.forEach((row, rowIndex) => {
    if (y > pageHeight - 55) {
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      doc.text(String(pageNumber), pageWidth / 2, pageHeight - 35, { align: 'center' });

      doc.addPage();
      pageNumber++;
      y = 50;

      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 14, contentWidth, 24, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(margin, y - 14, contentWidth, 24, 'S');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      headers.forEach((h, i) => {
        doc.text(String(h).substring(0, 20), margin + 6 + i * colWidth, y + 2);
      });
      y += 20;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
    }

    if (rowIndex % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 11, contentWidth, 18, 'F');
    }

    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y - 11, contentWidth, 18, 'S');

    row.forEach((cell, cellIndex) => {
      if (cellIndex < headers.length) {
        const val = String(cell || '').substring(0, 24);
        doc.text(val, margin + 6 + cellIndex * colWidth, y + 2);
      }
    });
    y += 18;
  });

  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text(String(pageNumber), pageWidth / 2, pageHeight - 35, { align: 'center' });

  if (options.watermarkText) {
    applyWatermark(doc, options.watermarkText, pageWidth, pageHeight, pageNumber);
  }

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);

  return {
    blob,
    url,
    extractedText: data.map((r) => r.join(' | ')).join('\n'),
    tableData: { headers, rows: data },
    pageCount: pageNumber,
    fileName: `${baseName}.pdf`,
  };
};

/**
 * Creates a presentation PDF from slides.
 */
export const exportSlidesToPDF = (
  slides: Array<{ title: string; subtitle?: string; content: string[] }>,
  fileName: string,
  options: PDFConversionOptions = {}
): ConvertedPDFResult => {
  const doc = new jsPDF('l', 'pt', 'a4');
  const pageWidth = 842;
  const pageHeight = 595.3;
  const baseName = fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

  const gradients = [
    { bg: [30, 27, 75], accent: [99, 102, 241], bullet: [129, 140, 248] },
    { bg: [15, 23, 42], accent: [59, 130, 246], bullet: [96, 165, 250] },
    { bg: [6, 78, 59], accent: [16, 185, 129], bullet: [52, 211, 153] },
    { bg: [67, 20, 7], accent: [245, 158, 11], bullet: [251, 191, 36] },
  ];

  slides.forEach((slide, idx) => {
    if (idx > 0) doc.addPage();

    const theme = gradients[idx % gradients.length];

    doc.setFillColor(theme.bg[0], theme.bg[1], theme.bg[2]);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.text(slide.title || `Slide ${idx + 1}`, 60, 90);

    if (slide.subtitle) {
      doc.setFontSize(13);
      doc.setTextColor(196, 181, 253);
      doc.text(slide.subtitle, 60, 118);
    }

    doc.setDrawColor(theme.accent[0], theme.accent[1], theme.accent[2]);
    doc.setLineWidth(2);
    doc.line(60, 135, 780, 135);

    doc.setFontSize(15);
    doc.setTextColor(241, 245, 249);
    let bulletY = 185;

    const bulletItems = slide.content.length > 0 ? slide.content : ['Slide content'];

    bulletItems.forEach((point) => {
      doc.setFillColor(theme.bullet[0], theme.bullet[1], theme.bullet[2]);
      doc.circle(70, bulletY - 5, 4, 'F');
      const lines = doc.splitTextToSize(point, 670);
      doc.text(lines, 88, bulletY);
      bulletY += lines.length * 24 + 14;
    });

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`${baseName} • Slide ${idx + 1} of ${slides.length}`, 60, 560);
  });

  if (options.watermarkText) {
    applyWatermark(doc, options.watermarkText, pageWidth, pageHeight, slides.length);
  }

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);

  return {
    blob,
    url,
    extractedText: slides.map((s) => `${s.title}\n${s.content.join('\n')}`).join('\n\n'),
    slides,
    pageCount: slides.length,
    fileName: `${baseName}.pdf`,
  };
};

/**
 * Universal High-Accuracy Document to PDF Converter Engine
 */
export const convertFileToRealPDF = async (
  file: File,
  targetFormat: string = 'PDF',
  options: PDFConversionOptions = {}
): Promise<ConvertedPDFResult> => {
  const fileName = file.name;
  const lowerName = fileName.toLowerCase();

  // 1. WORD DOCUMENT (.docx, .doc, .rtf, .odt)
  if (lowerName.endsWith('.docx')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const deepParsed = await docxDeepParser.parse(arrayBuffer, fileName);
      return generateFormattedDocumentPDF(
        fileName,
        deepParsed.plainText,
        deepParsed.fullHtml,
        {
          ...options,
          landscape: deepParsed.sectionSetup.orientation === 'landscape',
        },
        deepParsed.sectionSetup
      );
    } catch (deepErr) {
      console.warn('DocxDeepParser fallback in pdfGenerator:', deepErr);
      const arrayBuffer = await file.arrayBuffer();
      const mammothOptions = {
        convertImage: mammoth.images.imgElement((image: any) => {
          return image.read('base64').then((imageBuffer: string) => {
            return {
              src: `data:${image.contentType || 'image/png'};base64,${imageBuffer}`,
            };
          });
        }),
      };
      const rawTextResult = await mammoth.extractRawText({ arrayBuffer });
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer }, mammothOptions);
      const textContent = rawTextResult.value.trim() || 'Empty Document';
      const htmlContent = htmlResult.value.trim();
      return generateFormattedDocumentPDF(fileName, textContent, htmlContent, options);
    }
  } else if (lowerName.endsWith('.doc') || lowerName.endsWith('.rtf') || lowerName.endsWith('.odt')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const rawTextResult = await mammoth.extractRawText({ arrayBuffer });
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
      const textContent = rawTextResult.value.trim() || 'Empty Document';
      const htmlContent = htmlResult.value.trim();
      return generateFormattedDocumentPDF(fileName, textContent, htmlContent, options);
    } catch (docxErr) {
      const text = await file.text();
      return generateFormattedDocumentPDF(fileName, text, undefined, options);
    }
  }

  // 2. EXCEL SPREADSHEET (.xlsx, .xls, .csv, .tsv)
  if (
    lowerName.endsWith('.xlsx') ||
    lowerName.endsWith('.xls') ||
    lowerName.endsWith('.csv') ||
    lowerName.endsWith('.tsv')
  ) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0] || 'Sheet1';
      const worksheet = workbook.Sheets[sheetName];
      const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (rawData && rawData.length > 0) {
        const headers = rawData[0].map((h, i) => (h !== undefined && h !== '' ? String(h) : `Col ${i + 1}`));
        const rows = rawData.slice(1).map((row) =>
          headers.map((_, i) => (row[i] !== undefined && row[i] !== null ? String(row[i]) : ''))
        );
        return exportTableToPDF(headers, rows, fileName, options);
      }
    } catch (sheetErr) {
      console.warn('Excel parse error, parsing as text:', sheetErr);
    }
  }

  // 3. POWERPOINT PRESENTATION (.pptx, .ppt)
  if (lowerName.endsWith('.pptx') || lowerName.endsWith('.ppt')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const slidePaths: string[] = [];

      zip.forEach((path) => {
        if (path.match(/^ppt\/slides\/slide[0-9]+\.xml$/)) {
          slidePaths.push(path);
        }
      });

      slidePaths.sort((a, b) => {
        const numA = parseInt(a.replace(/[^0-9]/g, ''), 10) || 0;
        const numB = parseInt(b.replace(/[^0-9]/g, ''), 10) || 0;
        return numA - numB;
      });

      if (slidePaths.length > 0) {
        const extractedSlides: Array<{ title: string; subtitle?: string; content: string[] }> = [];

        for (let i = 0; i < slidePaths.length; i++) {
          const xml = await zip.file(slidePaths[i])?.async('text');
          if (!xml) continue;

          const parser = new DOMParser();
          const doc = parser.parseFromString(xml, 'application/xml');
          const paragraphs = doc.getElementsByTagName('a:p');
          const lines: string[] = [];

          for (let p = 0; p < paragraphs.length; p++) {
            const runs = paragraphs[p].getElementsByTagName('a:t');
            let line = '';
            for (let r = 0; r < runs.length; r++) {
              line += runs[r].textContent || '';
            }
            if (line.trim()) lines.push(line.trim());
          }

          const slideTitle = lines[0] || `Slide ${i + 1}`;
          const slideSubtitle = lines.length > 2 ? lines[1] : undefined;
          const slideBullets = lines.length > 2 ? lines.slice(2) : lines.slice(1);

          extractedSlides.push({
            title: slideTitle,
            subtitle: slideSubtitle,
            content: slideBullets.length > 0 ? slideBullets : ['Presentation Slide'],
          });
        }

        if (extractedSlides.length > 0) {
          return exportSlidesToPDF(extractedSlides, fileName, options);
        }
      }
    } catch (pptErr) {
      console.warn('PPTX zip parsing fallback:', pptErr);
    }
  }

  // 4. IMAGES (.png, .jpg, .jpeg, .webp, .bmp, .svg)
  if (
    lowerName.endsWith('.png') ||
    lowerName.endsWith('.jpg') ||
    lowerName.endsWith('.jpeg') ||
    lowerName.endsWith('.webp') ||
    lowerName.endsWith('.bmp') ||
    lowerName.endsWith('.svg')
  ) {
    return generateImagePDF(file, fileName, options);
  }

  // 5. HTML / XML / CODE / MARKDOWN / PLAIN TEXT (.txt, .md, .html, .json, .js, .py, etc.)
  const rawText = await file.text();
  const isHtml = lowerName.endsWith('.html') || lowerName.endsWith('.htm');
  return generateFormattedDocumentPDF(fileName, rawText, isHtml ? rawText : undefined, options);
};

const CHAPTER_DIVIDER_TITLES = [
  'TABLE OF CONTENTS',
  'INTRODUCTION',
  'SYSTEM ANALYSIS',
  'SYSTEM ENVIRONMENTS',
  'SYSTEM REQUIREMENTS',
  'SYSTEM DESIGN',
  'SYSTEM TESTING',
  'SYSTEM IMPLEMENTATION',
  'APPENDIX',
  'FUTURE ENHANCEMENT',
  'CONCLUSION',
  'BIBLIOGRAPHY',
  'ACKNOWLEDGEMENT',
  'ABSTRACT',
  'DECLARATION',
  'CERTIFICATE',
  'BONAFIDE CERTIFICATE',
  'INDEX',
];

function isChapterDivider(text: string): boolean {
  const clean = text.trim().toUpperCase().replace(/[:#]/g, '').trim();
  if (CHAPTER_DIVIDER_TITLES.includes(clean)) return true;
  if (/^(CHAPTER|SECTION)\s+\d+(\s*:\s*[A-Z\s]+)?$/i.test(clean)) return true;
  return false;
}

/**
 * Checks if text is a centered Certificate or College Heading
 */
function isCertificateHeader(text: string): boolean {
  const upper = text.toUpperCase().trim();
  return (
    upper.includes('DEPARTMENT OF') ||
    upper.includes('BONAFIDE CERTIFICATE') ||
    upper.includes('COLLEGE OF') ||
    upper.includes('UNIVERSITY') ||
    upper.includes('SUBMITTED FOR THE VIVA-VOCE')
  );
}

/**
 * Checks if text represents a two-column signature line (e.g. Internal Guide   Head of Dept)
 */
function parseTwoColumnLine(text: string): { left: string; right: string } | null {
  // 1. Tab separated
  if (text.includes('\t')) {
    const parts = text.split(/\t+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length === 2) {
      return { left: parts[0], right: parts[1] };
    }
  }

  // 2. 3 or more consecutive spaces
  if (/\s{3,}/.test(text)) {
    const parts = text.split(/\s{3,}/).map((p) => p.trim()).filter(Boolean);
    if (parts.length === 2 && parts[0].length < 40 && parts[1].length < 40) {
      return { left: parts[0], right: parts[1] };
    }
  }

  // 3. Common signature pairs
  const upper = text.toUpperCase();
  if (upper.includes('INTERNAL GUIDE') && upper.includes('HEAD OF')) {
    const idx = upper.indexOf('HEAD OF');
    return { left: text.substring(0, idx).trim(), right: text.substring(idx).trim() };
  }
  if (upper.includes('INTERNAL EXAMINER') && upper.includes('EXTERNAL EXAMINER')) {
    const idx = upper.indexOf('EXTERNAL EXAMINER');
    return { left: text.substring(0, idx).trim(), right: text.substring(idx).trim() };
  }

  return null;
}

/**
 * High-Fidelity Academic & Report Document PDF Generator
 */
export function generateFormattedDocumentPDF(
  fileName: string,
  rawText: string,
  htmlContent?: string,
  options: PDFConversionOptions = {},
  sectionSetup?: DeepParsedSection
): ConvertedPDFResult {
  const isLandscape = options.landscape || sectionSetup?.orientation === 'landscape';
  const widthPt = sectionSetup?.pageSize?.widthPt || (isLandscape ? 841.9 : 595.3); // A4 Standard
  const heightPt = sectionSetup?.pageSize?.heightPt || (isLandscape ? 595.3 : 841.9);

  // Standard Academic 1-Inch Margins
  const marginLeft = 60;
  const marginRight = 60;
  const marginTop = 55;
  const marginBottom = 55;

  const doc = new jsPDF({
    orientation: isLandscape ? 'l' : 'p',
    unit: 'pt',
    format: [widthPt, heightPt],
  });

  const pageWidth = widthPt;
  const pageHeight = heightPt;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const baseName = fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

  let y = marginTop;
  let pageNumber = 1;

  const drawPageNumber = (pNum: number) => {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 30);
    doc.text(String(pNum), pageWidth / 2, pageHeight - 35, { align: 'center' });
  };

  const advanceToNewPage = () => {
    drawPageNumber(pageNumber);
    doc.addPage();
    pageNumber++;
    y = marginTop;
  };

  const checkOverflow = (neededHeight: number): boolean => {
    if (y + neededHeight > pageHeight - marginBottom) {
      advanceToNewPage();
      return true;
    }
    return false;
  };

  // -------------------------------------------------------------
  // 1. RICH HTML PARSING (from DOCX Deep Parser or HTML upload)
  // -------------------------------------------------------------
  if (htmlContent && htmlContent.includes('<')) {
    try {
      const parser = new DOMParser();
      const parsedDoc = parser.parseFromString(htmlContent, 'text/html');
      const nodes = Array.from(parsedDoc.body.children);

      for (let nIdx = 0; nIdx < nodes.length; nIdx++) {
        const node = nodes[nIdx];
        const tagName = node.tagName.toLowerCase();
        const style = node.getAttribute('style') || '';
        const alignAttr = node.getAttribute('align') || '';
        const textContent = (node.textContent || '').trim();

        // 1. Explicit Page Break
        if (
          node.classList.contains('page-break') ||
          node.getAttribute('data-page-break') === 'true'
        ) {
          if (y > marginTop) {
            advanceToNewPage();
          }
          continue;
        }

        // 2. Standalone Chapter / Section Divider Page (Middle-of-page Centered)
        if (
          (tagName === 'h1' || tagName === 'h2' || tagName === 'p') &&
          isChapterDivider(textContent) &&
          textContent.length < 40 &&
          textContent.toUpperCase() !== 'TABLE OF CONTENTS' &&
          textContent.toUpperCase() !== 'BONAFIDE CERTIFICATE'
        ) {
          if (y > marginTop + 10) {
            advanceToNewPage();
          }

          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(15);
          doc.setTextColor(10, 10, 10);
          const centerY = pageHeight / 2 - 8;
          doc.text(textContent.toUpperCase(), pageWidth / 2, centerY, { align: 'center' });

          advanceToNewPage();
          continue;
        }

        // 3. Two-Column Signature Line Detection inside Paragraph
        const twoCol = parseTwoColumnLine(textContent);
        if (twoCol && (tagName === 'p' || tagName === 'div')) {
          checkOverflow(26);
          doc.setFont('Helvetica', textContent.toUpperCase() === textContent ? 'bold' : 'normal');
          doc.setFontSize(10.5);
          doc.setTextColor(15, 23, 42);

          // Render Left Side
          doc.text(twoCol.left, marginLeft, y);

          // Render Right Side
          doc.text(twoCol.right, pageWidth - marginRight, y, { align: 'right' });

          y += 20;
          continue;
        }

        // 4. Tables (Data Table vs Borderless Signature Table)
        if (tagName === 'table') {
          const isBorderless =
            node.getAttribute('data-borderless') === 'true' ||
            style.includes('border: none') ||
            style.includes('border:none');

          const rows = Array.from(node.querySelectorAll('tr'));
          if (rows.length > 0) {
            const tableData = rows.map((r) =>
              Array.from(r.querySelectorAll('th, td')).map((c) => (c.textContent || '').trim())
            );

            const colCount = Math.max(...tableData.map((r) => r.length), 1);

            // BORDERLESS SIGNATURE TABLE (e.g. 2-column signature blocks)
            if (isBorderless && colCount === 2) {
              tableData.forEach((row) => {
                checkOverflow(24);
                const left = row[0] || '';
                const right = row[1] || '';

                doc.setFont('Helvetica', left.toUpperCase() === left && left.length > 0 ? 'bold' : 'normal');
                doc.setFontSize(10.5);
                doc.setTextColor(15, 23, 42);

                doc.text(left, marginLeft, y);
                doc.text(right, pageWidth - marginRight, y, { align: 'right' });
                y += 20;
              });
              y += 10;
              continue;
            }

            // STANDARD BORDERED TABLE / TOC
            const isTOC =
              tableData.length > 0 &&
              tableData[0].some(
                (h) =>
                  h.toUpperCase().includes('CONTENTS') ||
                  h.toUpperCase().includes('S.NO') ||
                  h.toUpperCase().includes('PAGENO')
              );

            let colWidths: number[] = [];
            if (isTOC && colCount === 3) {
              colWidths = [45, contentWidth - 115, 70];
            } else {
              colWidths = Array(colCount).fill(contentWidth / colCount);
            }

            tableData.forEach((row, rIdx) => {
              const isHeader = rIdx === 0;
              const rowHeight = isHeader ? 26 : 22;
              checkOverflow(rowHeight + 4);

              if (isHeader) {
                doc.setFillColor(248, 250, 252);
                doc.rect(marginLeft, y, contentWidth, rowHeight, 'F');
              } else if (rIdx % 2 === 1) {
                doc.setFillColor(252, 253, 254);
                doc.rect(marginLeft, y, contentWidth, rowHeight, 'F');
              }

              doc.setDrawColor(203, 213, 225);
              doc.setLineWidth(0.75);
              doc.rect(marginLeft, y, contentWidth, rowHeight, 'S');

              let currentX = marginLeft;
              row.forEach((cellText, cIdx) => {
                const cellW = colWidths[cIdx] || colWidths[0];

                if (cIdx > 0) {
                  doc.line(currentX, y, currentX, y + rowHeight);
                }

                if (isHeader) {
                  doc.setFont('Helvetica', 'bold');
                  doc.setFontSize(9.5);
                  doc.setTextColor(15, 23, 42);
                  const isCentered = cIdx === 0 || cIdx === 2;
                  const textX = isCentered ? currentX + cellW / 2 : currentX + 8;
                  doc.text(cellText, textX, y + 16, { align: isCentered ? 'center' : 'left' });
                } else {
                  const isMainChapter = isTOC && cIdx === 1 && /^\d+\s+[A-Z\s]+$/.test(cellText);
                  const isSubSection = isTOC && cIdx === 1 && /^\d+\.\d+/.test(cellText);

                  doc.setFont('Helvetica', isMainChapter ? 'bold' : 'normal');
                  doc.setFontSize(isMainChapter ? 9.5 : 9);
                  doc.setTextColor(isMainChapter ? 10 : 40, isMainChapter ? 10 : 40, isMainChapter ? 10 : 40);

                  const isCentered = cIdx === 0;
                  const isRight = cIdx === row.length - 1 && isTOC;
                  const textX = isCentered
                    ? currentX + cellW / 2
                    : isRight
                    ? currentX + cellW - 10
                    : isSubSection
                    ? currentX + 16
                    : currentX + 8;

                  const maxChars = Math.floor(cellW / 6);
                  const display = cellText.length > maxChars ? cellText.substring(0, maxChars - 3) + '...' : cellText;
                  doc.text(display, textX, y + 14, {
                    align: isCentered ? 'center' : isRight ? 'right' : 'left',
                  });
                }

                currentX += cellW;
              });

              y += rowHeight;
            });

            y += 16;
            continue;
          }
        }

        // 5. Headings & Certificate Titles
        if (
          tagName === 'h1' ||
          tagName === 'h2' ||
          tagName === 'h3' ||
          tagName === 'h4' ||
          isCertificateHeader(textContent)
        ) {
          checkOverflow(36);
          y += 10;

          const isNumberedSection = /^\d+(\.\d+)*\s+/.test(textContent);
          const isCentered =
            style.includes('text-align: center') ||
            alignAttr === 'center' ||
            isCertificateHeader(textContent) ||
            textContent.toUpperCase() === 'TABLE OF CONTENTS';

          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(tagName === 'h1' || isCertificateHeader(textContent) ? 13 : 11.5);
          doc.setTextColor(15, 23, 42);

          const lines = doc.splitTextToSize(
            isNumberedSection ? textContent.toUpperCase() : textContent,
            contentWidth
          );
          const textX = isCentered ? pageWidth / 2 : marginLeft;

          lines.forEach((l: string) => {
            checkOverflow(20);
            doc.text(l, textX, y, { align: isCentered ? 'center' : 'left' });
            y += 18;
          });

          y += 8;
          continue;
        }

        // 6. Embedded Images / Screenshots
        const imgElement = tagName === 'img' ? (node as HTMLImageElement) : node.querySelector('img');
        if (imgElement) {
          const src = imgElement.getAttribute('src') || '';
          if (src && (src.startsWith('data:image/') || src.startsWith('blob:') || src.startsWith('http'))) {
            try {
              checkOverflow(200);
              const imgFormat = src.includes('image/png') || src.includes('.png') ? 'PNG' : 'JPEG';
              const maxImgWidth = Math.min(contentWidth, 440);
              const imgHeight = 210;
              const imgX = (pageWidth - maxImgWidth) / 2;

              doc.setDrawColor(226, 232, 240);
              doc.rect(imgX - 2, y - 2, maxImgWidth + 4, imgHeight + 4, 'S');

              doc.addImage(src, imgFormat, imgX, y, maxImgWidth, imgHeight);
              y += imgHeight + 18;
              continue;
            } catch (imgErr) {
              console.warn('Image rendering fallback:', imgErr);
            }
          }
        }

        // 7. Lists (UL, OL) & Key-Value Bullet Points
        if (tagName === 'ul' || tagName === 'ol') {
          const items = Array.from(node.querySelectorAll('li'));
          items.forEach((li, lIdx) => {
            checkOverflow(20);
            const rawLi = (li.textContent || '').trim();

            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(10.5);
            doc.setTextColor(30, 41, 59);

            if (rawLi.includes(' : ') || rawLi.includes(' - ')) {
              const delimiter = rawLi.includes(' : ') ? ' : ' : ' - ';
              const [key, ...rest] = rawLi.split(delimiter);
              const val = rest.join(delimiter).trim();

              doc.setFont('Helvetica', 'bold');
              doc.text(`•  ${key.trim()} :`, marginLeft + 8, y);

              doc.setFont('Helvetica', 'normal');
              doc.text(val, marginLeft + 180, y);
              y += 18;
            } else {
              const prefix = tagName === 'ol' ? `${lIdx + 1}. ` : '•  ';
              const fullText = prefix + rawLi;
              const lines = doc.splitTextToSize(fullText, contentWidth - 16);

              lines.forEach((l: string, idx: number) => {
                checkOverflow(18);
                doc.text(l, marginLeft + (idx === 0 ? 8 : 20), y);
                y += 16.5;
              });
              y += 3;
            }
          });

          y += 6;
          continue;
        }

        // 8. Source Code Block (Pre, Code, or Sample Coding block)
        if (
          tagName === 'pre' ||
          tagName === 'code' ||
          textContent.startsWith('<?php') ||
          textContent.startsWith('<!DOCTYPE') ||
          textContent.includes('session_start()') ||
          textContent.includes('mysql_query')
        ) {
          const codeLines = textContent.split(/\r\n|\n/);
          doc.setFont('Courier', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(30, 41, 59);

          codeLines.forEach((cLine) => {
            checkOverflow(15);
            doc.text(cLine, marginLeft + 8, y);
            y += 14;
          });

          y += 8;
          continue;
        }

        // 9. Regular Paragraphs & Sub-sections
        if (textContent) {
          const isSubHeading =
            textContent.length < 50 &&
            !textContent.endsWith('.') &&
            (textContent === 'Abstract' ||
              textContent === 'Existing System' ||
              textContent === 'Disadvantages' ||
              textContent === 'Proposed System' ||
              textContent === 'Advantages' ||
              textContent === 'Modules' ||
              textContent === 'Modules Description' ||
              textContent === 'Customer Registration' ||
              textContent === 'Manage event & Food Items' ||
              textContent === 'Ordering Food' ||
              textContent === 'Confirm Purchase' ||
              textContent === 'Bill Generation' ||
              textContent === 'Open Source' ||
              textContent === 'Cross-Platform' ||
              textContent === 'Power' ||
              textContent === 'User Friendly' ||
              textContent === 'Quick' ||
              textContent === 'Extensions' ||
              textContent === 'Easy Deployment' ||
              textContent === 'Automatically Refreshes' ||
              textContent === 'Community Support' ||
              textContent === 'Other Tools' ||
              textContent === 'Security' ||
              textContent === 'Talent Availability' ||
              textContent === 'OUTPUT DESIGN');

          if (isSubHeading) {
            checkOverflow(28);
            y += 8;
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(15, 23, 42);
            doc.text(textContent, marginLeft, y);
            y += 18;
            continue;
          }

          checkOverflow(22);
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(10.5);
          doc.setTextColor(30, 41, 59);

          const lines = doc.splitTextToSize(textContent, contentWidth);
          const isCentered = style.includes('text-align: center') || alignAttr === 'center';
          const textX = isCentered ? pageWidth / 2 : marginLeft;

          lines.forEach((line: string) => {
            checkOverflow(18);
            doc.text(line, textX, y, { align: isCentered ? 'center' : 'left' });
            y += 17;
          });

          y += 10;
        }
      }

      drawPageNumber(pageNumber);

      if (options.watermarkText) {
        applyWatermark(doc, options.watermarkText, pageWidth, pageHeight, pageNumber);
      }

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      return {
        blob,
        url,
        extractedText: rawText,
        htmlContent,
        pageCount: pageNumber,
        fileName: `${baseName}.pdf`,
      };
    } catch (parseErr) {
      console.warn('HTML document parser exception, falling back to clean text engine:', parseErr);
    }
  }

  // -------------------------------------------------------------
  // 2. RAW TEXT / CLEAN PARAGRAPHS FALLBACK ENGINE
  // -------------------------------------------------------------
  const paragraphs = rawText
    .split(/\r\n\r\n|\n\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const cleanParagraphs = paragraphs.length > 0 ? paragraphs : ['(Empty document content)'];

  cleanParagraphs.forEach((para) => {
    // 1. Check for standalone chapter divider
    if (isChapterDivider(para) && para.length < 40 && para.toUpperCase() !== 'TABLE OF CONTENTS' && para.toUpperCase() !== 'BONAFIDE CERTIFICATE') {
      if (y > marginTop + 10) {
        advanceToNewPage();
      }
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(10, 10, 10);
      doc.text(para.toUpperCase(), pageWidth / 2, pageHeight / 2 - 8, { align: 'center' });
      advanceToNewPage();
      return;
    }

    // 2. Check for two-column signature block
    const twoCol = parseTwoColumnLine(para);
    if (twoCol) {
      checkOverflow(26);
      doc.setFont('Helvetica', para.toUpperCase() === para ? 'bold' : 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(twoCol.left, marginLeft, y);
      doc.text(twoCol.right, pageWidth - marginRight, y, { align: 'right' });
      y += 20;
      return;
    }

    // 3. Check for Section Heading or Certificate Title
    const isHeading =
      para.length < 70 &&
      (para.startsWith('#') ||
        isCertificateHeader(para) ||
        /^\d+(\.\d+)*\s+[A-Za-z0-9]/.test(para) ||
        para.toUpperCase() === 'TABLE OF CONTENTS' ||
        /^[A-Z0-9\s:.-]{4,40}$/.test(para));

    if (isHeading) {
      checkOverflow(32);
      y += 8;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor(15, 23, 42);

      const cleanHeading = para.replace(/^#+\s*/, '');
      const isCentered = isCertificateHeader(cleanHeading) || cleanHeading.toUpperCase() === 'TABLE OF CONTENTS';
      const textX = isCentered ? pageWidth / 2 : marginLeft;

      doc.text(cleanHeading, textX, y, { align: isCentered ? 'center' : 'left' });
      y += 20;
    } else {
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(30, 41, 59);

      const lines = doc.splitTextToSize(para, contentWidth);
      lines.forEach((line: string) => {
        checkOverflow(18);
        doc.text(line, marginLeft, y);
        y += 17;
      });

      y += 10;
    }
  });

  drawPageNumber(pageNumber);

  if (options.watermarkText) {
    applyWatermark(doc, options.watermarkText, pageWidth, pageHeight, pageNumber);
  }

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);

  return {
    blob,
    url,
    extractedText: rawText,
    htmlContent,
    pageCount: pageNumber,
    fileName: `${baseName}.pdf`,
  };
}

/**
 * Generates an Image PDF with correct aspect ratio
 */
async function generateImagePDF(
  file: File,
  fileName: string,
  options: PDFConversionOptions = {}
): Promise<ConvertedPDFResult> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = new Image();
  await new Promise((resolve) => {
    img.onload = resolve;
    img.src = dataUrl;
  });

  const isLandscape = img.width > img.height;
  const doc = new jsPDF(isLandscape ? 'l' : 'p', 'pt', 'a4');
  const pageWidth = isLandscape ? 842 : 595.3;
  const pageHeight = isLandscape ? 595.3 : 841.9;
  const margin = 50;

  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;

  let renderWidth = img.width;
  let renderHeight = img.height;

  const ratio = Math.min(maxWidth / renderWidth, maxHeight / renderHeight);
  renderWidth *= ratio;
  renderHeight *= ratio;

  const x = (pageWidth - renderWidth) / 2;
  const y = (pageHeight - renderHeight) / 2;

  doc.setDrawColor(226, 232, 240);
  doc.rect(x - 1, y - 1, renderWidth + 2, renderHeight + 2, 'S');

  doc.addImage(dataUrl, 'JPEG', x, y, renderWidth, renderHeight);

  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text('1', pageWidth / 2, pageHeight - 35, { align: 'center' });

  if (options.watermarkText) {
    applyWatermark(doc, options.watermarkText, pageWidth, pageHeight, 1);
  }

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const baseName = fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

  return {
    blob,
    url,
    extractedText: `Image Document: ${fileName} (${img.width}x${img.height})`,
    pageCount: 1,
    fileName: `${baseName}.pdf`,
  };
}

/**
 * Applies custom watermark across all document pages
 */
function applyWatermark(
  doc: jsPDF,
  watermarkText: string,
  pageWidth: number,
  pageHeight: number,
  totalPages: number
) {
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(44);
    doc.setTextColor(220, 38, 38);
    doc.setGState(new (doc as any).GState({ opacity: 0.16 }));
    doc.text(watermarkText, pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45,
    });
    doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
  }
}

/**
 * Creates a backward-compatible PDF blob with fallback for legacy call signatures.
 */
export const createConvertedPDFBlob = (
  fileName: string,
  _sourceFormat: string,
  rawContent?: string
): { blob: Blob; url: string } => {
  const result = generateFormattedDocumentPDF(
    fileName,
    rawContent || `Document: ${fileName}\n\nConverted by DocuFlow AI universal engine.`
  );
  return { blob: result.blob, url: result.url };
};
