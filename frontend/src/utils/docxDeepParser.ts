import JSZip from 'jszip';
import { UnitConversions } from './unitConversions';
import { DocumentAlignment, FontStyle, PageSetupModel } from '../types/documentModel';

export interface DeepParsedSection {
  pageSize: { widthPt: number; heightPt: number; name: string };
  orientation: 'portrait' | 'landscape';
  margins: { topPt: number; bottomPt: number; leftPt: number; rightPt: number; headerPt: number; footerPt: number };
  headerHtml?: string;
  footerHtml?: string;
  headerText?: string;
  footerText?: string;
}

export interface DeepParsedPage {
  pageNumber: number;
  contentHtml: string;
  section: DeepParsedSection;
}

export interface DeepParsedWordDocument {
  title: string;
  fullHtml: string;
  pages: DeepParsedPage[];
  plainText: string;
  sectionSetup: DeepParsedSection;
  declaredFonts: string[];
  imageCount: number;
  tableCount: number;
  pageCount: number;
}

interface ResolvedStyle {
  fontFamily?: string;
  fontSizePt?: number;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  lineHeightMultiplier?: number;
  spaceBeforePt?: number;
  spaceAfterPt?: number;
  alignment?: DocumentAlignment;
  indentLeftPt?: number;
  firstLineIndentPt?: number;
}

/**
 * OOXML Deep Parser & Style Inheritance Resolver Engine
 * Losslessly parses Word .docx packages and preserves full typography, styling, margins, and media.
 */
export class DocxDeepParser {
  private zip!: JSZip;
  private xmlParser = new DOMParser();
  private stylesMap = new Map<string, ResolvedStyle>();
  private defaultDocStyle: ResolvedStyle = {
    fontFamily: 'Calibri',
    fontSizePt: 11,
    bold: false,
    italic: false,
    color: '#1e293b',
    lineHeightMultiplier: 1.35,
    spaceBeforePt: 0,
    spaceAfterPt: 4,
    alignment: 'left',
  };
  private mediaMap = new Map<string, string>(); // rId -> base64 data URL
  private declaredFonts: string[] = [];
  private headerContents = new Map<string, string>();
  private footerContents = new Map<string, string>();

  /**
   * Main parsing entry point
   */
  async parse(arrayBuffer: ArrayBuffer, fileName: string): Promise<DeepParsedWordDocument> {
    this.zip = await JSZip.loadAsync(arrayBuffer);
    this.stylesMap.clear();
    this.mediaMap.clear();
    this.declaredFonts = [];
    this.headerContents.clear();
    this.footerContents.clear();

    // 1. Extract Media & Relationships
    await this.extractMediaAndRelationships();

    // 2. Parse Font Table
    await this.parseFontTable();

    // 3. Parse Styles & Inheritance Hierarchy
    await this.parseStyles();

    // 4. Parse Headers and Footers
    await this.parseHeadersAndFooters();

    // 5. Parse Document Body & Sections
    return this.parseDocumentBody(fileName);
  }

