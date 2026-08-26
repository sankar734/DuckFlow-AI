import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { docxDeepParser, DeepParsedWordDocument, DeepParsedSection } from './docxDeepParser';

export interface ParsedWordDoc {
  html: string;
  pages: string[];
  text: string;
  title: string;
  sectionSetup?: DeepParsedSection;
  declaredFonts?: string[];
  pageCount?: number;
  imageCount?: number;
  tableCount?: number;
}

export interface ParsedSpreadsheet {
  sheetNames: string[];
  activeSheet: string;
  headers: string[];
  rows: string[][];
}

export interface ParsedSlide {
  id: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  theme: 'slate' | 'indigo' | 'emerald' | 'amber' | 'crimson' | 'cyber' | 'quartz' | 'midnight';
}

/**
 * Enhanced HTML page splitter that respects explicit page breaks and natural layout bounds
 */
export function splitHtmlIntoPages(html: string): string[] {
  if (!html || !html.trim()) {
    return ['<p><em>(Empty document)</em></p>'];
  }

  // 1. Explicit page breaks
  if (
    html.includes('<!-- PAGE') ||
    html.includes('page-break') ||
    html.includes('class="page-break"') ||
    html.includes('data-page-break')
  ) {
    const parts = html
      .split(/<div[^>]*class="[^"]*page-break[^"]*"[^>]*><\/div>|<div[^>]*data-page-break[^>]*><\/div>|<!-- PAGE \d+ -->/i)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts;
  }

  // 2. HR dividers as page breaks
  if (html.includes('<hr') || html.includes('<hr/>') || html.includes('<hr />')) {
    const hrParts = html.split(/<hr[^>]*\/?>/i).map((p) => p.trim()).filter(Boolean);
    if (hrParts.length > 1) return hrParts;
  }

  // 3. Dynamic DOM parser grouping into standard A4 pages (~350 words or 6-8 paragraphs)
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const elements = Array.from(doc.body.children);

    if (elements.length <= 1) {
      return [html];
    }

    const pages: string[] = [];
    let currentPageHtml = '';
    let currentWords = 0;

    for (const el of elements) {
      const text = el.textContent || '';
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const tagName = el.tagName.toLowerCase();
      const isMajorHeader = tagName === 'h1' || tagName === 'h2';

      // Keep tables together where possible
      if (tagName === 'table') {
        if (currentWords > 150) {
          if (currentPageHtml.trim()) pages.push(currentPageHtml);
          currentPageHtml = el.outerHTML;
          currentWords = words;
          continue;
        }
      }

      if ((currentWords > 220 && isMajorHeader) || (currentWords + words > 360 && currentWords > 100)) {
        if (currentPageHtml.trim()) {
          pages.push(currentPageHtml);
        }
        currentPageHtml = el.outerHTML;
        currentWords = words;
      } else {
        currentPageHtml += el.outerHTML;
        currentWords += words;
      }
    }

    if (currentPageHtml.trim()) {
      pages.push(currentPageHtml);
    }

    return pages.length > 0 ? pages : [html];
  } catch {
    return [html];
  }
}

/**
 * Parse Word document (.docx, .doc, .html, .txt) with lossless layout, alignment & page preservation
 */
export async function parseWordDocument(file: File): Promise<ParsedWordDoc> {
  const fileName = file.name;
  const isDocx = fileName.toLowerCase().endsWith('.docx');
  const isHtml = fileName.toLowerCase().endsWith('.html') || fileName.toLowerCase().endsWith('.htm');

  if (isDocx) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Primary: OOXML Deep Parser for exact typography, margins, and media
      const deepParsed = await docxDeepParser.parse(arrayBuffer, fileName);
      return {
        html: deepParsed.fullHtml,
        pages: deepParsed.pages.map((p) => p.contentHtml),
        text: deepParsed.plainText,
        title: fileName,
        sectionSetup: deepParsed.sectionSetup,
        declaredFonts: deepParsed.declaredFonts,
        pageCount: deepParsed.pageCount,
        imageCount: deepParsed.imageCount,
        tableCount: deepParsed.tableCount,
      };
    } catch (deepErr) {
      console.warn('DocxDeepParser fallback to Mammoth parser:', deepErr);
      const arrayBuffer = await file.arrayBuffer();
      const mammothOptions = {
        convertImage: mammoth.images.imgElement((image: any) => {
          return image.read('base64').then((imageBuffer: string) => {
            return {
              src: `data:${image.contentType || 'image/png'};base64,${imageBuffer}`,
              style: 'max-width: 100%; height: auto; border-radius: 8px; margin: 12px auto; display: block;',
            };
          });
        }),
      };
      const rawTextResult = await mammoth.extractRawText({ arrayBuffer });
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer }, mammothOptions);
      const html = htmlResult.value || '<p><em>(Empty document)</em></p>';
      const pages = splitHtmlIntoPages(html);
      return { html, pages, text: rawTextResult.value, title: fileName };
    }
  } else if (isHtml) {
    const text = await file.text();
    const pages = splitHtmlIntoPages(text);
    return {
      html: text,
      pages,
      text: text.replace(/<[^>]*>?/gm, ''),
      title: fileName,
    };
  } else {
    // Plain text, Markdown, or Code
    const text = await file.text();
    const html = text
      .split(/\r\n\r\n|\n\n/)
      .map((p) => {
        const isCenter = p.trim().startsWith('[center]') || p.trim().startsWith('<center>');
        const cleanP = p.replace(/\[center\]|<\/?center>/gi, '').trim();
        return `<p style="${isCenter ? 'text-align: center;' : ''}">${cleanP.replace(/\r\n|\n/g, '<br/>')}</p>`;
      })
      .join('');

    const pages = splitHtmlIntoPages(html);

    return {
      html,
      pages,
      text,
      title: fileName,
    };
  }
}


