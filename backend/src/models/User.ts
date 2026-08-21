import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface IUser extends MongooseDocument {
  name: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  profileImage?: string;
  bio?: string;
  role: UserRole;
  authProviders: string[];
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  isBlocked: boolean;
  planId: string;
  storageUsed: number; // in bytes
  storageLimit: number; // in bytes (e.g. 5GB = 5 * 1024 * 1024 * 1024)
  aiCredits: number;
  aiCreditsUsed: number;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    documentNotifications: boolean;
    aiNotifications: boolean;
  };
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String },
    profileImage: { type: String, default: '' },
    bio: { type: String, default: '' },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER, index: true },
    authProviders: { type: [String], default: ['local'] },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
    planId: { type: String, default: 'free' },
    storageUsed: { type: Number, default: 0 },
    storageLimit: { type: Number, default: 5 * 1024 * 1024 * 1024 }, // 5GB default
    aiCredits: { type: Number, default: 50 },
    aiCreditsUsed: { type: Number, default: 0 },
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'UTC' },
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      documentNotifications: { type: Boolean, default: true },
      aiNotifications: { type: Boolean, default: true },
    },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ email: 1, role: 1 });
UserSchema.index({ createdAt: -1 });

export const User = mongoose.model<IUser>('User', UserSchema);
