import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
  email: string;
  otpHash: string;
  otp?: string;
  attempts: number;
  isVerified: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL auto-cleanup upon expiry
    },
  },
  {
    timestamps: true,
  }
);

export const Otp = mongoose.models.Otp || mongoose.model<IOtp>('Otp', OtpSchema);
