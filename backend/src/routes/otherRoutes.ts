import { Router } from 'express';
import {
  pdfController,
  conversionController,
  ocrController,
  billingController,
  adminController,
  miscController,
} from '../controllers/otherControllers';
import { authenticate } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/roleMiddleware';
import { upload } from '../middleware/uploadMiddleware';

// PDF Router
export const pdfRouter = Router();
pdfRouter.use(authenticate);
pdfRouter.post('/:tool', (req, res, next) => pdfController.processTool(req, res, next));

// Conversion Router
export const conversionRouter = Router();
conversionRouter.use(authenticate);
conversionRouter.get('/health', (req, res, next) => conversionController.getHealth(req as any, res, next));
conversionRouter.get('/:jobId', (req, res, next) => conversionController.getJobById(req as any, res, next));
conversionRouter.post('/', (req, res, next) => conversionController.convert(req, res, next));
conversionRouter.get('/', (req, res, next) => conversionController.getJobs(req, res, next));

// System Health Router
export const systemRouter = Router();
systemRouter.get('/converter-health', (req, res, next) => conversionController.getHealth(req as any, res, next));

// OCR Router
export const ocrRouter = Router();
ocrRouter.use(authenticate);
ocrRouter.post('/extract', upload.single('image'), (req, res, next) => ocrController.extractText(req, res, next));

// Billing Router
export const billingRouter = Router();
billingRouter.get('/plans', (req, res, next) => billingController.getPlans(req as any, res, next));
billingRouter.post('/create-order', authenticate, (req, res, next) => billingController.createOrder(req as any, res, next));
billingRouter.post('/verify-payment', authenticate, (req, res, next) => billingController.verifyPayment(req as any, res, next));
billingRouter.get('/invoices', authenticate, (req, res, next) => billingController.getInvoices(req as any, res, next));

// Admin Router
export const adminRouter = Router();
adminRouter.use(authenticate);
adminRouter.use(requireAdmin);
adminRouter.get('/dashboard', (req, res, next) => adminController.getMetrics(req as any, res, next));
adminRouter.get('/users', (req, res, next) => adminController.getUsers(req as any, res, next));
adminRouter.patch('/users/:id/toggle-block', (req, res, next) => adminController.toggleUserBlock(req as any, res, next));

// Misc / Platform Router (Templates, Sharing, Comments, Notifications)
export const platformRouter = Router();
platformRouter.get('/templates', authenticate, (req, res, next) => miscController.getTemplates(req as any, res, next));
platformRouter.get('/templates/:id', authenticate, (req, res, next) => miscController.getTemplateById(req as any, res, next));
platformRouter.post('/documents/:id/share', authenticate, (req, res, next) => miscController.shareDocument(req as any, res, next));
platformRouter.get('/documents/:id/shares', authenticate, (req, res, next) => miscController.getShares(req as any, res, next));
platformRouter.get('/documents/:id/comments', authenticate, (req, res, next) => miscController.getComments(req as any, res, next));
platformRouter.post('/documents/:id/comments', authenticate, (req, res, next) => miscController.addComment(req as any, res, next));
platformRouter.get('/notifications', authenticate, (req, res, next) => miscController.getNotifications(req as any, res, next));
platformRouter.patch('/notifications/:id/read', authenticate, (req, res, next) => miscController.markNotificationRead(req as any, res, next));
