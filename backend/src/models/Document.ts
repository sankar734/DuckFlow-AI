import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export enum DocumentType {
  WORD = 'WORD',
  EXCEL = 'EXCEL',
  PPT = 'PPT',
  PDF = 'PDF',
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  CSV = 'CSV',
}

export interface IDocument extends MongooseDocument {
  ownerId: mongoose.Types.ObjectId;
  folderId?: mongoose.Types.ObjectId;
  name: string;
  type: DocumentType;
  mimeType: string;
  size: number; // bytes
  storageKey?: string;
  thumbnailUrl?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'TRASHED';
  content?: any; // Structured JSON for Word/Excel/PPT
  metadata: {
    pageCount?: number;
    wordCount?: number;
    sheetCount?: number;
    slideCount?: number;
    language?: string;
    ocrProcessed?: boolean;
    tags?: string[];
    [key: string]: any;
  };
  currentVersionNumber: number;
  isFavorite: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  lastViewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    folderId: { type: Schema.Types.ObjectId, ref: 'Folder', index: true },
    name: { type: String, required: true, trim: true, index: true },
    type: { type: String, enum: Object.values(DocumentType), required: true, index: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
    storageKey: { type: String },
    thumbnailUrl: { type: String, default: '' },
    status: { type: String, enum: ['ACTIVE', 'ARCHIVED', 'TRASHED'], default: 'ACTIVE' },
    content: { type: Schema.Types.Mixed },
    metadata: {
      pageCount: { type: Number, default: 1 },
      wordCount: { type: Number, default: 0 },
      sheetCount: { type: Number, default: 1 },
      slideCount: { type: Number, default: 1 },
      language: { type: String, default: 'en' },
      ocrProcessed: { type: Boolean, default: false },
      tags: { type: [String], default: [] },
    },
    currentVersionNumber: { type: Number, default: 1 },
    isFavorite: { type: Boolean, default: false, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    lastViewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

DocumentSchema.index({ ownerId: 1, isDeleted: 1, type: 1 });
DocumentSchema.index({ name: 'text', 'metadata.tags': 'text' });

export const DocumentModel = mongoose.model<IDocument>('Document', DocumentSchema);
