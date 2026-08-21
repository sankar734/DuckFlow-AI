import { api } from './api';
import { DocumentItem, DocumentType } from '../types/document';

const mockDocuments: DocumentItem[] = [
  {
    _id: 'doc_1',
    ownerId: 'usr_demo_123',
    name: 'DocuFlow AI Master Architecture.docx',
    type: 'WORD',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 1024 * 65,
    status: 'ACTIVE',
    isFavorite: true,
    isDeleted: false,
    currentVersionNumber: 3,
    metadata: { wordCount: 1420, pageCount: 4 },
    content: {
      title: 'DocuFlow AI Master Architecture',
      body: `<h2>Executive System Architecture</h2><p>DocuFlow AI unifies multi-format document authoring, intelligent spreadsheet modeling, presentation compilation, and secure cloud storage under a single micro-service ecosystem.</p><h3>Key System Subsystems</h3><ul><li><strong>Interactive Editors</strong>: Real-time Word, Excel, and PPT rendering canvases.</li><li><strong>AI Copilot</strong>: Embedded context-aware assistant for grammar, summaries, and formula generation.</li><li><strong>Universal Engine</strong>: Lossless conversion across Word, Excel, PPT, PDF, and OCR scan formats.</li></ul>`,
    },
    lastViewedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    _id: 'doc_2',
    ownerId: 'usr_demo_123',
    name: 'SaaS Financial Forecast 2026.xlsx',
    type: 'EXCEL',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 1024 * 128,
    status: 'ACTIVE',
    isFavorite: true,
    isDeleted: false,
    currentVersionNumber: 1,
    metadata: { sheetCount: 2 },
    content: {
      sheets: [
        {
          id: 's1',
          name: 'Revenue & Growth',
          grid: [
            ['Metric', 'Jan 2026', 'Feb 2026', 'Mar 2026', 'Q1 Summary'],
            ['Active Subscriptions', 1250, 1680, 2140, '=AVERAGE(B2:D2)'],
            ['Monthly Recurring Revenue ($)', 14200, 18900, 24500, '=SUM(B3:D3)'],
            ['Server Infrastructure Cost ($)', 1850, 2100, 2450, '=SUM(B4:D4)'],
            ['Gross Profit ($)', '=B3-B4', '=C3-C4', '=D3-D4', '=E3-E4'],
          ],
        },
      ],
    },
    lastViewedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    _id: 'doc_3',
    ownerId: 'usr_demo_123',
    name: 'Investor Pitch & Product Roadmap.pptx',
    type: 'PPT',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    size: 1024 * 420,
    status: 'ACTIVE',
    isFavorite: false,
    isDeleted: false,
    currentVersionNumber: 2,
    metadata: { slideCount: 5 },
    content: {
      theme: 'Modern Slate',
      slides: [
        {
          id: 's1',
          layout: 'title',
          title: 'DocuFlow AI',
          subtitle: 'Create. Convert. Understand.',
          notes: 'Open presentation highlighting mission and platform vision.',
        },
        {
          id: 's2',
          layout: 'bullets',
          title: 'The Modern Document Dilemma',
          bullets: [
            'Fragmented tools cause 4.2 hours lost per employee weekly',
            'File conversion tools are unsafe and ad-ridden',
            'AI tools lack structured multi-page document fidelity',
          ],
          notes: 'Walk through key user pain points.',
        },
        {
          id: 's3',
          layout: 'bullets',
          title: 'Our Unified Solution',
          bullets: [
            'All-in-one Word, Excel, PPT, PDF, and OCR workspace',
            'Built-in AI Copilot tailored for professional workflows',
            'Enterprise role-based collaboration & sharing',
          ],
          notes: 'Highlight DocuFlow differentiators.',
        },
      ],
    },
    lastViewedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    _id: 'doc_4',
    ownerId: 'usr_demo_123',
    name: 'Client Services Agreement.pdf',
    type: 'PDF',
    mimeType: 'application/pdf',
    size: 1024 * 850,
    status: 'ACTIVE',
    isFavorite: false,
    isDeleted: false,
    currentVersionNumber: 1,
    metadata: { pageCount: 8, ocrProcessed: true },
    lastViewedAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
];

export const documentService = {
  getDocuments: async (params: any = {}) => {
    try {
      const res = await api.get('/documents', { params });
      return (res as any).data || mockDocuments;
    } catch {
      let filtered = [...mockDocuments];
      if (params.type) filtered = filtered.filter((d) => d.type === params.type);
      if (params.isFavorite !== undefined) filtered = filtered.filter((d) => d.isFavorite === params.isFavorite);
      if (params.search) {
        filtered = filtered.filter((d) => d.name.toLowerCase().includes(params.search.toLowerCase()));
      }
      return filtered;
    }
  },

  getRecent: async () => {
    try {
      const res = await api.get('/documents/recent');
      return (res as any).data || mockDocuments.slice(0, 4);
    } catch {
      return mockDocuments.slice(0, 4);
    }
  },

  getTrash: async () => {
    try {
      const res = await api.get('/documents/trash');
      return (res as any).data || [];
    } catch {
      return [];
    }
  },

  getDocumentById: async (id: string): Promise<DocumentItem> => {
    try {
      const res = await api.get(`/documents/${id}`);
      return (res as any).data;
    } catch {
      const found = mockDocuments.find((d) => d._id === id);
      if (found) return found;
      // Default generated document for new id
      return {
        _id: id,
        ownerId: 'usr_demo_123',
        name: 'Untitled Document',
        type: 'WORD',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 1024 * 20,
        status: 'ACTIVE',
        isFavorite: false,
        isDeleted: false,
        currentVersionNumber: 1,
        metadata: { wordCount: 120, pageCount: 1 },
        content: {
          title: 'Untitled Document',
          body: '<h2>New Document</h2><p>Start writing your document or prompt the AI Copilot to generate ideas, outlines, and summaries.</p>',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  },

  createDocument: async (data: { name: string; type: DocumentType; content?: any; folderId?: string }) => {
    try {
      const res = await api.post('/documents', data);
      return (res as any).data;
    } catch {
      const newDoc: DocumentItem = {
        _id: `doc_${Date.now()}`,
        ownerId: 'usr_demo_123',
        name: data.name,
        type: data.type,
        mimeType: 'application/octet-stream',
        size: 1024 * 15,
        status: 'ACTIVE',
        isFavorite: false,
        isDeleted: false,
        currentVersionNumber: 1,
        content: data.content,
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockDocuments.unshift(newDoc);
      return newDoc;
    }
  },

  updateDocument: async (id: string, updateData: Partial<DocumentItem>) => {
    try {
      const res = await api.patch(`/documents/${id}`, updateData);
      return (res as any).data;
    } catch {
      const doc = mockDocuments.find((d) => d._id === id);
      if (doc) {
        Object.assign(doc, updateData, { updatedAt: new Date().toISOString() });
      }
      return doc;
    }
  },

  moveToTrash: async (id: string) => {
    try {
      return await api.post(`/documents/${id}/trash`);
    } catch {
      const doc = mockDocuments.find((d) => d._id === id);
      if (doc) doc.isDeleted = true;
      return { success: true };
    }
  },

  restoreFromTrash: async (id: string) => {
    try {
      return await api.post(`/documents/${id}/restore`);
    } catch {
      const doc = mockDocuments.find((d) => d._id === id);
      if (doc) doc.isDeleted = false;
      return { success: true };
    }
  },

  permanentDelete: async (id: string) => {
    try {
      return await api.delete(`/documents/${id}`);
    } catch {
      const index = mockDocuments.findIndex((d) => d._id === id);
      if (index > -1) mockDocuments.splice(index, 1);
      return { success: true };
    }
  },
};
