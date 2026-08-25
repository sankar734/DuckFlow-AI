/**
 * DocuFlow AI — Canonical Document Model
 * Unified internal schema representing multi-format Office documents,
 * spreadsheets, and presentations with high-fidelity formatting.
 */

export type DocumentAlignment = 'left' | 'center' | 'right' | 'justify';

export interface FontStyle {
  family?: string;
  size?: number; // in pt or px
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  highlightColor?: string;
  lineHeight?: number;
}

export interface ParagraphModel {
  id: string;
  type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'blockquote' | 'bullet' | 'numbered';
  text: string;
  html?: string;
  alignment: DocumentAlignment;
  font?: FontStyle;
  indent?: number;
  spacingBefore?: number;
  spacingAfter?: number;
}

export interface TableCellModel {
  id: string;
  content: string;
  html?: string;
  alignment?: DocumentAlignment;
  backgroundColor?: string;
  bold?: boolean;
  colspan?: number;
  rowspan?: number;
}

export interface TableModel {
  id: string;
  rows: TableCellModel[][];
  headers?: string[];
  borderColor?: string;
  hasHeaderRow?: boolean;
  striped?: boolean;
}

export interface ImageModel {
  id: string;
  src: string; // Base64 or Blob URL
  name?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  alignment: DocumentAlignment;
  caption?: string;
  relationshipId?: string;
}

export interface PageSetupModel {
  pageSize: 'A4' | 'Letter' | 'Legal' | 'Custom';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  headerText?: string;
  footerText?: string;
  showPageNumbers?: boolean;
}

export interface CanonicalWordDocument {
  metadata: {
    title: string;
    author?: string;
    wordCount?: number;
    pageCount?: number;
    createdAt?: string;
    updatedAt?: string;
  };
  pageSetup: PageSetupModel;
  pages: Array<{
    id: string;
    pageNumber: number;
    contentHtml: string;
    paragraphs?: ParagraphModel[];
    tables?: TableModel[];
    images?: ImageModel[];
    headerText?: string;
    footerText?: string;
  }>;
}

export interface SpreadsheetCell {
  row: number;
  col: number;
  value: string | number | boolean | null;
  formula?: string;
  formattedText?: string;
  type?: 'string' | 'number' | 'boolean' | 'date' | 'formula';
  style?: {
    bold?: boolean;
    italic?: boolean;
    color?: string;
    backgroundColor?: string;
    alignment?: DocumentAlignment;
    numberFormat?: string;
    border?: boolean;
  };
}

export interface SpreadsheetSheet {
  id: string;
  name: string;
  grid: string[][];
  cells?: Record<string, SpreadsheetCell>;
  headers: string[];
  columnWidths?: number[];
  rowHeights?: number[];
  mergedRanges?: Array<{ from: { row: number; col: number }; to: { row: number; col: number } }>;
}

export interface CanonicalWorkbook {
  title: string;
  sheets: SpreadsheetSheet[];
  activeSheetIndex: number;
  metadata?: Record<string, any>;
}

export interface SlideElement {
  id: string;
  type: 'title' | 'subtitle' | 'text' | 'bullet' | 'image' | 'stat' | 'quote' | 'shape';
  content: string;
  bullets?: string[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  font?: FontStyle;
  alignment?: DocumentAlignment;
  statNumber?: string;
  statLabel?: string;
  imageUrl?: string;
}

export interface CanonicalSlide {
  id: string;
  slideNumber: number;
  title: string;
  subtitle?: string;
  bullets: string[];
  theme: 'slate' | 'indigo' | 'emerald' | 'amber' | 'crimson' | 'cyber' | 'quartz' | 'midnight';
  layout: 'title' | 'content' | 'two_column' | 'stat' | 'quote' | 'blank';
  elements?: SlideElement[];
  speakerNotes?: string;
  statNumber?: string;
  statLabel?: string;
  quoteAuthor?: string;
  imageUrl?: string;
  backgroundColor?: string;
}

export interface CanonicalPresentation {
  title: string;
  aspectRatio: '16:9' | '4:3';
  slides: CanonicalSlide[];
  theme: string;
  metadata?: Record<string, any>;
}
