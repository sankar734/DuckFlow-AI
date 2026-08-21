export interface AICreditState {
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
  planId: string;
  history: Array<{
    _id: string;
    operation: string;
    creditsUsed: number;
    promptSnippet?: string;
    createdAt: string;
  }>;
}

export interface PlanItem {
  _id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  priceYearly: number;
  storageLimit: number;
  aiCreditsMonthly: number;
  conversionLimitDaily: number;
  features: string[];
  isPopular?: boolean;
}

export interface InvoiceItem {
  _id: string;
  invoiceNumber: string;
  planName: string;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  status: 'PAID' | 'DUE' | 'VOID';
  downloadUrl?: string;
  createdAt: string;
}

export interface ConversionJobItem {
  _id: string;
  sourceFileName: string;
  sourceFormat: string;
  targetFormat: string;
  fileSize: number;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  downloadUrl?: string;
  createdAt: string;
}
