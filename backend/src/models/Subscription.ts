import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIALING = 'TRIALING',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface ISubscription extends MongooseDocument {
  userId: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  planId: string; // 'free' | 'pro' | 'business' | 'enterprise'
  provider: 'razorpay' | 'stripe' | 'manual';
  providerSubscriptionId?: string;
  status: SubscriptionStatus;
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
    planId: { type: String, required: true, default: 'free' },
    provider: { type: String, enum: ['razorpay', 'stripe', 'manual'], default: 'razorpay' },
    providerSubscriptionId: { type: String },
    status: { type: String, enum: Object.values(SubscriptionStatus), default: SubscriptionStatus.ACTIVE, index: true },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ userId: 1, status: 1 });

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