  /**
   * Extract embedded media from word/media/* and map to rId via word/_rels/document.xml.rels
   */
  private async extractMediaAndRelationships() {
    const mediaFiles = Object.keys(this.zip.files).filter((p) => p.startsWith('word/media/'));
    const mediaPathToDataUrl = new Map<string, string>();

    for (const path of mediaFiles) {
      const file = this.zip.files[path];
      if (file && !file.dir) {
        const ext = path.split('.').pop()?.toLowerCase() || 'png';
        const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'svg' ? 'image/svg+xml' : ext === 'gif' ? 'image/gif' : 'image/png';
        const base64 = await file.async('base64');
        const dataUrl = `data:${mimeType};base64,${base64}`;
        mediaPathToDataUrl.set(path, dataUrl);
        const fileNameOnly = path.replace('word/media/', '');
        mediaPathToDataUrl.set(fileNameOnly, dataUrl);
      }
    }

    // Read word/_rels/document.xml.rels
    const relsXml = await this.zip.file('word/_rels/document.xml.rels')?.async('text');
    if (relsXml) {
      const doc = this.xmlParser.parseFromString(relsXml, 'application/xml');
      const relationships = Array.from(doc.getElementsByTagName('Relationship'));
      relationships.forEach((rel) => {
        const id = rel.getAttribute('Id');
        const target = rel.getAttribute('Target');
        if (id && target) {
          const cleanTarget = target.replace(/^media\//, '').replace(/^word\/media\//, '');
          const dataUrl = mediaPathToDataUrl.get(`word/media/${cleanTarget}`) || mediaPathToDataUrl.get(cleanTarget);
          if (dataUrl) {
            this.mediaMap.set(id, dataUrl);
          }
        }
      });
    }
  }

  /**
   * Parse word/fontTable.xml to identify declared fonts
   */
  private async parseFontTable() {
    const fontXml = await this.zip.file('word/fontTable.xml')?.async('text');
    if (fontXml) {
      const doc = this.xmlParser.parseFromString(fontXml, 'application/xml');
      const fonts = Array.from(doc.getElementsByTagName('w:font'));
      fonts.forEach((f) => {
        const name = f.getAttribute('w:name');
        if (name && !this.declaredFonts.includes(name)) {
          this.declaredFonts.push(name);
        }
      });
    }
  }

  /**
   * Parse word/styles.xml with full cascade resolution
   */
  private async parseStyles() {
    const stylesXml = await this.zip.file('word/styles.xml')?.async('text');
    if (!stylesXml) return;

    const doc = this.xmlParser.parseFromString(stylesXml, 'application/xml');

    // 1. Doc Defaults
    const docDefaults = doc.getElementsByTagName('w:docDefaults')[0];
    if (docDefaults) {
      const rPrDefault = docDefaults.getElementsByTagName('w:rPrDefault')[0];
      if (rPrDefault) {
        const rPr = rPrDefault.getElementsByTagName('w:rPr')[0];
        if (rPr) {
          this.defaultDocStyle = { ...this.defaultDocStyle, ...this.extractRunProperties(rPr) };
        }
      }
      const pPrDefault = docDefaults.getElementsByTagName('w:pPrDefault')[0];
      if (pPrDefault) {
        const pPr = pPrDefault.getElementsByTagName('w:pPr')[0];
        if (pPr) {
          this.defaultDocStyle = { ...this.defaultDocStyle, ...this.extractParagraphProperties(pPr) };
        }
      }
    }

    // 2. Named Styles
    const styleElements = Array.from(doc.getElementsByTagName('w:style'));
    const rawStyles = new Map<string, { basedOn?: string; props: ResolvedStyle }>();

    styleElements.forEach((s) => {
      const styleId = s.getAttribute('w:styleId');
      if (!styleId) return;

      const basedOn = s.getElementsByTagName('w:basedOn')[0]?.getAttribute('w:val') || undefined;
      const pPr = s.getElementsByTagName('w:pPr')[0];
      const rPr = s.getElementsByTagName('w:rPr')[0];

      const pProps = pPr ? this.extractParagraphProperties(pPr) : {};
      const rProps = rPr ? this.extractRunProperties(rPr) : {};

      rawStyles.set(styleId, {
        basedOn,
        props: { ...pProps, ...rProps },
      });
    });

    // Resolve Style Inheritance (max 5 hops to prevent cycles)
    rawStyles.forEach((val, styleId) => {
      let resolved = { ...this.defaultDocStyle };
      let currentId: string | undefined = styleId;
      const chain: string[] = [];

      while (currentId && rawStyles.has(currentId) && chain.length < 5) {
        chain.unshift(currentId);
        currentId = rawStyles.get(currentId)?.basedOn;
      }

      chain.forEach((id) => {
        const s = rawStyles.get(id);
        if (s) {
          resolved = { ...resolved, ...s.props };
        }
      });

      this.stylesMap.set(styleId, resolved);
    });
  }

  /**
   * Parse word/header*.xml and word/footer*.xml
   */
  private async parseHeadersAndFooters() {
    const files = Object.keys(this.zip.files);
    for (const path of files) {
      if (path.match(/^word\/header\d+\.xml$/)) {
        const xml = await this.zip.file(path)?.async('text');
        if (xml) {
          const doc = this.xmlParser.parseFromString(xml, 'application/xml');
          this.headerContents.set(path.replace('word/', ''), doc.body?.textContent?.trim() || '');
        }
      } else if (path.match(/^word\/footer\d+\.xml$/)) {
        const xml = await this.zip.file(path)?.async('text');
        if (xml) {
          const doc = this.xmlParser.parseFromString(xml, 'application/xml');
          this.footerContents.set(path.replace('word/', ''), doc.body?.textContent?.trim() || '');
        }
      }
    }
  }

  /**
   * Parse main document body
   */
  private async parseDocumentBody(fileName: string): Promise<DeepParsedWordDocument> {
    const docXml = await this.zip.file('word/document.xml')?.async('text');
    if (!docXml) {
      throw new Error('Invalid DOCX package: word/document.xml missing');
    }

    const doc = this.xmlParser.parseFromString(docXml, 'application/xml');
    const body = doc.getElementsByTagName('w:body')[0];
    if (!body) {
      throw new Error('Invalid DOCX: w:body element missing');
    }

    // Parse final section properties
    const lastSectPr = body.getElementsByTagName('w:sectPr')[0];
    const defaultSection = this.extractSectionProperties(lastSectPr);

    const pages: DeepParsedPage[] = [];
    let currentPageHtml = '';
    let currentPageNumber = 1;
    let plainText = '';
    let tableCount = 0;
    let imageCount = 0;

    const children = Array.from(body.children);

    for (const node of children) {
      const nodeName = node.nodeName;

      // 1. Paragraph
      if (nodeName === 'w:p') {
        const pPr = node.getElementsByTagName('w:pPr')[0];
        
        // Check for explicit page break in paragraph properties or child runs
        const isPageBreak = this.hasPageBreak(node);

        const { html: phtml, text: ptext, imgCount: pImgs } = this.renderParagraph(node);
        plainText += ptext + '\n';
        imageCount += pImgs;

        if (isPageBreak && currentPageHtml.trim()) {
          pages.push({
            pageNumber: currentPageNumber,
            contentHtml: currentPageHtml,
            section: defaultSection,
          });
          currentPageNumber++;
          currentPageHtml = phtml;
        } else {
          currentPageHtml += phtml;
        }

        // Check if paragraph contains section break
        const pSectPr = pPr?.getElementsByTagName('w:sectPr')[0];
        if (pSectPr && currentPageHtml.trim()) {
          const sectProps = this.extractSectionProperties(pSectPr);
          pages.push({
            pageNumber: currentPageNumber,
            contentHtml: currentPageHtml,
            section: sectProps,
          });
          currentPageNumber++;
          currentPageHtml = '';
        }
      }

      // 2. Table
      else if (nodeName === 'w:tbl') {
        tableCount++;
        const tableHtml = this.renderTable(node);
        plainText += '[Table]\n';
        currentPageHtml += tableHtml;
      }
    }

    if (currentPageHtml.trim()) {
      pages.push({
        pageNumber: currentPageNumber,
        contentHtml: currentPageHtml,
        section: defaultSection,
      });
    }

    if (pages.length === 0) {
      pages.push({
        pageNumber: 1,
        contentHtml: '<p><em>(Empty document)</em></p>',
        section: defaultSection,
      });
    }

    const fullHtml = pages.map((p) => p.contentHtml).join('<div class="page-break" data-page-break="true"></div>');

    return {
      title: fileName,
      fullHtml,
      pages,
      plainText: plainText.trim(),
      sectionSetup: defaultSection,
      declaredFonts: this.declaredFonts,
      imageCount,
      tableCount,
      pageCount: pages.length,
    };
  }

  /**
   * Render a paragraph node into CSS-styled semantic HTML
   */
  private renderParagraph(pNode: Element): { html: string; text: string; imgCount: number } {
    const pPr = pNode.getElementsByTagName('w:pPr')[0];
    const styleId = pPr?.getElementsByTagName('w:pStyle')[0]?.getAttribute('w:val');
    const inherited = (styleId && this.stylesMap.get(styleId)) || this.defaultDocStyle;
    const direct = pPr ? this.extractParagraphProperties(pPr) : {};

    const resolved: ResolvedStyle = { ...inherited, ...direct };

    let pText = '';
    let runsHtml = '';
    let imgCount = 0;

    const childNodes = Array.from(pNode.childNodes);

    for (const child of childNodes) {
      const name = child.nodeName;

      if (name === 'w:r') {
        const { html: rHtml, text: rText, isImg } = this.renderRun(child as Element, resolved);
        runsHtml += rHtml;
        pText += rText;
        if (isImg) imgCount++;
      } else if (name === 'w:hyperlink') {
        const runs = Array.from((child as Element).getElementsByTagName('w:r'));
        runs.forEach((r) => {
          const { html: rHtml, text: rText } = this.renderRun(r, resolved);
          runsHtml += `<span style="color:#2563eb; text-decoration:underline;">${rHtml}</span>`;
          pText += rText;
        });
      }
    }

    // Build inline CSS for the paragraph
    const styles: string[] = [];
    if (resolved.alignment) styles.push(`text-align: ${resolved.alignment}`);
    if (resolved.lineHeightMultiplier) styles.push(`line-height: ${resolved.lineHeightMultiplier}`);
    if (resolved.spaceBeforePt !== undefined && resolved.spaceBeforePt > 0) styles.push(`margin-top: ${resolved.spaceBeforePt}pt`);
    if (resolved.spaceAfterPt !== undefined) styles.push(`margin-bottom: ${resolved.spaceAfterPt}pt`);
    if (resolved.indentLeftPt !== undefined && resolved.indentLeftPt > 0) styles.push(`margin-left: ${resolved.indentLeftPt}pt`);
    if (resolved.firstLineIndentPt !== undefined && resolved.firstLineIndentPt !== 0) styles.push(`text-indent: ${resolved.firstLineIndentPt}pt`);
    if (resolved.fontFamily) styles.push(`font-family: '${resolved.fontFamily}', Calibri, Arial, sans-serif`);
    if (resolved.fontSizePt) styles.push(`font-size: ${resolved.fontSizePt}pt`);
    if (resolved.color) styles.push(`color: ${resolved.color}`);

    // If empty paragraph, keep spacing
    if (!runsHtml.trim()) {
      runsHtml = '<br/>';
    }

    const isHeading = styleId && (styleId.startsWith('Heading') || styleId.startsWith('Title'));
    const tag = styleId === 'Heading1' || styleId === 'Title' ? 'h1' : styleId === 'Heading2' ? 'h2' : styleId === 'Heading3' ? 'h3' : 'p';

    return {
      html: `<${tag} style="${styles.join('; ')}">${runsHtml}</${tag}>`,
      text: pText,
      imgCount,
    };
  }

  /**
   * Render a run node (<w:r>) into styled HTML
   */
  private renderRun(rNode: Element, pResolved: ResolvedStyle): { html: string; text: string; isImg: boolean } {
    const rPr = rNode.getElementsByTagName('w:rPr')[0];
    const rStyleId = rPr?.getElementsByTagName('w:rStyle')[0]?.getAttribute('w:val');
    const rInherited = (rStyleId && this.stylesMap.get(rStyleId)) || {};
    const rDirect = rPr ? this.extractRunProperties(rPr) : {};

    const resolved: ResolvedStyle = { ...pResolved, ...rInherited, ...rDirect };

    let runText = '';
    let runHtml = '';
    let isImg = false;

    const childNodes = Array.from(rNode.childNodes);

    for (const child of childNodes) {
      const name = child.nodeName;

      if (name === 'w:t') {
        const textVal = child.textContent || '';
        runText += textVal;
        runHtml += this.escapeHtml(textVal);
      } else if (name === 'w:br') {
        runText += '\n';
        runHtml += '<br/>';
      } else if (name === 'w:tab') {
        runText += '\t';
        runHtml += '&emsp;';
      } else if (name === 'w:drawing') {
        const img = this.renderDrawing(child as Element);
        if (img) {
          runHtml += img;
          isImg = true;
        }
      }
    }

    if (isImg && !runText) {
      return { html: runHtml, text: '[Image]', isImg: true };
    }

    if (!runHtml) return { html: '', text: '', isImg: false };

    const styles: string[] = [];
    if (resolved.fontFamily && resolved.fontFamily !== pResolved.fontFamily) {
      styles.push(`font-family: '${resolved.fontFamily}', Calibri, Arial, sans-serif`);
    }
    if (resolved.fontSizePt && resolved.fontSizePt !== pResolved.fontSizePt) {
      styles.push(`font-size: ${resolved.fontSizePt}pt`);
    }
    if (resolved.color && resolved.color !== pResolved.color) {
      styles.push(`color: ${resolved.color}`);
    }
    if (resolved.bold) styles.push('font-weight: bold');
    if (resolved.italic) styles.push('font-style: italic');

    if (styles.length > 0) {
      return {
        html: `<span style="${styles.join('; ')}">${runHtml}</span>`,
        text: runText,
        isImg: false,
      };
    }

    return { html: runHtml, text: runText, isImg: false };
  }

  /**
   * Render drawing / blip image element
   */
  private renderDrawing(drawingNode: Element): string | null {
    const blip = drawingNode.getElementsByTagName('a:blip')[0];
    if (!blip) return null;

    const rId = blip.getAttribute('r:embed');
    if (!rId) return null;

    const dataUrl = this.mediaMap.get(rId);
    if (!dataUrl) return null;

    // Get exact extent dimensions in EMUs
    const extent = drawingNode.getElementsByTagName('wp:extent')[0];
    let widthPx = 450;
    let heightPx = 250;

    if (extent) {
      const cx = parseInt(extent.getAttribute('cx') || '0', 10);
      const cy = parseInt(extent.getAttribute('cy') || '0', 10);
      if (cx > 0) widthPx = Math.min(650, Math.round(UnitConversions.emusToPixels(cx)));
      if (cy > 0) heightPx = Math.round(UnitConversions.emusToPixels(cy));
    }

    return `<img src="${dataUrl}" style="max-width: 100%; width: ${widthPx}px; height: auto; border-radius: 6px; margin: 12px auto; display: block; box-shadow: 0 2px 4px rgba(0,0,0,0.08);" alt="Embedded Document Media" />`;
  }

  /**
   * Render Table with borders, shading, cell widths, and alignments
   */
  private renderTable(tblNode: Element): string {
    const rows = Array.from(tblNode.getElementsByTagName('w:tr'));
    if (rows.length === 0) return '';

    const tblPr = tblNode.getElementsByTagName('w:tblPr')[0];
    const tblBorders = tblPr?.getElementsByTagName('w:tblBorders')[0];
    let isBorderless = false;
    if (tblBorders) {
      const top = tblBorders.getElementsByTagName('w:top')[0]?.getAttribute('w:val');
      const bottom = tblBorders.getElementsByTagName('w:bottom')[0]?.getAttribute('w:val');
      const insideH = tblBorders.getElementsByTagName('w:insideH')[0]?.getAttribute('w:val');
      if ((top === 'none' || top === 'nil') && (bottom === 'none' || bottom === 'nil') && (insideH === 'none' || insideH === 'nil')) {
        isBorderless = true;
      }
    }

    let rowsHtml = '';

    rows.forEach((r, rIdx) => {
      let cellsHtml = '';
      const cells = Array.from(r.getElementsByTagName('w:tc'));

      cells.forEach((c) => {
        const tcPr = c.getElementsByTagName('w:tcPr')[0];
        
        // Shading / Background
        const shd = tcPr?.getElementsByTagName('w:shd')[0]?.getAttribute('w:fill');
        const bgColor = shd && shd !== 'auto' && shd !== 'none' ? `#${shd}` : isBorderless ? 'transparent' : rIdx === 0 ? '#f8fafc' : 'transparent';

        // Cell Width
        const tcW = tcPr?.getElementsByTagName('w:tcW')[0]?.getAttribute('w:w');
        const widthPt = tcW ? UnitConversions.twipsToPoints(parseInt(tcW, 10)) : undefined;

        // Cell Vertical Alignment
        const vAlign = tcPr?.getElementsByTagName('w:vAlign')[0]?.getAttribute('w:val') || 'top';

        // Content
        const paragraphs = Array.from(c.getElementsByTagName('w:p'));
        const cellContent = paragraphs.map((p) => this.renderParagraph(p).html).join('');

        const isHeader = !isBorderless && rIdx === 0 && rows[0].querySelector('w:tblHeader') !== null;
        const tag = isHeader ? 'th' : 'td';

        const cellStyles = [
          isBorderless ? 'border: none' : 'border: 1px solid #cbd5e1',
          isBorderless ? 'padding: 4pt 6pt' : 'padding: 8pt 10pt',
          `background-color: ${bgColor}`,
          `vertical-align: ${vAlign === 'center' ? 'middle' : vAlign}`,
        ];
        if (widthPt) cellStyles.push(`width: ${widthPt}pt`);

        cellsHtml += `<${tag} style="${cellStyles.join('; ')}">${cellContent || '<br/>'}</${tag}>`;
      });

      rowsHtml += `<tr>${cellsHtml}</tr>`;
    });

    return `<table data-borderless="${isBorderless ? 'true' : 'false'}" style="width: 100%; border-collapse: collapse; margin: 16pt 0; ${isBorderless ? 'border: none;' : 'border: 1px solid #cbd5e1;'} font-size: 10pt;">${rowsHtml}</table>`;
  }

  /**
   * Extract paragraph properties (<w:pPr>)
   */
  private extractParagraphProperties(pPr: Element): ResolvedStyle {
    const props: ResolvedStyle = {};

    // Alignment (<w:jc w:val="left|center|right|both"/>)
    const jc = pPr.getElementsByTagName('w:jc')[0]?.getAttribute('w:val');
    if (jc === 'center') props.alignment = 'center';
    else if (jc === 'right') props.alignment = 'right';
    else if (jc === 'both' || jc === 'distribute') props.alignment = 'justify';
    else if (jc === 'left') props.alignment = 'left';

    // Spacing (<w:spacing w:before="120" w:after="120" w:line="360" w:lineRule="auto"/>)
    const spacing = pPr.getElementsByTagName('w:spacing')[0];
    if (spacing) {
      const before = spacing.getAttribute('w:before');
      const after = spacing.getAttribute('w:after');
      const line = spacing.getAttribute('w:line');
      const lineRule = spacing.getAttribute('w:lineRule');

      if (before) props.spaceBeforePt = UnitConversions.twipsToPoints(parseInt(before, 10));
      if (after) props.spaceAfterPt = UnitConversions.twipsToPoints(parseInt(after, 10));
      if (line) props.lineHeightMultiplier = UnitConversions.ooxmlLineSpacingToMultiplier(parseInt(line, 10), lineRule || 'auto');
    }

    // Indentation (<w:ind w:left="720" w:firstLine="360" w:hanging="360"/>)
    const ind = pPr.getElementsByTagName('w:ind')[0];
    if (ind) {
      const left = ind.getAttribute('w:left');
      const firstLine = ind.getAttribute('w:firstLine');
      const hanging = ind.getAttribute('w:hanging');

      if (left) props.indentLeftPt = UnitConversions.twipsToPoints(parseInt(left, 10));
      if (firstLine) props.firstLineIndentPt = UnitConversions.twipsToPoints(parseInt(firstLine, 10));
      else if (hanging) props.firstLineIndentPt = -UnitConversions.twipsToPoints(parseInt(hanging, 10));
    }

    return props;
  }

  /**
   * Extract run properties (<w:rPr>)
   */
  private extractRunProperties(rPr: Element): ResolvedStyle {
    const props: ResolvedStyle = {};

    // Font family (<w:rFonts w:ascii="Times New Roman"/>)
    const rFonts = rPr.getElementsByTagName('w:rFonts')[0];
    const font = rFonts?.getAttribute('w:ascii') || rFonts?.getAttribute('w:hAnsi');
    if (font) props.fontFamily = font;

    // Font size (<w:sz w:val="24"/> -> 12pt)
    const sz = rPr.getElementsByTagName('w:sz')[0]?.getAttribute('w:val');
    if (sz) props.fontSizePt = UnitConversions.halfPointsToPoints(parseInt(sz, 10));

    // Bold (<w:b/> or <w:b w:val="0"/>)
    const b = rPr.getElementsByTagName('w:b')[0];
    if (b) props.bold = b.getAttribute('w:val') !== '0' && b.getAttribute('w:val') !== 'false';

    // Italic (<w:i/>)
    const i = rPr.getElementsByTagName('w:i')[0];
    if (i) props.italic = i.getAttribute('w:val') !== '0' && i.getAttribute('w:val') !== 'false';

    // Color (<w:color w:val="FF0000"/>)
    const color = rPr.getElementsByTagName('w:color')[0]?.getAttribute('w:val');
    if (color && color !== 'auto') props.color = `#${color}`;

    return props;
  }

  /**
   * Extract section properties (<w:sectPr>)
   */
  private extractSectionProperties(sectPr?: Element): DeepParsedSection {
    let widthPt = 595.3; // A4 default width
    let heightPt = 841.9; // A4 default height
    let orientation: 'portrait' | 'landscape' = 'portrait';
    let name = 'A4';

    let topPt = 72; // 1 inch standard
    let bottomPt = 72;
    let leftPt = 72;
    let rightPt = 72;
    let headerPt = 36;
    let footerPt = 36;

    if (sectPr) {
      // Page Size (<w:pgSz w:w="11906" w:h="16838" w:orient="portrait"/>)
      const pgSz = sectPr.getElementsByTagName('w:pgSz')[0];
      if (pgSz) {
        const w = pgSz.getAttribute('w:w');
        const h = pgSz.getAttribute('w:h');
        const orient = pgSz.getAttribute('w:orient');

        if (w) widthPt = UnitConversions.twipsToPoints(parseInt(w, 10));
        if (h) heightPt = UnitConversions.twipsToPoints(parseInt(h, 10));
        if (orient === 'landscape') orientation = 'landscape';

        // Check if standard size
        if (Math.abs(widthPt - 612) < 5 && Math.abs(heightPt - 792) < 5) name = 'Letter';
        else if (Math.abs(widthPt - 595.3) < 5 && Math.abs(heightPt - 841.9) < 5) name = 'A4';
        else name = 'Custom';
      }

      // Page Margins (<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>)
      const pgMar = sectPr.getElementsByTagName('w:pgMar')[0];
      if (pgMar) {
        const top = pgMar.getAttribute('w:top');
        const bottom = pgMar.getAttribute('w:bottom');
        const left = pgMar.getAttribute('w:left');
        const right = pgMar.getAttribute('w:right');
        const hdr = pgMar.getAttribute('w:header');
        const ftr = pgMar.getAttribute('w:footer');

        if (top) topPt = UnitConversions.twipsToPoints(parseInt(top, 10));
        if (bottom) bottomPt = UnitConversions.twipsToPoints(parseInt(bottom, 10));
        if (left) leftPt = UnitConversions.twipsToPoints(parseInt(left, 10));
        if (right) rightPt = UnitConversions.twipsToPoints(parseInt(right, 10));
        if (hdr) headerPt = UnitConversions.twipsToPoints(parseInt(hdr, 10));
        if (ftr) footerPt = UnitConversions.twipsToPoints(parseInt(ftr, 10));
      }
    }

    return {
      pageSize: { widthPt, heightPt, name },
      orientation,
      margins: { topPt, bottomPt, leftPt, rightPt, headerPt, footerPt },
      headerText: this.headerContents.values().next().value || undefined,
      footerText: this.footerContents.values().next().value || undefined,
    };
  }

  /**
   * Check if element contains explicit page break
   */
  private hasPageBreak(node: Element): boolean {
    const brs = Array.from(node.getElementsByTagName('w:br'));
    return brs.some((b) => b.getAttribute('w:type') === 'page');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

export const docxDeepParser = new DocxDeepParser();
