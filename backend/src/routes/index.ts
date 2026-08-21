import { Router } from 'express';
import authRoutes from './authRoutes';
import documentRoutes from './documentRoutes';
import aiRoutes from './aiRoutes';
import {
  pdfRouter,
  conversionRouter,
  ocrRouter,
  billingRouter,
  adminRouter,
  platformRouter,
} from './otherRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/ai', aiRoutes);
router.use('/pdf', pdfRouter);
router.use('/conversions', conversionRouter);
router.use('/ocr', ocrRouter);
router.use('/billing', billingRouter);
router.use('/admin', adminRouter);
router.use('/', platformRouter);

export default router;
