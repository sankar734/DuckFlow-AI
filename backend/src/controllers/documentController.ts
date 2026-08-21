import { Response, NextFunction } from 'express';
import { documentService } from '../services/documentService';
import { createDocumentSchema, updateDocumentSchema } from '../schemas';
import { sendSuccess } from '../utils/responseFormatter';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class DocumentController {
  async getDocuments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { type, folderId, isFavorite, search, page, limit, sort } = req.query;
      const result = await documentService.getDocuments(req.user!._id.toString(), {
        type: type as string,
        folderId: folderId as string,
        isFavorite: isFavorite === 'true' ? true : isFavorite === 'false' ? false : undefined,
        search: search as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        sort: sort as string,
      });
      sendSuccess(res, result.documents, 'Documents fetched', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getRecent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 8;
      const result = await documentService.getRecentDocuments(req.user!._id.toString(), limit);
      sendSuccess(res, result, 'Recent documents');
    } catch (error) {
      next(error);
    }
  }

  async getTrash(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await documentService.getTrashDocuments(req.user!._id.toString());
      sendSuccess(res, result, 'Trash documents');
    } catch (error) {
      next(error);
    }
  }

  async getDocumentById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await documentService.getDocumentById(req.params.id, req.user!._id.toString());
      sendSuccess(res, result, 'Document retrieved');
    } catch (error) {
      next(error);
    }
  }

  async createDocument(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = createDocumentSchema.parse(req.body);
      const result = await documentService.createDocument(req.user!._id.toString(), validated as any);
      sendSuccess(res, result, 'Document created', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateDocument(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = updateDocumentSchema.parse(req.body);
      const result = await documentService.updateDocument(req.params.id, req.user!._id.toString(), validated);
      sendSuccess(res, result, 'Document updated');
    } catch (error) {
      next(error);
    }
  }

  async moveToTrash(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await documentService.moveToTrash(req.params.id, req.user!._id.toString());
      sendSuccess(res, { id: req.params.id }, 'Document moved to trash');
    } catch (error) {
      next(error);
    }
  }

  async restoreFromTrash(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await documentService.restoreFromTrash(req.params.id, req.user!._id.toString());
      sendSuccess(res, { id: req.params.id }, 'Document restored');
    } catch (error) {
      next(error);
    }
  }

  async permanentDelete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await documentService.permanentDelete(req.params.id, req.user!._id.toString());
      sendSuccess(res, { id: req.params.id }, 'Document permanently deleted');
    } catch (error) {
      next(error);
    }
  }

  async getVersions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await documentService.getVersions(req.params.id);
      sendSuccess(res, result, 'Document versions');
    } catch (error) {
      next(error);
    }
  }

  async restoreVersion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const versionNumber = parseInt(req.params.versionNumber, 10);
      const result = await documentService.restoreVersion(req.params.id, versionNumber, req.user!._id.toString());
      sendSuccess(res, result, 'Version restored');
    } catch (error) {
      next(error);
    }
  }

  // Folders
  async getFolders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await documentService.getFolders(req.user!._id.toString(), req.query.parentId as string);
      sendSuccess(res, result, 'Folders retrieved');
    } catch (error) {
      next(error);
    }
  }

  async createFolder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, parentFolderId, color } = req.body;
      const result = await documentService.createFolder(req.user!._id.toString(), name, parentFolderId, color);
      sendSuccess(res, result, 'Folder created', 201);
    } catch (error) {
      next(error);
    }
  }
}

export const documentController = new DocumentController();
