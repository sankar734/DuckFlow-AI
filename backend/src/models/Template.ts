import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';
import { DocumentType } from './Document';

export interface ITemplate extends MongooseDocument {
  title: string;
  category: string; // 'Resume' | 'Business' | 'Education' | 'Reports' | 'Invoice' | 'Proposal' | 'Presentation' | 'Marketing' | 'Personal'
  type: DocumentType;
  description: string;
  thumbnailUrl: string;
  isPremium: boolean;
  usageCount: number;
  content: any;
  createdAt: Date;
}

const TemplateSchema = new Schema<ITemplate>(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true },
    type: { type: String, enum: Object.values(DocumentType), required: true, index: true },
    description: { type: String, required: true },
    thumbnailUrl: { type: String, default: '' },
    isPremium: { type: Boolean, default: false, index: true },
    usageCount: { type: Number, default: 0 },
    content: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

TemplateSchema.index({ category: 1, isPremium: 1 });

export const Template = mongoose.model<ITemplate>('Template', TemplateSchema);
