import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IComment extends MongooseDocument {
  documentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  position?: {
    page?: number;
    highlightId?: string;
    cellCoordinate?: string;
    slideId?: string;
  };
  parentCommentId?: mongoose.Types.ObjectId;
  resolved: boolean;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
    position: {
      page: Number,
      highlightId: String,
      cellCoordinate: String,
      slideId: String,
    },
    parentCommentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    resolved: { type: Boolean, default: false, index: true },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

CommentSchema.index({ documentId: 1, resolved: 1, createdAt: 1 });

export const Comment = mongoose.model<IComment>('Comment', CommentSchema);
