import { Response, NextFunction } from 'express';
import { aiService } from '../services/aiService';
import {
  aiGenerateSchema,
  aiWriterSchema,
  aiPdfChatSchema,
  aiExcelAnalyzeSchema,
  aiPresentationSchema,
} from '../schemas';
import { sendSuccess } from '../utils/responseFormatter';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class AIController {
  async generateDocument(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = aiGenerateSchema.parse(req.body);
      const result = await aiService.generateDocument(req.user!._id.toString(), validated);
      sendSuccess(res, result, 'Document generated successfully');
    } catch (error) {
      next(error);
    }
  }

  async aiWriter(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = aiWriterSchema.parse(req.body);
      const result = await aiService.aiWriter(req.user!._id.toString(), validated);
      sendSuccess(res, result, 'AI text generated');
    } catch (error) {
      next(error);
    }
  }

  async summarize(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { text, length } = req.body;
      const result = await aiService.summarize(req.user!._id.toString(), { text, length });
      sendSuccess(res, result, 'Summary generated');
    } catch (error) {
      next(error);
    }
  }

  async chatWithPdf(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = aiPdfChatSchema.parse(req.body);
      const result = await aiService.chatWithPdf(req.user!._id.toString(), validated);
      sendSuccess(res, result, 'PDF QA response generated');
    } catch (error) {
      next(error);
    }
  }

  async analyzeExcel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = aiExcelAnalyzeSchema.parse(req.body);
      const result = await aiService.analyzeExcel(req.user!._id.toString(), validated);
      sendSuccess(res, result, 'Excel analysis complete');
    } catch (error) {
      next(error);
    }
  }

  async generatePresentation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = aiPresentationSchema.parse(req.body);
      const result = await aiService.generatePresentation(req.user!._id.toString(), validated);
      sendSuccess(res, result, 'Presentation outline generated');
    } catch (error) {
      next(error);
    }
  }

  async getCredits(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await aiService.getCreditUsage(req.user!._id.toString());
      sendSuccess(res, result, 'Credit details retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AIController();