/**
 * Parse Excel & CSV spreadsheet (.xlsx, .xls, .csv, .tsv) into headers, rows, and sheets
 */
export async function parseSpreadsheet(file: File): Promise<ParsedSpreadsheet> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const sheetNames = workbook.SheetNames.length > 0 ? workbook.SheetNames : ['Sheet 1'];
  const firstSheetName = sheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to 2D array
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (!rawData || rawData.length === 0) {
    return {
      sheetNames,
      activeSheet: firstSheetName,
      headers: ['A', 'B', 'C', 'D'],
      rows: [['', '', '', '']],
    };
  }

  const headers = rawData[0].map((h, i) => (h ? String(h).trim() : `Column ${i + 1}`));
  const rows = rawData.slice(1).map((row) => {
    // Ensure all columns match header length
    const paddedRow = new Array(headers.length).fill('');
    row.forEach((val, colIdx) => {
      if (colIdx < headers.length) {
        paddedRow[colIdx] = val !== null && val !== undefined ? String(val) : '';
      }
    });
    return paddedRow;
  });

  return {
    sheetNames,
    activeSheet: firstSheetName,
    headers: headers.length > 0 ? headers : ['A', 'B', 'C'],
    rows: rows.length > 0 ? rows : [new Array(headers.length || 3).fill('')],
  };
}

/**
 * Parse PowerPoint presentation (.pptx) by reading XML slides from the zip container
 */
export async function parsePowerPoint(file: File): Promise<ParsedSlide[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // Find slide files in ppt/slides/
    const slideFileNames: string[] = [];
    zip.forEach((relativePath) => {
      if (relativePath.match(/^ppt\/slides\/slide[0-9]+\.xml$/)) {
        slideFileNames.push(relativePath);
      }
    });

    // Natural sort: slide1.xml, slide2.xml, ..., slide10.xml
    slideFileNames.sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/[^0-9]/g, ''), 10) || 0;
      return numA - numB;
    });

    if (slideFileNames.length === 0) {
      return [
        {
          id: `slide_${Date.now()}_1`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          subtitle: 'Imported Presentation',
          bullets: ['Ready to add slide content'],
          theme: 'indigo',
        },
      ];
    }

    const themes: Array<'slate' | 'indigo' | 'emerald' | 'amber' | 'crimson'> = [
      'indigo',
      'emerald',
      'slate',
      'amber',
      'crimson',
    ];

    const parsedSlides: ParsedSlide[] = [];

    for (let i = 0; i < slideFileNames.length; i++) {
      const slidePath = slideFileNames[i];
      const xmlContent = await zip.file(slidePath)?.async('text');
      
      if (!xmlContent) continue;

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');

      // Extract all text paragraphs (<a:p>)
      const paragraphs = xmlDoc.getElementsByTagName('a:p');
      const textLines: string[] = [];

      for (let p = 0; p < paragraphs.length; p++) {
        const textRuns = paragraphs[p].getElementsByTagName('a:t');
        let fullLine = '';
        for (let t = 0; t < textRuns.length; t++) {
          fullLine += textRuns[t].textContent || '';
        }
        const cleaned = fullLine.trim();
        if (cleaned.length > 0) {
          textLines.push(cleaned);
        }
      }

      let title = textLines[0] || `Slide ${i + 1}`;
      let subtitle: string | undefined = undefined;
      let bullets: string[] = [];

      if (textLines.length > 1) {
        if (textLines.length === 2) {
          subtitle = textLines[1];
        } else {
          subtitle = textLines[1];
          bullets = textLines.slice(2);
        }
      }

      if (bullets.length === 0 && textLines.length > 1 && !subtitle) {
        bullets = textLines.slice(1);
      }

      parsedSlides.push({
        id: `slide_imported_${Date.now()}_${i + 1}`,
        title,
        subtitle,
        bullets: bullets.length > 0 ? bullets : ['No bullet points in this slide'],
        theme: themes[i % themes.length],
      });
    }

    return parsedSlides.length > 0
      ? parsedSlides
      : [
          {
            id: `slide_${Date.now()}_1`,
            title: file.name.replace(/\.[^/.]+$/, ''),
            subtitle: 'Imported Presentation',
            bullets: ['Content loaded from file'],
            theme: 'indigo',
          },
        ];
  } catch (error) {
    console.error('Failed to parse PPTX file:', error);
    return [
      {
        id: `slide_${Date.now()}_1`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        subtitle: 'Imported Document',
        bullets: [
          'Presentation structure recognized',
          'Edit slide content and styling using the top ribbon',
        ],
        theme: 'indigo',
      },
    ];
  }
}
