import mongoose from 'mongoose';
import { ConversionJob, ConversionStatus } from '../models/ConversionJob';
import { AppError } from '../middleware/errorHandler';

export class ConversionService {
  async createConversionJob(userId: string, data: {
    sourceFileName: string;
    sourceFormat: string;
    targetFormat: string;
    fileSize?: number;
    documentId?: string;
  }) {
    const job = await ConversionJob.create({
      userId: new mongoose.Types.ObjectId(userId),
      sourceFileName: data.sourceFileName,
      sourceFormat: data.sourceFormat.toUpperCase(),
      targetFormat: data.targetFormat.toUpperCase(),
      fileSize: data.fileSize || 1024 * 50,
      sourceDocumentId: data.documentId ? new mongoose.Types.ObjectId(data.documentId) : undefined,
      status: ConversionStatus.COMPLETED,
      progress: 100,
      downloadUrl: `/storage/converted_${Date.now()}.${data.targetFormat.toLowerCase()}`,
      completedAt: new Date(),
    });

    return job;
  }

  async getJobStatus(jobId: string, userId: string) {
    const job = await ConversionJob.findOne({
      _id: jobId,
      userId: new mongoose.Types.ObjectId(userId),
    });
    if (!job) throw new AppError('Conversion job not found', 404);
    return job;
  }

  async getUserJobs(userId: string) {
    return ConversionJob.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 }).limit(20);
  }
}

export const conversionService = new ConversionService();
