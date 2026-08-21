import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export enum NotificationType {
  DOCUMENT_SHARED = 'DOCUMENT_SHARED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  CONVERSION_COMPLETED = 'CONVERSION_COMPLETED',
  CONVERSION_FAILED = 'CONVERSION_FAILED',
  AI_COMPLETED = 'AI_COMPLETED',
  SUBSCRIPTION_UPDATED = 'SUBSCRIPTION_UPDATED',
  STORAGE_WARNING = 'STORAGE_WARNING',
  TEAM_INVITE = 'TEAM_INVITE',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
}

export interface INotification extends MongooseDocument {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  data?: Record<string, any>;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    linkUrl: { type: String },
    data: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
