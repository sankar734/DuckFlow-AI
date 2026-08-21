import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IInvoice extends MongooseDocument {
  invoiceNumber: string;
  userId: mongoose.Types.ObjectId;
  paymentId?: mongoose.Types.ObjectId;
  planName: string;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  status: 'PAID' | 'DUE' | 'VOID';
  billingDetails: {
    name: string;
    email: string;
    company?: string;
    address?: string;
    gstin?: string;
  };
  downloadUrl?: string;
  createdAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    planName: { type: String, required: true },
    amount: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['PAID', 'DUE', 'VOID'], default: 'PAID' },
    billingDetails: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      company: { type: String },
      address: { type: String },
      gstin: { type: String },
    },
    downloadUrl: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

InvoiceSchema.index({ userId: 1, createdAt: -1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
