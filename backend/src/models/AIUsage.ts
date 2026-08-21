import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IAIUsage extends MongooseDocument {
  userId: mongoose.Types.ObjectId;
  operation: 'WRITER' | 'REWRITE' | 'SUMMARIZE' | 'TRANSLATE' | 'PDF_CHAT' | 'EXCEL_ANALYST' | 'PRESENTATION_GEN' | 'DOCUMENT_WIZARD' | 'OCR';
  creditsUsed: number;
  promptSnippet?: string;
  documentId?: mongoose.Types.ObjectId;
  status: 'SUCCESS' | 'FAILED' | 'REFUNDED';
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AIUsageSchema = new Schema<IAIUsage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    operation: { type: String, required: true, index: true },
    creditsUsed: { type: Number, required: true },
    promptSnippet: { type: String },
    documentId: { type: Schema.Types.ObjectId, ref: 'Document' },
    status: { type: String, enum: ['SUCCESS', 'FAILED', 'REFUNDED'], default: 'SUCCESS' },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AIUsageSchema.index({ userId: 1, createdAt: -1 });

export const AIUsage = mongoose.model<IAIUsage>('AIUsage', AIUsageSchema);
