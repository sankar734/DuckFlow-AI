import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export enum ConversionStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface IConversionJob extends MongooseDocument {
  userId: mongoose.Types.ObjectId;
  sourceDocumentId?: mongoose.Types.ObjectId;
  sourceFileName: string;
  sourceFormat: string;
  targetFormat: string;
  fileSize: number;
  status: ConversionStatus;
  progress: number; // 0 to 100
  downloadUrl?: string;
  storageKey?: string;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

const ConversionJobSchema = new Schema<IConversionJob>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sourceDocumentId: { type: Schema.Types.ObjectId, ref: 'Document' },
    sourceFileName: { type: String, required: true },
    sourceFormat: { type: String, required: true },
    targetFormat: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    status: { type: String, enum: Object.values(ConversionStatus), default: ConversionStatus.QUEUED, index: true },
    progress: { type: Number, default: 0 },
    downloadUrl: { type: String },
    storageKey: { type: String },
    errorMessage: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

ConversionJobSchema.index({ userId: 1, createdAt: -1 });

export const ConversionJob = mongoose.model<IConversionJob>('ConversionJob', ConversionJobSchema);
