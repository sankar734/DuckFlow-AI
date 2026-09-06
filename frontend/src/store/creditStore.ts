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
  { tool: 'AI Writer / Tone', cost: 1, category: 'Text', description: 'Rewriting, expanding, tone shift' },
  { tool: 'PDF Context QA', cost: 1, category: 'Document', description: 'Ask questions from uploaded documents' },
  { tool: 'Document Summary', cost: 1, category: 'Text', description: 'Instant executive summaries' },
  { tool: 'Excel AI Analyst', cost: 2, category: 'Spreadsheet', description: 'Automated formulas and data analysis' },
  { tool: 'Document Synthesis', cost: 2, category: 'Synthesis', description: 'Word report drafting & formatting' },
  { tool: 'Presentation Gen', cost: 3, category: 'Slides', description: 'Multi-slide presentation outline' },
];

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
