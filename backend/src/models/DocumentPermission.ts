import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export enum PermissionRole {
  VIEWER = 'VIEWER',
  COMMENTER = 'COMMENTER',
  EDITOR = 'EDITOR',
  OWNER = 'OWNER',
}

export interface IDocumentPermission extends MongooseDocument {
  documentId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  userEmail?: string;
  role: PermissionRole;
  shareToken?: string;
  isPublicLink: boolean;
  expiresAt?: Date;
  passwordHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentPermissionSchema = new Schema<IDocumentPermission>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    userEmail: { type: String, lowercase: true, trim: true },
    role: { type: String, enum: Object.values(PermissionRole), default: PermissionRole.VIEWER },
    shareToken: { type: String, unique: true, sparse: true },
    isPublicLink: { type: Boolean, default: false },
    expiresAt: { type: Date },
    passwordHash: { type: String },
  },
  { timestamps: true }
);

DocumentPermissionSchema.index({ documentId: 1, userId: 1 });

export const DocumentPermission = mongoose.model<IDocumentPermission>('DocumentPermission', DocumentPermissionSchema);
