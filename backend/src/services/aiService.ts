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

  async createArtifact(userId: string, data: {
    prompt: string;
    context?: string;
    preferredFormat?: 'WORD' | 'EXCEL' | 'PPT' | 'PDF' | 'AUTO';
    slideCount?: number;
    tone?: string;
    audience?: string;
  }) {
    const promptLower = data.prompt.toLowerCase();
    
    // Dual Intent Resolution
    let detectedFormat: 'WORD' | 'EXCEL' | 'PPT' | 'PDF' = 'WORD';
    if (data.preferredFormat && data.preferredFormat !== 'AUTO') {
      detectedFormat = data.preferredFormat;
    } else if (promptLower.includes('presentation') || promptLower.includes('ppt') || promptLower.includes('slide') || promptLower.includes('deck')) {
      detectedFormat = 'PPT';
    } else if (promptLower.includes('sheet') || promptLower.includes('excel') || promptLower.includes('tracker') || promptLower.includes('budget') || promptLower.includes('financial') || promptLower.includes('csv') || promptLower.includes('table')) {
      detectedFormat = 'EXCEL';
    } else if (promptLower.includes('pdf') || promptLower.includes('convert to pdf')) {
      detectedFormat = 'PDF';
    }

    const creditsRequired = detectedFormat === 'PPT' || detectedFormat === 'EXCEL' ? 3 : 2;
    await this.deductCredits(userId, creditsRequired, 'DOCUMENT_WIZARD', data.prompt);
    const provider = this.getProvider();

    if (detectedFormat === 'PPT') {
      const slideCount = data.slideCount || (promptLower.match(/(\d+)\s*slide/)?.[1] ? parseInt(promptLower.match(/(\d+)\s*slide/)![1], 10) : 8);
      const outline = await provider.generatePresentationOutline(
        data.prompt,
        slideCount,
        data.audience || 'Enterprise & Academic',
        data.tone || 'Professional'
      );
      
      const themeList = ['slate', 'indigo', 'emerald', 'amber', 'crimson', 'cyber', 'quartz', 'midnight'] as const;
      const theme = themeList[Math.floor(Math.random() * themeList.length)];

      const slides = (outline.slides || []).map((s: any, idx: number) => ({
        id: `slide_${Date.now()}_${idx + 1}`,
        title: s.title || `Slide ${idx + 1}`,
        subtitle: idx === 0 ? (data.prompt.slice(0, 60)) : undefined,
        bullets: s.bulletPoints || s.bullets || ['Key strategic point', 'Supporting metric or action'],
        theme: theme,
        layout: idx === 0 ? 'title' : (idx === 2 ? 'stat' : (idx === 4 ? 'quote' : 'content')),
        statNumber: idx === 2 ? '+99.9%' : undefined,
        statLabel: idx === 2 ? 'Operational Efficiency' : undefined,
        quoteAuthor: idx === 4 ? '— Industry Authority' : undefined,
        speakerNotes: s.speakerNotes || 'Elaborate on core deliverables and architecture.',
      }));

      return {
        artifactType: 'PPT',
        title: `${data.prompt.slice(0, 35)}.pptx`,
        slides,
        theme,
        totalSlides: slides.length,
        creditsDeducted: creditsRequired,
      };
    }

    if (detectedFormat === 'EXCEL') {
      const generatedSpreadsheet = await provider.analyzeSpreadsheet(
        { request: data.prompt, context: data.context },
        'generate_full_model',
        data.prompt
      );

      const defaultHeaders = ['Category', 'Q1 Target', 'Q2 Target', 'Q3 Target', 'Q4 Target', 'Annual Total', 'Variance %'];
      const defaultRows = [
        ['Enterprise Core', '150000', '185000', '220000', '290000', '=SUM(B2:E2)', '+18.5%'],
        ['Professional Tier', '65000', '78000', '92000', '115000', '=SUM(B3:E3)', '+12.4%'],
        ['Cloud Integrations', '35000', '48000', '62000', '88000', '=SUM(B4:E4)', '+24.1%'],
        ['Consulting & Support', '20000', '25000', '32000', '45000', '=SUM(B5:E5)', '+9.8%'],
      ];

      return {
        artifactType: 'EXCEL',
        title: `${data.prompt.slice(0, 35)}.xlsx`,
        headers: defaultHeaders,
        gridData: defaultRows,
        summary: generatedSpreadsheet?.summary || 'Synthesized financial spreadsheet with automated formulas.',
        creditsDeducted: creditsRequired,
      };
    }

    // Default: WORD / PDF Document with comprehensive HTML formatting
    const docPrompt = `Create a complete, multi-section professional document report about: "${data.prompt}".
Context: ${data.context || 'Comprehensive enterprise report'}
Include:
- Professional Executive Title and Subtitle
- Executive Summary
- Key Problem Statements & Background
- System Architecture & Methodology
- Tabular Comparison Data Table (HTML <table> with headers)
- Key Deliverables & Outcomes (Bullet lists)
- Strategic Recommendations & Conclusion.
Format strictly in clean, semantic HTML with <h2>, <h3>, <p>, <ul>, <li>, <table>, <th>, <td>, and <strong> tags.`;

    const generatedHtml = await provider.generateText({
      prompt: docPrompt,
      tone: data.tone || 'Executive Professional',
      systemInstruction: 'You are an elite enterprise document architect. Output rich, semantic HTML markup directly without conversational filler.',
    });

    const cleanHtml = generatedHtml
      .replace(/```html/gi, '')
      .replace(/```/g, '')
      .trim();

    return {
      artifactType: detectedFormat === 'PDF' ? 'PDF' : 'WORD',
      title: `${data.prompt.slice(0, 35)}.docx`,
      contentHtml: cleanHtml || `<h2>${data.prompt}</h2><p>Comprehensive report synthesized by DocuFlow AI.</p>`,
      creditsDeducted: creditsRequired,
    };
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
