import { getAIProvider } from '../integrations/ai';

export class OCRService {
  async extractText(fileBufferOrPath: any) {
    const provider = getAIProvider();
    const extractedText = await provider.extractOCRText(fileBufferOrPath);
    return {
      extractedText,
      confidenceScore: 0.985,
      processedPages: 1,
      languageDetected: 'English',
    };
  }
}

export const ocrService = new OCRService();
