export interface GenerateTextOptions {
  prompt: string;
  systemInstruction?: string;
  tone?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIProvider {
  name: string;
  generateText(options: GenerateTextOptions): Promise<string>;
  rewriteText(text: string, action: string, tone?: string, targetLanguage?: string): Promise<string>;
  summarizeText(text: string, length?: 'short' | 'medium' | 'detailed'): Promise<string>;
  analyzeSpreadsheet(data: any, action: string, prompt?: string): Promise<any>;
  generatePresentationOutline(topic: string, slideCount: number, audience: string, tone: string): Promise<any>;
  answerPdfQuestion(pdfContext: string, question: string): Promise<{ answer: string; references: string[] }>;
  extractOCRText(imageBuffer: Buffer | string): Promise<string>;
}
