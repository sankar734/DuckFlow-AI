import { create } from 'zustand';
import { api } from '../services/api';
import { useAuthStore } from './authStore';
import { toast } from 'sonner';

export interface AICostItem {
  tool: string;
  cost: number;
  category?: string;
  description?: string;
}

export interface CreditUsageHistoryItem {
  _id: string;
  operation: string;
  creditsUsed: number;
  promptSnippet?: string;
  createdAt: string;
}

interface CreditState {
  availableCredits: number;
  totalCredits: number;
  usedCredits: number;
  dailyAllocation: number;
  lastRefillAt: string | null;
  nextRefillAt: string | null;
  refillSecondsRemaining: number;
  costMatrix: AICostItem[];
  history: CreditUsageHistoryItem[];
  isLoading: boolean;
  hasInitialized: boolean;

  fetchCredits: () => Promise<void>;
  consumeCredits: (amount: number, toolName?: string) => void;
  syncFromAIResponse: (data: any, toolName?: string) => void;
  tickTimer: () => void;
}

export const defaultCostMatrix: AICostItem[] = [
  { tool: 'AI Writer / Tone', cost: 1, category: 'Text', description: 'Rewriting & quick adjustments (1–8⚡)' },
  { tool: 'PDF Context QA', cost: 1, category: 'Document', description: 'Ask questions from documents (1–6⚡)' },
  { tool: 'Document Summary', cost: 1, category: 'Text', description: 'Instant executive summaries (1–7⚡)' },
  { tool: 'Excel AI Analyst', cost: 5, category: 'Spreadsheet', description: 'Spreadsheet models & formulas (5–15⚡)' },
  { tool: 'Document Wizard', cost: 7, category: 'Synthesis', description: 'Standard to Comprehensive Reports (7–50⚡)' },
  { tool: 'Presentation Gen', cost: 8, category: 'Slides', description: 'Multi-slide presentation decks (8–35⚡)' },
];

export const estimateDynamicCredits = (
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
  }
): { credits: number; totalCredits: number; label: string; complexity: 'low' | 'medium' | 'high' | 'ultra' } => {
  const text = (prompt || '').trim();
  const charCount = text.length;
  const wordCount = text ? text.split(/\s+/).length : 0;

  let base = 1;
  let promptBonus = 0;
  let scopeBonus = 0;

  if (charCount > 2000 || wordCount > 400) {
    promptBonus = 18;
  } else if (charCount > 1000 || wordCount > 200) {
    promptBonus = 10;
  } else if (charCount > 400 || wordCount > 80) {
    promptBonus = 5;
  } else if (charCount > 150 || wordCount > 30) {
    promptBonus = 2;
  }

  switch (operation) {
    case 'DOCUMENT_WIZARD':
    case 'ARTIFACT_GEN': {
      base = 2;
      const requestedLength = (options?.length || 'Medium').toLowerCase();
      if (
        requestedLength.includes('comprehens') ||
        requestedLength.includes('full') ||
        requestedLength.includes('enterprise')
      ) {
        scopeBonus = 25;
      } else if (requestedLength.includes('long') || requestedLength.includes('detailed')) {
        scopeBonus = 12;
      } else if (requestedLength.includes('medium')) {
        scopeBonus = 5;
      } else {
        scopeBonus = 1;
      }
      break;
    }
    case 'PRESENTATION_GEN': {
      base = 3;
      const slides = options?.slideCount || 6;
      if (slides >= 15) {
        scopeBonus = 22;
      } else if (slides >= 10) {
        scopeBonus = 12;
      } else if (slides >= 6) {
        scopeBonus = 5;
      }
      break;
    }
    case 'EXCEL_ANALYST': {
      base = 2;
      if (charCount > 500 || (options?.contextLength && options.contextLength > 1000)) {
        scopeBonus = 8;
      } else {
        scopeBonus = 3;
      }
      break;
    }
    case 'PDF_CHAT': {
      base = 1;
      if (options?.contextLength && options.contextLength > 5000) {
        scopeBonus = 4;
      } else if (charCount > 300) {
        scopeBonus = 2;
      }
      break;
    }
    case 'WRITER':
    case 'SUMMARIZE':
    default: {
      base = 1;
      if (charCount > 1000) {
        scopeBonus = 6;
      } else if (charCount > 300) {
        scopeBonus = 2;
      }
      break;
    }
  }

  const credits = Math.min(50, Math.max(1, Math.round(base + promptBonus + scopeBonus)));
  const complexity = credits > 30 ? 'ultra' : credits > 15 ? 'high' : credits > 5 ? 'medium' : 'low';
  const label =
    credits > 30
      ? 'Comprehensive Enterprise Doc'
      : credits > 15
      ? 'Deep Multi-Section Prompt'
      : credits > 5
      ? 'Standard Document'
      : 'Quick Prompt';

  return { credits, totalCredits: credits, label, complexity };
};

