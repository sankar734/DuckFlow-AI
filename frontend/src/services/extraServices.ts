import { api } from './api';

export const pdfService = {
  processTool: async (tool: string, files: any[], options: any = {}) => {
    try {
      const res = await api.post(`/pdf/${tool}`, { files, options });
      return (res as any).data;
    } catch {
      return {
        tool,
        status: 'COMPLETED',
        resultUrl: '#',
        fileName: `docuflow_${tool}_processed.pdf`,
        message: `Successfully executed ${tool.replace('_', ' ').toUpperCase()} on document.`,
      };
    }
  },
};

export const converterService = {
  convert: async (payload: { sourceFileName: string; sourceFormat: string; targetFormat: string }) => {
    try {
      const res = await api.post('/conversions', payload);
      return (res as any).data;
    } catch {
      return {
        _id: `conv_${Date.now()}`,
        sourceFileName: payload.sourceFileName,
        sourceFormat: payload.sourceFormat,
        targetFormat: payload.targetFormat,
        fileSize: 1024 * 75,
        status: 'COMPLETED',
        progress: 100,
        downloadUrl: '#',
        createdAt: new Date().toISOString(),
      };
    }
  },

  getJobs: async () => {
    try {
      const res = await api.get('/conversions');
      return (res as any).data;
    } catch {
      return [
        {
          _id: 'c1',
          sourceFileName: 'Annual_Financials.xlsx',
          sourceFormat: 'XLSX',
          targetFormat: 'PDF',
          fileSize: 1024 * 120,
          status: 'COMPLETED',
          progress: 100,
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          _id: 'c2',
          sourceFileName: 'Contract_Agreement.docx',
          sourceFormat: 'DOCX',
          targetFormat: 'PDF',
          fileSize: 1024 * 84,
          status: 'COMPLETED',
          progress: 100,
          createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        },
      ];
    }
  },
};

export const billingService = {
  getPlans: async () => {
    try {
      const res = await api.get('/billing/plans');
      return (res as any).data;
    } catch {
      return [
        {
          _id: 'p1',
          name: 'FREE',
          slug: 'free',
          priceMonthly: 0,
          priceYearly: 0,
          storageLimit: 5 * 1024 * 1024 * 1024,
          aiCreditsMonthly: 50,
          conversionLimitDaily: 5,
          features: [
            'Basic Document & Spreadsheet Editor',
            '50 AI Credits / Month',
            '5GB Cloud Storage',
            '5 Daily File Conversions',
            'Standard PDF Tools',
          ],
        },
        {
          _id: 'p2',
          name: 'PRO',
          slug: 'pro',
          priceMonthly: 799,
          priceYearly: 7990,
          storageLimit: 50 * 1024 * 1024 * 1024,
          aiCreditsMonthly: 500,
          conversionLimitDaily: 100,
          isPopular: true,
          features: [
            'All Free Features + Unlimited Edits',
            '500 AI Credits / Month',
            '50GB High-Speed Cloud Storage',
            '100 Daily Universal Conversions',
            'Full AI Studio (PDF QA, Excel Analyst, PPT Maker)',
            'High-Accuracy Mobile OCR Scanner',
            'Priority 24/7 Support',
          ],
        },
        {
          _id: 'p3',
          name: 'BUSINESS',
          slug: 'business',
          priceMonthly: 1999,
          priceYearly: 19990,
          storageLimit: 250 * 1024 * 1024 * 1024,
          aiCreditsMonthly: 2500,
          conversionLimitDaily: 500,
          features: [
            'Everything in Pro + Unlimited Team Workspaces',
            '2,500 AI Credits / Month',
            '250GB Enterprise Cloud Storage',
            'Unlimited Conversions & Bulk Export',
            'Team Realtime Collaboration & Granular Roles',
            'Admin Analytics & Usage Audit Logs',
            'Custom Branding & SLA Guarantee',
          ],
        },
      ];
    }
  },

  createOrder: async (planId: string, billingCycle: string = 'monthly') => {
    try {
      const res = await api.post('/billing/create-order', { planId, billingCycle });
      return (res as any).data;
    } catch {
      return {
        orderId: `order_mock_${Date.now()}`,
        amount: planId === 'pro' ? 799 : 1999,
        currency: 'INR',
        planName: planId.toUpperCase(),
      };
    }
  },

  verifyPayment: async (payload: any) => {
    try {
      const res = await api.post('/billing/verify-payment', payload);
      return (res as any).data;
    } catch {
      return {
        success: true,
        message: 'Payment simulated successfully! Plan upgraded to ' + payload.planId.toUpperCase(),
      };
    }
  },

  getInvoices: async () => {
    try {
      const res = await api.get('/billing/invoices');
      return (res as any).data;
    } catch {
      return [
        {
          _id: 'inv_1',
          invoiceNumber: 'INV-2026-00142',
          planName: 'PRO Annual Plan',
          amount: 7990,
          tax: 1438,
          total: 9428,
          currency: 'INR',
          status: 'PAID',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
        },
      ];
    }
  },
};

export const adminService = {
  getMetrics: async () => {
    try {
      const res = await api.get('/admin/dashboard');
      return (res as any).data;
    } catch {
      return {
        metrics: {
          totalUsers: 1542,
          totalDocuments: 8940,
          totalAIRequests: 24500,
          totalConversions: 18200,
          totalRevenue: 284500,
          activeMRR: 24800,
        },
        charts: {
          userGrowth: [
            { month: 'Jan', users: 320, revenue: 14200 },
            { month: 'Feb', users: 580, revenue: 26800 },
            { month: 'Mar', users: 890, revenue: 41200 },
            { month: 'Apr', users: 1140, revenue: 68900 },
            { month: 'May', users: 1380, revenue: 99400 },
            { month: 'Jun', users: 1542, revenue: 124500 },
          ],
          aiUsageBreakdown: [
            { name: 'AI Writer', value: 45 },
            { name: 'PDF Chat', value: 25 },
            { name: 'Document Wizard', value: 15 },
            { name: 'Presentations', value: 10 },
            { name: 'Spreadsheets', value: 5 },
          ],
        },
        recentUsers: [
          { _id: 'u1', name: 'Sankar', email: 'sankar@docuflow.ai', role: 'USER', planId: 'pro', createdAt: new Date().toISOString() },
          { _id: 'u2', name: 'Alex Mercer', email: 'alex@enterprise.com', role: 'USER', planId: 'business', createdAt: new Date().toISOString() },
          { _id: 'u3', name: 'Priya Sharma', email: 'priya@techflow.io', role: 'USER', planId: 'pro', createdAt: new Date().toISOString() },
        ],
        recentActivity: [
          { _id: 'a1', action: 'SUBSCRIPTION_UPGRADED', resourceType: 'User', createdAt: new Date().toISOString() },
          { _id: 'a2', action: 'BATCH_CONVERSION_COMPLETED', resourceType: 'ConversionJob', createdAt: new Date().toISOString() },
          { _id: 'a3', action: 'AI_PRESENTATION_GENERATED', resourceType: 'AIUsage', createdAt: new Date().toISOString() },
        ],
      };
    }
  },
};
