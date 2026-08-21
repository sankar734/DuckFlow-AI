import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IDocumentVersion extends MongooseDocument {
  documentId: mongoose.Types.ObjectId;
  versionNumber: number;
  contentSnapshot: any;
  storageKey?: string;
  createdBy: mongoose.Types.ObjectId;
  changeSummary: string;
  createdAt: Date;
}

const DocumentVersionSchema = new Schema<IDocumentVersion>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    versionNumber: { type: Number, required: true },
    contentSnapshot: { type: Schema.Types.Mixed },
    storageKey: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changeSummary: { type: String, default: 'Updated document content' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

DocumentVersionSchema.index({ documentId: 1, versionNumber: -1 }, { unique: true });

export const DocumentVersion = mongoose.model<IDocumentVersion>('DocumentVersion', DocumentVersionSchema);
