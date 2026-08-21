import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
});

export const otpVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6),
});

export const createDocumentSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  type: z.enum(['WORD', 'EXCEL', 'PPT', 'PDF', 'TEXT', 'IMAGE', 'CSV']),
  folderId: z.string().optional(),
  content: z.any().optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateDocumentSchema = z.object({
  name: z.string().min(1).optional(),
  content: z.any().optional(),
  folderId: z.string().nullable().optional(),
  isFavorite: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  changeSummary: z.string().optional(),
});

export const shareDocumentSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(['VIEWER', 'COMMENTER', 'EDITOR']),
  isPublicLink: z.boolean().optional(),
  expiresInDays: z.number().optional(),
  password: z.string().optional(),
});

export const aiGenerateSchema = z.object({
  documentType: z.enum(['Report', 'Resume', 'Assignment', 'Proposal', 'Letter', 'Research document', 'Meeting notes', 'Custom']),
  prompt: z.string().min(3, 'Prompt must be at least 3 characters'),
  tone: z.string().default('Professional'),
  language: z.string().default('English'),
  length: z.enum(['Short', 'Medium', 'Long']).default('Medium'),
  format: z.string().default('Markdown'),
});

export const aiWriterSchema = z.object({
  action: z.enum(['write', 'rewrite', 'expand', 'summarize', 'grammar', 'professional', 'simplify', 'translate']),
  content: z.string().min(1, 'Content is required'),
  targetLanguage: z.string().optional(),
  instructions: z.string().optional(),
});

export const aiPdfChatSchema = z.object({
  documentId: z.string().optional(),
  prompt: z.string().min(1, 'Prompt is required'),
  pdfContext: z.string().optional(),
});

export const aiExcelAnalyzeSchema = z.object({
  data: z.any().default([]),
  prompt: z.string().optional(),
  action: z.enum(['analyze', 'trends', 'duplicates', 'summarize', 'formula', 'chart_suggest']).default('analyze'),
});

export const aiPresentationSchema = z.object({
  topic: z.string().min(3),
  slideCount: z.number().min(3).max(25).default(6),
  tone: z.string().default('Professional'),
  audience: z.string().default('General Business'),
});

export const conversionJobSchema = z.object({
  sourceFormat: z.string(),
  targetFormat: z.string(),
  sourceFileName: z.string(),
  documentId: z.string().optional(),
});

export const createOrderSchema = z.object({
  planId: z.enum(['pro', 'business', 'enterprise']),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  planId: z.string(),
});
