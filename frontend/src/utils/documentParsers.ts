import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

export interface ParsedWordDoc {
  html: string;
  pages: string[];
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

      // Custom Mammoth Style Map to preserve headings, tables, alignments
      const options = {
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Title'] => h1.doc-title:fresh",
          "p[style-name='Subtitle'] => p.doc-subtitle:fresh",
          "table => table.doc-table:fresh",
          "r[style-name='Strong'] => strong",
          "r[style-name='Emphasis'] => em",
        ],
      };

      const result = await mammoth.convertToHtml({ arrayBuffer }, options);
      const rawTextResult = await mammoth.extractRawText({ arrayBuffer });
      let html = result.value;

      // Extract direct XML formatting from docx zip for text alignments and explicit page breaks
      try {
        const zip = await JSZip.loadAsync(arrayBuffer);
        const docXml = await zip.file('word/document.xml')?.async('text');

        if (docXml) {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(docXml, 'application/xml');
          const paragraphs = Array.from(xmlDoc.getElementsByTagName('w:p'));

          // Map extracted paragraph texts to their alignments
          const alignments: Array<{ textSnippet: string; alignment: string; isPageBreak: boolean }> = [];

          paragraphs.forEach((p) => {
            const jc = p.getElementsByTagName('w:jc')[0];
            let alignment = 'left';
            if (jc) {
              const val = jc.getAttribute('w:val');
              if (val === 'center') alignment = 'center';
              else if (val === 'right') alignment = 'right';
              else if (val === 'both' || val === 'distribute') alignment = 'justify';
            }

            // Check for explicit page breaks (<w:br w:type="page"/>)
            const brs = Array.from(p.getElementsByTagName('w:br'));
            const hasPageBreak = brs.some((b) => b.getAttribute('w:type') === 'page');

            const textRuns = Array.from(p.getElementsByTagName('w:t'));
            const pText = textRuns.map((t) => t.textContent || '').join('').trim();

            if (pText.length > 0) {
              alignments.push({
                textSnippet: pText.substring(0, 40),
                alignment,
                isPageBreak: hasPageBreak,
              });
            }
          });

          // Post-process HTML to inject alignment styles and table formatting
          if (alignments.length > 0) {
            const docParser = new DOMParser();
            const parsedDoc = docParser.parseFromString(html, 'text/html');

            const pElements = Array.from(parsedDoc.body.querySelectorAll('p, h1, h2, h3, h4'));

            pElements.forEach((el) => {
              const elText = (el.textContent || '').trim().substring(0, 40);
              const matched = alignments.find(
                (a) => a.textSnippet && elText && (a.textSnippet.startsWith(elText) || elText.startsWith(a.textSnippet))
              );

              if (matched && matched.alignment !== 'left') {
                el.setAttribute(
                  'style',
                  `text-align: ${matched.alignment}; ${el.getAttribute('style') || ''}`
                );
              }

              if (matched?.isPageBreak) {
                const pageBreakDiv = parsedDoc.createElement('div');
                pageBreakDiv.className = 'page-break';
                pageBreakDiv.setAttribute('data-page-break', 'true');
                el.parentNode?.insertBefore(pageBreakDiv, el.nextSibling);
              }
            });

            // Style all tables properly
            parsedDoc.body.querySelectorAll('table').forEach((tbl) => {
              tbl.setAttribute(
                'style',
                'width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #cbd5e1;'
              );
              tbl.querySelectorAll('th, td').forEach((cell) => {
                const existing = cell.getAttribute('style') || '';
                cell.setAttribute('style', `border: 1px solid #cbd5e1; padding: 8px 12px; ${existing}`);
              });
              tbl.querySelectorAll('th').forEach((th) => {
                const existing = th.getAttribute('style') || '';
                th.setAttribute('style', `background: #f8fafc; font-weight: bold; ${existing}`);
              });
            });

            html = parsedDoc.body.innerHTML;
          }
        }
      } catch (xmlErr) {
        console.warn('Word XML deep inspection non-fatal notice:', xmlErr);
      }

      if (!html || html.trim() === '') {
        html = '<p><em>(Empty document)</em></p>';
      }

      const pages = splitHtmlIntoPages(html);

      return {
        html,
        pages,
        text: rawTextResult.value,
        title: fileName,
      };
    } catch (err) {
      console.error('Word parsing error:', err);
      const text = await file.text();
      const pages = splitHtmlIntoPages(text);
      return { html: text, pages, text, title: fileName };
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
