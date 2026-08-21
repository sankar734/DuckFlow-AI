import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IFolder extends MongooseDocument {
  name: string;
  ownerId: mongoose.Types.ObjectId;
  parentFolderId?: mongoose.Types.ObjectId;
  color?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FolderSchema = new Schema<IFolder>(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    parentFolderId: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
    color: { type: String, default: '#6366f1' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

FolderSchema.index({ ownerId: 1, parentFolderId: 1 });

export const Folder = mongoose.model<IFolder>('Folder', FolderSchema);
