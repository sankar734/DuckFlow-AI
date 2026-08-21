import mongoose from 'mongoose';
import { getAIProvider } from '../integrations/ai';
import { User } from '../models/User';
import { AIUsage } from '../models/AIUsage';
import { AppError } from '../middleware/errorHandler';
import { ActivityLog } from '../models/ActivityLog';

export class AIService {
  private getProvider() {
    return getAIProvider();
  }

  private async deductCredits(userId: string, credits: number, operation: any, promptSnippet?: string, documentId?: string) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const available = user.aiCredits - user.aiCreditsUsed;
    if (available < credits) {
      throw new AppError(`Insufficient AI credits. Required: ${credits}, Remaining: ${available}`, 402, 'AI_CREDITS_EXHAUSTED');
    }

    user.aiCreditsUsed += credits;
    await user.save();

    await AIUsage.create({
      userId: new mongoose.Types.ObjectId(userId),
      operation,
      creditsUsed: credits,
      promptSnippet: promptSnippet?.slice(0, 200),
      documentId: documentId ? new mongoose.Types.ObjectId(documentId) : undefined,
      status: 'SUCCESS',
    });

    await ActivityLog.create({
      userId: new mongoose.Types.ObjectId(userId),
      action: 'AI_REQUEST',
      resourceType: 'AIUsage',
      metadata: { operation, creditsUsed: credits },
    });
  }

  async generateDocument(userId: string, data: {
    documentType: string;
    prompt: string;
    tone?: string;
    language?: string;
    length?: 'Short' | 'Medium' | 'Long';
    format?: string;
  }) {
    const creditsRequired = data.length === 'Long' ? 3 : 2;
    await this.deductCredits(userId, creditsRequired, 'DOCUMENT_WIZARD', data.prompt);

    const provider = this.getProvider();
    const generatedText = await provider.generateText({
      prompt: `Create a comprehensive ${data.documentType} in ${data.language || 'English'} with a ${data.tone || 'Professional'} tone.\nRequirements:\n${data.prompt}`,
      tone: data.tone,
    });

    return {
      title: `${data.documentType}: ${data.prompt.slice(0, 30)}...`,
      content: generatedText,
      documentType: data.documentType,
      creditsDeducted: creditsRequired,
    };
  }

  async aiWriter(userId: string, data: {
    action: string;
    content: string;
    targetLanguage?: string;
    instructions?: string;
  }) {
    await this.deductCredits(userId, 1, 'WRITER', data.content.slice(0, 60));
    const provider = this.getProvider();
    const result = await provider.rewriteText(data.content, data.action, 'Professional', data.targetLanguage);
    return { result, creditsDeducted: 1 };
  }

  async summarize(userId: string, data: { text: string; length?: 'short' | 'medium' | 'detailed' }) {
    await this.deductCredits(userId, 1, 'SUMMARIZE', data.text.slice(0, 60));
    const provider = this.getProvider();
    const summary = await provider.summarizeText(data.text, data.length || 'medium');
    return { summary, creditsDeducted: 1 };
  }

  async chatWithPdf(userId: string, data: { prompt: string; pdfContext?: string; documentId?: string }) {
    await this.deductCredits(userId, 1, 'PDF_CHAT', data.prompt, data.documentId);
    const provider = this.getProvider();
    const response = await provider.answerPdfQuestion(data.pdfContext || '', data.prompt);
    return { ...response, creditsDeducted: 1 };
  }

  async analyzeExcel(userId: string, data: { data?: any; prompt?: string; action?: string }) {
    await this.deductCredits(userId, 1, 'EXCEL_ANALYST', data.prompt);
    const provider = this.getProvider();
    const analysis = await provider.analyzeSpreadsheet(data.data, data.action || 'analyze', data.prompt);
    return { analysis, creditsDeducted: 1 };
  }

  async generatePresentation(userId: string, data: { topic: string; slideCount?: number; audience?: string; tone?: string }) {
    const creditsRequired = 3;
    await this.deductCredits(userId, creditsRequired, 'PRESENTATION_GEN', data.topic);
    const provider = this.getProvider();
    const presentation = await provider.generatePresentationOutline(
      data.topic,
      data.slideCount || 6,
      data.audience || 'General Business',
      data.tone || 'Professional'
    );
    return { presentation, creditsDeducted: creditsRequired };
  }

  async getCreditUsage(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const history = await AIUsage.find({ userId }).sort({ createdAt: -1 }).limit(15);
    return {
      totalCredits: user.aiCredits,
      usedCredits: user.aiCreditsUsed,
      availableCredits: Math.max(0, user.aiCredits - user.aiCreditsUsed),
      planId: user.planId,
      history,
    };
  }
}

export const aiService = new AIService();
