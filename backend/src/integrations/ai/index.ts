import { AIProvider } from './AIProvider';
import { GeminiProvider } from './GeminiProvider';
import { MockAIProvider } from './MockAIProvider';
import { env } from '../../config/env';

export const getAIProvider = (): AIProvider => {
  if (env.GEMINI_API_KEY) {
    return new GeminiProvider();
  }
  return new MockAIProvider();
};