export const useCreditStore = create<CreditState>((set, get) => ({
  availableCredits: 50,
  totalCredits: 50,
  usedCredits: 0,
  dailyAllocation: 50,
  lastRefillAt: null,
  nextRefillAt: null,
  refillSecondsRemaining: 86400,
  costMatrix: defaultCostMatrix,
  history: [],
  isLoading: false,
  hasInitialized: false,

  fetchCredits: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get('/ai/credits');
      const data = (res as any).data || res;

      if (data) {
        const availableCredits = data.availableCredits ?? Math.max(0, (data.totalCredits || 50) - (data.usedCredits || 0));
        const totalCredits = data.totalCredits || 50;
        const usedCredits = data.usedCredits || 0;
        const dailyAllocation = data.dailyAllocation || 50;
        const nextRefillAt = data.nextRefillAt || null;
        const refillSecondsRemaining = data.refillSecondsRemaining ?? (nextRefillAt ? Math.max(0, Math.floor((new Date(nextRefillAt).getTime() - Date.now()) / 1000)) : 86400);

        set({
          availableCredits,
          totalCredits,
          usedCredits,
          dailyAllocation,
          lastRefillAt: data.lastRefillAt || null,
          nextRefillAt,
          refillSecondsRemaining,
          costMatrix: data.costMatrix && data.costMatrix.length > 0 ? data.costMatrix : defaultCostMatrix,
          history: data.history || [],
          isLoading: false,
          hasInitialized: true,
        });

        // Sync with user in auth store
        useAuthStore.getState().updateUser({
          aiCredits: totalCredits,
          aiCreditsUsed: usedCredits,
          dailyCreditsAllocation: dailyAllocation,
          lastCreditRefillAt: data.lastRefillAt,
        });
      }
    } catch {
      // Fallback from auth store user if API call fails
      const authUser = useAuthStore.getState().user;
      if (authUser) {
        const total = authUser.aiCredits || 50;
        const used = authUser.aiCreditsUsed || 0;
        set({
          availableCredits: Math.max(0, total - used),
          totalCredits: total,
          usedCredits: used,
          dailyAllocation: authUser.dailyCreditsAllocation || 50,
          isLoading: false,
          hasInitialized: true,
        });
      } else {
        set({ isLoading: false, hasInitialized: true });
      }
    }
  },

  consumeCredits: (amount: number, toolName?: string) => {
    const currentAvailable = get().availableCredits;
    const currentUsed = get().usedCredits;
    const newAvailable = Math.max(0, currentAvailable - amount);
    const newUsed = currentUsed + amount;

    set({
      availableCredits: newAvailable,
      usedCredits: newUsed,
    });

    useAuthStore.getState().updateUser({
      aiCreditsUsed: newUsed,
    });

    const label = toolName ? `(${toolName})` : '';
    toast.info(`⚡ -${amount} AI Credit ${label} • ${newAvailable} remaining`);
  },

  syncFromAIResponse: (data: any, toolName?: string) => {
    if (!data) return;
    const total = data.totalCredits ?? get().totalCredits;
    const used = data.usedCredits ?? (data.creditsDeducted ? get().usedCredits + data.creditsDeducted : get().usedCredits);
    const available = data.availableCredits ?? Math.max(0, total - used);
    const nextRefillAt = data.nextRefillAt ?? get().nextRefillAt;
    const refillSecondsRemaining = data.refillSecondsRemaining ?? get().refillSecondsRemaining;

    set({
      availableCredits: available,
      totalCredits: total,
      usedCredits: used,
      nextRefillAt,
      refillSecondsRemaining,
    });

    useAuthStore.getState().updateUser({
      aiCredits: total,
      aiCreditsUsed: used,
    });

    if (data.creditsDeducted) {
      const label = toolName ? `(${toolName})` : '';
      const hoursRemaining = Math.max(1, Math.ceil(refillSecondsRemaining / 3600));
      toast.success(`⚡ -${data.creditsDeducted} Credit ${label} • ${available} remaining (Refills in ${hoursRemaining}h)`);
    }
  },

  tickTimer: () => {
    const current = get().refillSecondsRemaining;
    if (current > 1) {
      set({ refillSecondsRemaining: current - 1 });
    } else if (current === 1) {
      // Re-fetch credits when timer hits zero to receive daily replenishment
      get().fetchCredits();
    }
  },
}));

// Setup global interval for smooth countdown
let timerInterval: any = null;
export const startCreditTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    useCreditStore.getState().tickTimer();
  }, 1000);
};

export const formatTimeRemaining = (seconds: number): string => {
  if (seconds <= 0) return 'Refilling now...';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${secs}s`;
};
