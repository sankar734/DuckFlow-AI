import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IPlan extends MongooseDocument {
  name: string; // 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE'
  slug: string; // 'free' | 'pro' | 'business' | 'enterprise'
  priceMonthly: number;
  priceYearly: number;
  storageLimit: number; // bytes
  aiCreditsMonthly: number;
  conversionLimitDaily: number;
  features: string[];
  isPopular?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    priceMonthly: { type: Number, required: true, default: 0 },
    priceYearly: { type: Number, required: true, default: 0 },
    storageLimit: { type: Number, required: true },
    aiCreditsMonthly: { type: Number, required: true },
    conversionLimitDaily: { type: Number, required: true },
    features: { type: [String], default: [] },
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Plan = mongoose.model<IPlan>('Plan', PlanSchema);
