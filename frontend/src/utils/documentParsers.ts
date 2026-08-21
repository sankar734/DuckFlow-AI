import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

export interface ParsedWordDoc {
  html: string;
  text: string;
  title: string;
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
  theme: 'slate' | 'indigo' | 'emerald' | 'amber' | 'crimson';
}

/**
 * Parse Word document (.docx, .doc, .html, .txt) into clean HTML & plain text
 */
export async function parseWordDocument(file: File): Promise<ParsedWordDoc> {
  const fileName = file.name;
  const isDocx = fileName.toLowerCase().endsWith('.docx');
  const isHtml = fileName.toLowerCase().endsWith('.html') || fileName.toLowerCase().endsWith('.htm');

  if (isDocx) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const rawTextResult = await mammoth.extractRawText({ arrayBuffer });
    let html = result.value;

    // Enhance mammoth HTML output for our rich text editor
    if (!html || html.trim() === '') {
      html = '<p><em>(Empty document)</em></p>';
    }

    return {
      html,
      text: rawTextResult.value,
      title: fileName,
    };
  } else if (isHtml) {
    const text = await file.text();
    return {
      html: text,
      text: text.replace(/<[^>]*>?/gm, ''),
      title: fileName,
    };
  } else {
    // Plain text or markdown
    const text = await file.text();
    const html = text
      .split(/\r\n\r\n|\n\n/)
      .map((p) => `<p>${p.replace(/\r\n|\n/g, '<br/>')}</p>`)
      .join('');

    return {
      html,
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
