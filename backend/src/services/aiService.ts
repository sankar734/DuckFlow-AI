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

  /**
   * Evaluates if a daily cycle (24 hours or new calendar day) has elapsed since last refill.
   * If yes, automatically resets daily credit usage or restores full daily capacity.
   */
  async checkAndApplyDailyRefill(user: any): Promise<{
    refilled: boolean;
    nextRefillAt: Date;
    refillSecondsRemaining: number;
    dailyAllocation: number;
  }> {
    const now = new Date();
    const lastRefill = user.lastCreditRefillAt ? new Date(user.lastCreditRefillAt) : new Date(user.createdAt || now);
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    const elapsedMs = now.getTime() - lastRefill.getTime();
    const isNewCalendarDay =
      now.getUTCDate() !== lastRefill.getUTCDate() ||
      now.getUTCMonth() !== lastRefill.getUTCMonth() ||
      now.getUTCFullYear() !== lastRefill.getUTCFullYear();

    let refilled = false;
    const dailyAllocation =
      user.dailyCreditsAllocation ||
      (user.planId === 'pro' ? 250 : user.planId === 'business' ? 1000 : 50);

    if (elapsedMs >= ONE_DAY_MS || (elapsedMs > 60 * 1000 && isNewCalendarDay)) {
      user.aiCredits = Math.max(user.aiCredits || 0, dailyAllocation);
      user.aiCreditsUsed = 0; // Reset usage for new day
      user.lastCreditRefillAt = now;
      user.dailyCreditsAllocation = dailyAllocation;
      await user.save();
      refilled = true;

      try {
        await ActivityLog.create({
          userId: user._id,
          action: 'AI_DAILY_REFILL',
          resourceType: 'AIUsage',
          metadata: { dailyAllocation, message: 'Daily AI credits replenished' },
        });
      } catch {
        // non-blocking
      }
    }

    const currentRefill = user.lastCreditRefillAt ? new Date(user.lastCreditRefillAt) : now;
    const nextRefillAt = new Date(currentRefill.getTime() + ONE_DAY_MS);
    const refillSecondsRemaining = Math.max(0, Math.floor((nextRefillAt.getTime() - now.getTime()) / 1000));

    return { refilled, nextRefillAt, refillSecondsRemaining, dailyAllocation };
  }

  /**
   * Calculates dynamic credits based on:
   * 1. Base operation cost
   * 2. Prompt length (characters / words / deep instructions)
   * 3. Requested scope (Short, Medium, Long, Comprehensive / slide count / format)
   * 4. Context length if document QA
   */
  calculateDynamicCredits(
    operation:
      | 'DOCUMENT_WIZARD'
      | 'WRITER'
      | 'SUMMARIZE'
      | 'PDF_CHAT'
      | 'EXCEL_ANALYST'
      | 'PRESENTATION_GEN'
      | 'ARTIFACT_GEN',
    prompt: string = '',
    options?: {
      length?: 'Short' | 'Medium' | 'Long' | 'Comprehensive' | string;
      slideCount?: number;
      contextLength?: number;
      format?: string;
    }
  ): { credits: number; breakdown: string; promptTokensEst: number } {
    const text = (prompt || '').trim();
    const charCount = text.length;
    const wordCount = text ? text.split(/\s+/).length : 0;
    const promptTokensEst = Math.ceil(charCount / 4);

    let baseCredits = 1;
    let lengthBonus = 0;
    let promptComplexityBonus = 0;

    // 1. Prompt Complexity Bonus (Calculated dynamically by character/word depth)
    if (charCount > 2000 || wordCount > 400) {
      promptComplexityBonus = 18; // Very deep prompt / full spec
    } else if (charCount > 1000 || wordCount > 200) {
      promptComplexityBonus = 10; // Large prompt
    } else if (charCount > 400 || wordCount > 80) {
      promptComplexityBonus = 5; // Medium-large prompt
    } else if (charCount > 150 || wordCount > 30) {
      promptComplexityBonus = 2; // Moderate prompt
    }

    // 2. Operation and Scope Bonuses
    switch (operation) {
      case 'DOCUMENT_WIZARD':
      case 'ARTIFACT_GEN': {
        baseCredits = 2;
        const requestedLength = (options?.length || 'Medium').toLowerCase();
        if (
          requestedLength.includes('comprehens') ||
          requestedLength.includes('full') ||
          requestedLength.includes('enterprise')
        ) {
          lengthBonus = 25; // 35 - 50 credits total
        } else if (requestedLength.includes('long') || requestedLength.includes('detailed')) {
          lengthBonus = 12; // 15 - 25 credits total
        } else if (requestedLength.includes('medium')) {
          lengthBonus = 5; // 7 - 12 credits total
        } else {
          lengthBonus = 1; // Short: 3 - 5 credits
        }
        break;
      }
      case 'PRESENTATION_GEN': {
        baseCredits = 3;
        const slides = options?.slideCount || 6;
        if (slides >= 15) {
          lengthBonus = 22; // Massive deck: 28 - 45 credits
        } else if (slides >= 10) {
          lengthBonus = 12; // Large deck: 18 - 25 credits
        } else if (slides >= 6) {
          lengthBonus = 5; // Standard deck: 8 - 14 credits
        }
        break;
      }
      case 'EXCEL_ANALYST': {
        baseCredits = 2;
        if (charCount > 500 || (options?.contextLength && options.contextLength > 1000)) {
          lengthBonus = 8;
        } else {
          lengthBonus = 3;
        }
        break;
      }
      case 'PDF_CHAT': {
        baseCredits = 1;
        if (options?.contextLength && options.contextLength > 5000) {
          lengthBonus = 4;
        } else if (charCount > 300) {
          lengthBonus = 2;
        }
        break;
      }
      case 'WRITER':
      case 'SUMMARIZE':
      default: {
        baseCredits = 1;
        if (charCount > 1000) {
          lengthBonus = 6;
        } else if (charCount > 300) {
          lengthBonus = 2;
        }
        break;
      }
    }

    const calculated = Math.round(baseCredits + promptComplexityBonus + lengthBonus);
    // Cap between 1 and 50 credits per request
    const credits = Math.min(50, Math.max(1, calculated));

    return {
      credits,
      breakdown: `Base (${baseCredits}) + Prompt Depth (+${promptComplexityBonus}) + Scope (+${lengthBonus})`,
      promptTokensEst,
    };
  }

  private async deductCredits(
    userId: string,
    credits: number,
    operation: any,
    promptSnippet?: string,
    documentId?: string
  ) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const { nextRefillAt, refillSecondsRemaining, dailyAllocation } =
      await this.checkAndApplyDailyRefill(user);

    const available = user.aiCredits - user.aiCreditsUsed;
    if (available < credits) {
      const hoursLeft = Math.max(1, Math.ceil(refillSecondsRemaining / 3600));
      throw new AppError(
        `Insufficient AI credits. Required: ${credits} credits (based on prompt depth and document scope), Remaining: ${available}. Your daily allowance (+${dailyAllocation} credits) will refill in ${hoursLeft}h.`,
        402,
        'AI_CREDITS_EXHAUSTED'
      );
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

    return {
      creditsDeducted: credits,
      availableCredits: Math.max(0, user.aiCredits - user.aiCreditsUsed),
      totalCredits: user.aiCredits,
      usedCredits: user.aiCreditsUsed,
      nextRefillAt,
      refillSecondsRemaining,
      dailyAllocation,
    };
  }

  async generateDocument(userId: string, data: {
    documentType: string;
    prompt: string;
    tone?: string;
    language?: string;
    length?: 'Short' | 'Medium' | 'Long' | 'Comprehensive';
    format?: string;
  }) {
    const { credits } = this.calculateDynamicCredits('DOCUMENT_WIZARD', data.prompt, {
      length: data.length,
      format: data.format,
    });
    const creditInfo = await this.deductCredits(userId, credits, 'DOCUMENT_WIZARD', data.prompt);

    const provider = this.getProvider();
    const generatedText = await provider.generateText({
      prompt: `Create a comprehensive ${data.documentType} in ${data.language || 'English'} with a ${data.tone || 'Professional'} tone.\nScope / Length: ${data.length || 'Medium'}\nRequirements:\n${data.prompt}`,
      tone: data.tone,
    });

    return {
      title: `${data.documentType}: ${data.prompt.slice(0, 30)}...`,
      content: generatedText,
      documentType: data.documentType,
      ...creditInfo,
    };
  }

  async aiWriter(userId: string, data: {
    action: string;
    content: string;
    targetLanguage?: string;
    instructions?: string;
  }) {
    const { credits } = this.calculateDynamicCredits('WRITER', data.content);
    const creditInfo = await this.deductCredits(userId, credits, 'WRITER', data.content.slice(0, 60));
    const provider = this.getProvider();
    const result = await provider.rewriteText(data.content, data.action, 'Professional', data.targetLanguage);
    return { result, ...creditInfo };
  }

  async summarize(userId: string, data: { text: string; length?: 'short' | 'medium' | 'detailed' }) {
    const { credits } = this.calculateDynamicCredits('SUMMARIZE', data.text, { length: data.length });
    const creditInfo = await this.deductCredits(userId, credits, 'SUMMARIZE', data.text.slice(0, 60));
    const provider = this.getProvider();
    const summary = await provider.summarizeText(data.text, data.length || 'medium');
    return { summary, ...creditInfo };
  }

  async chatWithPdf(userId: string, data: { prompt: string; pdfContext?: string; documentId?: string }) {
    const { credits } = this.calculateDynamicCredits('PDF_CHAT', data.prompt, {
      contextLength: data.pdfContext?.length,
    });
    const creditInfo = await this.deductCredits(userId, credits, 'PDF_CHAT', data.prompt, data.documentId);
    const provider = this.getProvider();
    const response = await provider.answerPdfQuestion(data.pdfContext || '', data.prompt);
    return { ...response, ...creditInfo };
  }

  async analyzeExcel(userId: string, data: { data?: any; prompt?: string; action?: string }) {
    const { credits } = this.calculateDynamicCredits('EXCEL_ANALYST', data.prompt || '', {
      contextLength: data.data ? JSON.stringify(data.data).length : 0,
    });
    const creditInfo = await this.deductCredits(userId, credits, 'EXCEL_ANALYST', data.prompt);
    const provider = this.getProvider();
    const analysis = await provider.analyzeSpreadsheet(data.data, data.action || 'analyze', data.prompt);
    return { analysis, ...creditInfo };
  }

  async generatePresentation(userId: string, data: { topic: string; slideCount?: number; audience?: string; tone?: string }) {
    const { credits } = this.calculateDynamicCredits('PRESENTATION_GEN', data.topic, {
      slideCount: data.slideCount,
    });
    const creditInfo = await this.deductCredits(userId, credits, 'PRESENTATION_GEN', data.topic);
    const provider = this.getProvider();
    const presentation = await provider.generatePresentationOutline(
      data.topic,
      data.slideCount || 6,
      data.audience || 'General Business',
      data.tone || 'Professional'
    );
    return { presentation, ...creditInfo };
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

    const { credits } = this.calculateDynamicCredits(
      detectedFormat === 'PPT' ? 'PRESENTATION_GEN' : detectedFormat === 'EXCEL' ? 'EXCEL_ANALYST' : 'ARTIFACT_GEN',
      data.prompt,
      {
        slideCount: data.slideCount,
        contextLength: data.context?.length,
        format: detectedFormat,
      }
    );
    const creditInfo = await this.deductCredits(userId, credits, 'DOCUMENT_WIZARD', data.prompt);
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
        ...creditInfo,
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
        ...creditInfo,
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
      ...creditInfo,
    };
  }

  async getCreditUsage(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const { nextRefillAt, refillSecondsRemaining, dailyAllocation } =
      await this.checkAndApplyDailyRefill(user);

    const history = await AIUsage.find({ userId }).sort({ createdAt: -1 }).limit(15);
    const availableCredits = Math.max(0, user.aiCredits - user.aiCreditsUsed);

    const costMatrix = [
      { tool: 'AI Writer / Tone', cost: 1, category: 'Text', description: 'Rewriting, expanding, tone shift' },
      { tool: 'PDF Context QA', cost: 1, category: 'Document', description: 'Ask questions from uploaded documents' },
      { tool: 'Document Summary', cost: 1, category: 'Text', description: 'Instant executive summaries' },
      { tool: 'Excel AI Analyst', cost: 2, category: 'Spreadsheet', description: 'Automated formulas and data analysis' },
      { tool: 'Document Synthesis', cost: 2, category: 'Synthesis', description: 'Word report drafting & formatting' },
      { tool: 'Presentation Gen', cost: 3, category: 'Slides', description: 'Multi-slide presentation outline' },
    ];

    return {
      totalCredits: user.aiCredits,
      usedCredits: user.aiCreditsUsed,
      availableCredits,
      planId: user.planId,
      dailyAllocation,
      lastRefillAt: user.lastCreditRefillAt,
      nextRefillAt,
      refillSecondsRemaining,
      costMatrix,
      history,
    };
  }
}

export const aiService = new AIService();
