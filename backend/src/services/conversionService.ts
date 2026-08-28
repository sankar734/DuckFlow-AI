import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { ConversionJob, ConversionStatus } from '../models/ConversionJob';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { officeToPdfProvider } from './conversion/OfficeToPdfProvider';
import { pdfToOfficeProvider } from './conversion/PdfToOfficeProvider';
import { imageToPdfProvider } from './conversion/ImageToPdfProvider';
import { pdfToImageProvider } from './conversion/PdfToImageProvider';
import { pdfUtilityProvider } from './conversion/PdfUtilityProvider';
import { ConversionOptions, ProviderConversionResult } from './conversion/types';

export class ConversionService {
  private storageDir = path.join(process.cwd(), 'storage');

  constructor() {
    fs.mkdirSync(this.storageDir, { recursive: true });
  }

  /**
   * System Health Check for document conversion infrastructure
   */
  async getConverterHealth(): Promise<{
    libreOfficeAvailable: boolean;
    libreOfficePath: string | null;
    tempDirectoryWritable: boolean;
    storageDirectoryWritable: boolean;
    activeConcurrency: number;
    supportedFormats: {
      from: string[];
      to: string[];
    };
  }> {
    const loPath = await officeToPdfProvider.getLibreOfficePath();
    const tempDir = os.tmpdir();
    let tempWritable = false;
    try {
      const testFile = path.join(tempDir, `docuflow_test_${Date.now()}.tmp`);
      fs.writeFileSync(testFile, 'ok');
      fs.unlinkSync(testFile);
      tempWritable = true;
    } catch {
      tempWritable = false;
    }

    let storageWritable = false;
    try {
      const testFile = path.join(this.storageDir, `docuflow_test_${Date.now()}.tmp`);
      fs.writeFileSync(testFile, 'ok');
      fs.unlinkSync(testFile);
      storageWritable = true;
    } catch {
      storageWritable = false;
    }

    return {
      libreOfficeAvailable: !!loPath,
      libreOfficePath: loPath,
      tempDirectoryWritable: tempWritable,
      storageDirectoryWritable: storageWritable,
      activeConcurrency: 1,
      supportedFormats: {
        from: ['DOCX', 'DOC', 'RTF', 'ODT', 'XLSX', 'XLS', 'CSV', 'PPTX', 'PPT', 'PDF', 'JPG', 'PNG', 'WEBP', 'TXT', 'HTML'],
        to: ['PDF', 'DOCX', 'XLSX', 'PPTX', 'JPG', 'PNG', 'TXT', 'HTML'],
      },
    };
  }

  /**
   * Creates and executes a complete conversion job
   */
  async createConversionJob(
    userId: string,
    data: {
      sourceFileName: string;
      sourceFormat: string;
      targetFormat: string;
      fileSize?: number;
      documentId?: string;
      fileData?: string; // Base64 encoded or raw string
      options?: ConversionOptions;
    }
  ) {
    const srcFmt = data.sourceFormat.toUpperCase();
    const tgtFmt = data.targetFormat.toUpperCase();
    const cleanName = data.sourceFileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const targetFileName = `${cleanName}.${tgtFmt.toLowerCase()}`;

    // 1. Create Job in database
    const job = await ConversionJob.create({
      userId: new mongoose.Types.ObjectId(userId),
      sourceFileName: data.sourceFileName,
      sourceFormat: srcFmt,
      targetFormat: tgtFmt,
      fileSize: data.fileSize || 1024 * 65,
      sourceDocumentId: data.documentId ? new mongoose.Types.ObjectId(data.documentId) : undefined,
      status: ConversionStatus.QUEUED,
      progress: 10,
    });

    try {
      // 2. Prepare Source Buffer
      job.status = ConversionStatus.PROCESSING;
      job.progress = 30;
      await job.save();

      let inputBuffer: Buffer;
      if (data.fileData) {
        if (data.fileData.startsWith('data:')) {
          const base64Data = data.fileData.split(',')[1];
          inputBuffer = Buffer.from(base64Data, 'base64');
        } else {
          inputBuffer = Buffer.from(data.fileData, 'base64');
        }
      } else {
        // Fallback default buffer if direct stream is used
        inputBuffer = Buffer.from(data.sourceFileName);
      }

      // 3. Dispatch to appropriate provider
      let providerResult: ProviderConversionResult;

      if (officeToPdfProvider.canHandle(srcFmt, tgtFmt)) {
        job.progress = 60;
        await job.save();
        providerResult = await officeToPdfProvider.convert(
          inputBuffer,
          data.sourceFileName,
          srcFmt,
          tgtFmt,
          data.options
        );
      } else if (pdfToOfficeProvider.canHandle(srcFmt, tgtFmt)) {
        job.progress = 60;
        await job.save();
        providerResult = await pdfToOfficeProvider.convert(
          inputBuffer,
          data.sourceFileName,
          srcFmt,
          tgtFmt,
          data.options
        );
      } else if (imageToPdfProvider.canHandle(srcFmt, tgtFmt)) {
        job.progress = 60;
        await job.save();
        providerResult = await imageToPdfProvider.convert(
          inputBuffer,
          data.sourceFileName,
          srcFmt,
          tgtFmt,
          data.options
        );
      } else if (pdfToImageProvider.canHandle(srcFmt, tgtFmt)) {
        job.progress = 60;
        await job.save();
        providerResult = await pdfToImageProvider.convert(
          inputBuffer,
          data.sourceFileName,
          srcFmt,
          tgtFmt,
          data.options
        );
      } else {
        // General Native vector fallback
        providerResult = await officeToPdfProvider.convert(
          inputBuffer,
          data.sourceFileName,
          srcFmt,
          tgtFmt,
          data.options
        );
      }

      // 4. Save converted output to storage directory
      const storageKey = `converted_${Date.now()}_${targetFileName}`;
      const finalOutputPath = path.join(this.storageDir, storageKey);

      if (providerResult.outputBuffer) {
        fs.writeFileSync(finalOutputPath, providerResult.outputBuffer);
      }

      // 5. Update Job with success
      job.status = ConversionStatus.COMPLETED;
      job.progress = 100;
      job.storageKey = storageKey;
      job.downloadUrl = `/storage/${storageKey}`;
      job.completedAt = new Date();
      await job.save();

      logger.info(`Conversion Job completed: ${job._id} (${srcFmt} -> ${tgtFmt}) via ${providerResult.converterEngine} in ${providerResult.durationMs}ms`);

      return {
        ...job.toObject(),
        downloadUrl: `/storage/${storageKey}`,
        converterEngine: providerResult.converterEngine,
        durationMs: providerResult.durationMs,
      };
    } catch (err: any) {
      logger.error(`Conversion job failed for ${job._id}:`, err);
      job.status = ConversionStatus.FAILED;
      job.errorMessage = err.message || 'Conversion failed';
      await job.save();
      throw new AppError(`Conversion failed: ${err.message}`, 500);
    }
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
    return ConversionJob.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 }).limit(30);
  }
}

export const conversionService = new ConversionService();
