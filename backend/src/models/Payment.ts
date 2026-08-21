import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IPayment extends MongooseDocument {
  userId: mongoose.Types.ObjectId;
  subscriptionId?: mongoose.Types.ObjectId;
  provider: 'razorpay' | 'stripe' | 'manual';
  providerOrderId: string;
  providerPaymentId?: string;
  providerSignature?: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  planId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription' },
    provider: { type: String, enum: ['razorpay', 'stripe', 'manual'], default: 'razorpay' },
    providerOrderId: { type: String, required: true, index: true },
    providerPaymentId: { type: String, index: true },
    providerSignature: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'], default: 'PENDING', index: true },
    planId: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

PaymentSchema.index({ userId: 1, createdAt: -1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
