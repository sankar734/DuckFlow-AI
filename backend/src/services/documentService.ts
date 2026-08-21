import mongoose from 'mongoose';
import { DocumentModel, IDocument, DocumentType } from '../models/Document';
import { DocumentVersion } from '../models/DocumentVersion';
import { Folder } from '../models/Folder';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { ActivityLog } from '../models/ActivityLog';

export class DocumentService {
  async getDocuments(userId: string, options: {
    type?: string;
    folderId?: string;
    isFavorite?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const query: any = {
      ownerId: new mongoose.Types.ObjectId(userId),
      isDeleted: false,
    };

    if (options.type) query.type = options.type;
    if (options.folderId !== undefined) {
      query.folderId = options.folderId === 'root' || !options.folderId ? null : new mongoose.Types.ObjectId(options.folderId);
    }
    if (options.isFavorite !== undefined) query.isFavorite = options.isFavorite;
    if (options.search) {
      query.name = { $regex: options.search, $options: 'i' };
    }

    const sortOption: any = { updatedAt: -1 };
    if (options.sort === 'name') sortOption.name = 1;
    if (options.sort === 'size') sortOption.size = -1;

    const [documents, total] = await Promise.all([
      DocumentModel.find(query).sort(sortOption).skip(skip).limit(limit),
      DocumentModel.countDocuments(query),
    ]);

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRecentDocuments(userId: string, limit: number = 10) {
    return DocumentModel.find({
      ownerId: new mongoose.Types.ObjectId(userId),
      isDeleted: false,
    })
      .sort({ lastViewedAt: -1, updatedAt: -1 })
      .limit(limit);
  }

  async getTrashDocuments(userId: string) {
    return DocumentModel.find({
      ownerId: new mongoose.Types.ObjectId(userId),
      isDeleted: true,
    }).sort({ deletedAt: -1 });
  }

  async getDocumentById(documentId: string, userId: string): Promise<IDocument> {
    const doc = await DocumentModel.findById(documentId);
    if (!doc) {
      throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    }

    doc.lastViewedAt = new Date();
    await doc.save();
    return doc;
  }

  async createDocument(userId: string, data: {
    name: string;
    type: DocumentType;
    folderId?: string;
    content?: any;
    size?: number;
    metadata?: any;
  }): Promise<IDocument> {
    const defaultContent = data.content || this.getDefaultContentForType(data.type, data.name);

    const doc = await DocumentModel.create({
      ownerId: new mongoose.Types.ObjectId(userId),
      folderId: data.folderId ? new mongoose.Types.ObjectId(data.folderId) : undefined,
      name: data.name,
      type: data.type,
      size: data.size || 1024,
      content: defaultContent,
      metadata: data.metadata || {},
      currentVersionNumber: 1,
    });

    // Create initial version snapshot
    await DocumentVersion.create({
      documentId: doc._id,
      versionNumber: 1,
      contentSnapshot: defaultContent,
      createdBy: new mongoose.Types.ObjectId(userId),
      changeSummary: 'Initial document creation',
    });

    // Update user storage
    await User.findByIdAndUpdate(userId, {
      $inc: { storageUsed: doc.size },
    });

    await ActivityLog.create({
      userId: new mongoose.Types.ObjectId(userId),
      action: 'DOCUMENT_CREATED',
      resourceType: 'Document',
      resourceId: doc._id.toString(),
      metadata: { name: doc.name, type: doc.type },
    });

    return doc;
  }

  async updateDocument(documentId: string, userId: string, updateData: {
    name?: string;
    content?: any;
    folderId?: string | null;
    isFavorite?: boolean;
    metadata?: any;
    changeSummary?: string;
  }): Promise<IDocument> {
    const doc = await DocumentModel.findOne({
      _id: documentId,
      ownerId: new mongoose.Types.ObjectId(userId),
    });

    if (!doc) {
      throw new AppError('Document not found or permission denied', 404, 'DOCUMENT_NOT_FOUND');
    }

    if (updateData.name) doc.name = updateData.name;
    if (updateData.isFavorite !== undefined) doc.isFavorite = updateData.isFavorite;
    if (updateData.folderId !== undefined) {
      doc.folderId = updateData.folderId ? new mongoose.Types.ObjectId(updateData.folderId) : undefined;
    }
    if (updateData.metadata) {
      doc.metadata = { ...doc.metadata, ...updateData.metadata };
    }

    if (updateData.content) {
      doc.content = updateData.content;
      doc.currentVersionNumber += 1;

      // Save version
      await DocumentVersion.create({
        documentId: doc._id,
        versionNumber: doc.currentVersionNumber,
        contentSnapshot: updateData.content,
        createdBy: new mongoose.Types.ObjectId(userId),
        changeSummary: updateData.changeSummary || `Version ${doc.currentVersionNumber}`,
      });
    }

    await doc.save();
    return doc;
  }

  async moveToTrash(documentId: string, userId: string): Promise<boolean> {
    const doc = await DocumentModel.findOne({
      _id: documentId,
      ownerId: new mongoose.Types.ObjectId(userId),
    });
    if (!doc) throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');

    doc.isDeleted = true;
    doc.deletedAt = new Date();
    await doc.save();
    return true;
  }

  async restoreFromTrash(documentId: string, userId: string): Promise<boolean> {
    const doc = await DocumentModel.findOne({
      _id: documentId,
      ownerId: new mongoose.Types.ObjectId(userId),
    });
    if (!doc) throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');

    doc.isDeleted = false;
    doc.deletedAt = undefined;
    await doc.save();
    return true;
  }

  async permanentDelete(documentId: string, userId: string): Promise<boolean> {
    const doc = await DocumentModel.findOne({
      _id: documentId,
      ownerId: new mongoose.Types.ObjectId(userId),
    });
    if (!doc) throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');

    await Promise.all([
      DocumentModel.deleteOne({ _id: documentId }),
      DocumentVersion.deleteMany({ documentId }),
      User.findByIdAndUpdate(userId, {
        $inc: { storageUsed: -Math.abs(doc.size || 0) },
      }),
    ]);
    return true;
  }

  async getVersions(documentId: string) {
    return DocumentVersion.find({ documentId }).sort({ versionNumber: -1 });
  }

  async restoreVersion(documentId: string, versionNumber: number, userId: string) {
    const version = await DocumentVersion.findOne({ documentId, versionNumber });
    if (!version) throw new AppError('Version not found', 404, 'VERSION_NOT_FOUND');

    return this.updateDocument(documentId, userId, {
      content: version.contentSnapshot,
      changeSummary: `Restored to version ${versionNumber}`,
    });
  }

  // Folder operations
  async getFolders(userId: string, parentFolderId?: string) {
    const query: any = {
      ownerId: new mongoose.Types.ObjectId(userId),
      isDeleted: false,
    };
    query.parentFolderId = parentFolderId ? new mongoose.Types.ObjectId(parentFolderId) : null;
    return Folder.find(query).sort({ name: 1 });
  }

  async createFolder(userId: string, name: string, parentFolderId?: string, color?: string) {
    return Folder.create({
      name,
      ownerId: new mongoose.Types.ObjectId(userId),
      parentFolderId: parentFolderId ? new mongoose.Types.ObjectId(parentFolderId) : null,
      color: color || '#6366f1',
    });
  }

  private getDefaultContentForType(type: DocumentType, name: string): any {
    switch (type) {
      case DocumentType.WORD:
        return {
          title: name,
          body: `<h2>Welcome to your new document</h2><p>Start writing here or use <strong>AI Assistant</strong> on the right to draft, rewrite, and summarize content instantly.</p>`,
        };
      case DocumentType.EXCEL:
      case DocumentType.CSV:
        return {
          sheets: [
            {
              id: 'sheet_1',
              name: 'Sheet 1',
              grid: [
                ['Item', 'Category', 'Quarter 1', 'Quarter 2', 'Total'],
                ['AI Engine Subscription', 'Software', 1200, 1450, '=SUM(C2:D2)'],
                ['Cloud Workspace Storage', 'Infrastructure', 450, 480, '=SUM(C3:D3)'],
                ['Document Processing API', 'Operations', 800, 950, '=SUM(C4:D4)'],
                ['Total Operational Cost', 'Summary', '=SUM(C2:C4)', '=SUM(D2:D4)', '=SUM(E2:E4)'],
              ],
            },
          ],
        };
      case DocumentType.PPT:
        return {
          theme: 'Modern Slate',
          slides: [
            {
              id: 's1',
              layout: 'title',
              title: name,
              subtitle: 'Powered by DocuFlow AI Presentation Builder',
              notes: 'Introduce the core presentation topic and mission.',
            },
            {
              id: 's2',
              layout: 'bullets',
              title: 'Key Objectives & Milestones',
              bullets: [
                'Accelerate document lifecycle automation',
                'Deliver 10x faster presentation drafting',
                'Empower teams with unified collaboration',
              ],
              notes: 'Walk through the 3 core objectives.',
            },
          ],
        };
      default:
        return { text: `New ${type} document created with DocuFlow AI.` };
    }
  }
}

export const documentService = new DocumentService();
