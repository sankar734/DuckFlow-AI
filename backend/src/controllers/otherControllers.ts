import { Response, NextFunction } from 'express';
import { pdfService } from '../services/pdfService';
import { conversionService } from '../services/conversionService';
import { ocrService } from '../services/ocrService';
import { billingService } from '../services/billingService';
import { adminService } from '../services/adminService';
import {
  templateService,
  sharingService,
  commentService,
  notificationService,
  teamService,
} from '../services/extraServices';
import {
  conversionJobSchema,
  createOrderSchema,
  verifyPaymentSchema,
  shareDocumentSchema,
} from '../schemas';
import { sendSuccess } from '../utils/responseFormatter';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class PDFController {
  async processTool(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { tool } = req.params;
      const { files, options } = req.body;
      const result = await pdfService.processPDFTool(req.user!._id.toString(), tool, files, options);
      sendSuccess(res, result, `Tool ${tool} executed`);
    } catch (error) {
      next(error);
    }
  }
}

export class ConversionController {
  async convert(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = conversionJobSchema.parse(req.body);
      const result = await conversionService.createConversionJob(req.user!._id.toString(), validated);
      sendSuccess(res, result, 'File conversion started', 201);
    } catch (error) {
      next(error);
    }
  }

  async getJobs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await conversionService.getUserJobs(req.user!._id.toString());
      sendSuccess(res, result, 'Conversion history');
    } catch (error) {
      next(error);
    }
  }
}

export class OCRController {
  async extractText(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const file = (req as any).file;
      const result = await ocrService.extractText(file ? file.path : 'sample_image');
      sendSuccess(res, result, 'OCR text extraction complete');
    } catch (error) {
      next(error);
    }
  }
}

export class BillingController {
  async getPlans(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const plans = await billingService.getPlans();
      sendSuccess(res, plans, 'Plans list');
    } catch (error) {
      next(error);
    }
  }

  async createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = createOrderSchema.parse(req.body);
      const result = await billingService.createOrder(req.user!._id.toString(), validated.planId, validated.billingCycle);
      sendSuccess(res, result, 'Order created');
    } catch (error) {
      next(error);
    }
  }

  async verifyPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = verifyPaymentSchema.parse(req.body);
      const result = await billingService.verifyPayment(req.user!._id.toString(), validated);
      sendSuccess(res, result, 'Payment verified and plan upgraded!');
    } catch (error) {
      next(error);
    }
  }

  async getInvoices(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const invoices = await billingService.getInvoices(req.user!._id.toString());
      sendSuccess(res, invoices, 'Invoices list');
    } catch (error) {
      next(error);
    }
  }
}

export class AdminController {
  async getMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getDashboardMetrics();
      sendSuccess(res, result, 'Admin dashboard metrics');
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const result = await adminService.getAllUsers(page, limit);
      sendSuccess(res, result.users, 'Users list', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async toggleUserBlock(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.toggleUserBlockStatus(req.params.id);
      sendSuccess(res, result, 'User status updated');
    } catch (error) {
      next(error);
    }
  }
}

export class MiscController {
  async getTemplates(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { category, search } = req.query;
      const templates = await templateService.getTemplates(category as string, search as string);
      sendSuccess(res, templates, 'Templates retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getTemplateById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const template = await templateService.getTemplateById(req.params.id);
      sendSuccess(res, template, 'Template details');
    } catch (error) {
      next(error);
    }
  }

  async shareDocument(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = shareDocumentSchema.parse(req.body);
      const result = await sharingService.shareDocument(req.params.id, validated as any);
      sendSuccess(res, result, 'Document shared');
    } catch (error) {
      next(error);
    }
  }

  async getShares(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await sharingService.getShares(req.params.id);
      sendSuccess(res, result, 'Document shares');
    } catch (error) {
      next(error);
    }
  }

  async getComments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await commentService.getComments(req.params.id);
      sendSuccess(res, result, 'Comments');
    } catch (error) {
      next(error);
    }
  }

  async addComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { content, position } = req.body;
      const result = await commentService.addComment(req.user!._id.toString(), req.params.id, content, position);
      sendSuccess(res, result, 'Comment added', 201);
    } catch (error) {
      next(error);
    }
  }

  async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.getUserNotifications(req.user!._id.toString());
      sendSuccess(res, result, 'Notifications');
    } catch (error) {
      next(error);
    }
  }

  async markNotificationRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.markAsRead(req.params.id);
      sendSuccess(res, result, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }
}

export const pdfController = new PDFController();
export const conversionController = new ConversionController();
export const ocrController = new OCRController();
export const billingController = new BillingController();
export const adminController = new AdminController();
export const miscController = new MiscController();
