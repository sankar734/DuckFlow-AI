export type DocumentType = 'WORD' | 'EXCEL' | 'PPT' | 'PDF' | 'TEXT' | 'IMAGE' | 'CSV';

export interface DocumentMetadata {
  pageCount?: number;
  wordCount?: number;
  sheetCount?: number;
  slideCount?: number;
  language?: string;
  ocrProcessed?: boolean;
  tags?: string[];
  [key: string]: any;
}

export interface DocumentItem {
  _id: string;
  ownerId: string;
  folderId?: string;
  name: string;
  type: DocumentType;
  mimeType: string;
  size: number;
  storageKey?: string;
  thumbnailUrl?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'TRASHED';
  content?: any;
  metadata: DocumentMetadata;
  currentVersionNumber: number;
  isFavorite: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  lastViewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  _id: string;
  documentId: string;
  versionNumber: number;
  contentSnapshot: any;
  createdBy: { _id: string; name: string };
  changeSummary: string;
  createdAt: string;
}

export interface FolderItem {
  _id: string;
  name: string;
  ownerId: string;
  parentFolderId?: string;
  color: string;
  createdAt: string;
}
