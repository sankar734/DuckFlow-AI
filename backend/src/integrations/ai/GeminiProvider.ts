import axios from 'axios';
import { AIProvider, GenerateTextOptions } from './AIProvider';
import { env } from '../../config/env';
import { MockAIProvider } from './MockAIProvider';
import { logger } from '../../utils/logger';

export class GeminiProvider implements AIProvider {
  name = 'GoogleGemini';
  private fallback = new MockAIProvider();

  private getApiKey(): string {
    return env.GEMINI_API_KEY || '';
  }

  private async callGemini(prompt: string, systemInstruction?: string, temperature = 0.7): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return '';
    }

    const models = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
    ];

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const payload: any = {
          contents: [
            {
              parts: [
                {
                  text: systemInstruction
                    ? `${systemInstruction}\n\nUser Request:\n${prompt}`
                    : prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature,
            maxOutputTokens: 2048,
          },
        };

        const response = await axios.post(url, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 20000,
        });

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && typeof text === 'string') {
          return text.trim();
        }
      } catch (err: any) {
        logger.warn(`Gemini model ${model} error: ${err?.response?.data?.error?.message || err?.message || err}`);
      }
    }

    return '';
  }

  async generateText(options: GenerateTextOptions): Promise<string> {
    if (!this.getApiKey()) {
      return this.fallback.generateText(options);
    }

    try {
      const systemInstruction = options.systemInstruction || 'You are an advanced AI document editor and generator for DocuFlow AI. Provide clean, comprehensive, professional Markdown formatted content with rich headings, lists, and structure.';
      const res = await this.callGemini(options.prompt, systemInstruction, options.temperature || 0.7);
      return res || this.fallback.generateText(options);
    } catch {
      return this.fallback.generateText(options);
    }
  }

  async rewriteText(text: string, action: string, tone?: string, targetLanguage?: string): Promise<string> {
    if (!this.getApiKey()) {
      return this.fallback.rewriteText(text, action, tone, targetLanguage);
    }

    try {
      let prompt = `Perform the action "${action}" on the following text.\nTone: ${tone || 'Professional'}.\nTarget Language: ${targetLanguage || 'English'}.\n\nOriginal Text:\n${text}`;
      if (action === 'translate') {
        prompt = `Translate the following text accurately and naturally into ${targetLanguage || 'English'}:\n\n${text}`;
      } else if (action === 'grammar') {
        prompt = `Fix all spelling, punctuation, and grammatical mistakes in the following text while preserving its original meaning:\n\n${text}`;
      } else if (action === 'simplify') {
        prompt = `Simplify the following text so that it is easy to understand for any reader:\n\n${text}`;
      } else if (action === 'expand') {
        prompt = `Expand the following text with valuable context, professional elaboration, and structured supporting points:\n\n${text}`;
      }

      const res = await this.callGemini(prompt, 'You are an expert AI copywriter and language translation engine.', 0.4);
      return res || this.fallback.rewriteText(text, action, tone, targetLanguage);
    } catch {
      return this.fallback.rewriteText(text, action, tone, targetLanguage);
    }
  }

  async summarizeText(text: string, length: 'short' | 'medium' | 'detailed' = 'medium'): Promise<string> {
    if (!this.getApiKey()) {
      return this.fallback.summarizeText(text, length);
    }

    try {
      const prompt = `Summarize the following document into a concise ${length} summary with clear executive bullet points and key takeaways:\n\n${text}`;
      const res = await this.callGemini(prompt, 'You are an executive summary specialist.', 0.3);
      return res || this.fallback.summarizeText(text, length);
    } catch {
      return this.fallback.summarizeText(text, length);
    }
  }

  async analyzeSpreadsheet(data: any, action: string, prompt?: string): Promise<any> {
    if (!this.getApiKey()) {
      return this.fallback.analyzeSpreadsheet(data, action, prompt);
    }

    try {
      const systemInstruction = 'You are an expert financial and spreadsheet data analyst. Analyze the provided tabular data and return ONLY a valid JSON object matching the schema: {"summary": string, "metrics": {"totalRowsAnalyzed": number, "trendDirection": string, "potentialDuplicates": number, "highestValueCategory": string}, "recommendedFormulas": [{"formula": string, "description": string}], "chartSuggestion": {"recommendedChartType": string, "xAxis": string, "yAxis": string, "title": string}}';
      const promptText = `Analyze this dataset (${action}):\nPrompt: ${prompt || 'Analyze trends and anomalies'}\nData: ${JSON.stringify(data).slice(0, 3000)}`;
      
      const res = await this.callGemini(promptText, systemInstruction, 0.2);
      if (res) {
        const cleanJson = res.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
      }
      return this.fallback.analyzeSpreadsheet(data, action, prompt);
    } catch {
      return this.fallback.analyzeSpreadsheet(data, action, prompt);
    }
  }

  async generatePresentationOutline(topic: string, slideCount: number, audience: string, tone: string): Promise<any> {
    if (!this.getApiKey()) {
      return this.fallback.generatePresentationOutline(topic, slideCount, audience, tone);
    }

    try {
      const systemInstruction = 'You are a presentation architect. Create a structured slide presentation and return ONLY a valid JSON object matching: {"topic": string, "totalSlides": number, "audience": string, "tone": string, "slides": [{"slideNumber": number, "title": string, "layout": string, "bulletPoints": string[], "speakerNotes": string}]}';
      const promptText = `Topic: "${topic}"\nSlide Count: ${slideCount}\nAudience: "${audience}"\nTone: "${tone}"`;

      const res = await this.callGemini(promptText, systemInstruction, 0.5);
      if (res) {
        const cleanJson = res.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
      }
      return this.fallback.generatePresentationOutline(topic, slideCount, audience, tone);
    } catch {
      return this.fallback.generatePresentationOutline(topic, slideCount, audience, tone);
    }
  }

  async answerPdfQuestion(pdfContext: string, question: string): Promise<{ answer: string; references: string[] }> {
    if (!this.getApiKey()) {
      return this.fallback.answerPdfQuestion(pdfContext, question);
    }

    try {
      const systemInstruction = 'You are a document QA assistant. Answer questions based strictly on the provided PDF context. Provide citations and specific references.';
      const promptText = `PDF Document Content:\n${pdfContext.slice(0, 5000)}\n\nQuestion: ${question}`;

      const answer = await this.callGemini(promptText, systemInstruction, 0.2);
      if (answer) {
        return {
          answer,
          references: ['Document Context Analysis', 'Section Breakdown'],
        };
      }
      return this.fallback.answerPdfQuestion(pdfContext, question);
    } catch {
      return this.fallback.answerPdfQuestion(pdfContext, question);
    }
  }

  async extractOCRText(imageBuffer: Buffer | string): Promise<string> {
    return this.fallback.extractOCRText(imageBuffer);
  }
}
