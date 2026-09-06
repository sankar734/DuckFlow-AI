import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { ConversionJob, ConversionStatus } from '../models/ConversionJob';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { officeToPdfProvider } from './conversion/OfficeToPdfProvider';
import { FormatDetector } from './conversion/FormatDetector';
import { DocumentAnalyzer } from './conversion/DocumentAnalyzer';
import { conversionOrchestrator } from './conversion/ConversionOrchestrator';
import { PdfValidator, PdfValidationResult } from './conversion/validation/PdfValidator';
import { FidelityValidator } from './conversion/validation/FidelityValidator';
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
        from: [
          'DOCX',
          'DOC',
          'RTF',
          'ODT',
          'XLSX',
          'XLS',
          'CSV',
          'ODS',
          'PPTX',
          'PPT',
          'ODP',
          'PDF',
          'JPG',
          'JPEG',
          'PNG',
          'WEBP',
          'TIFF',
          'TXT',
          'HTML',
        ],
        to: ['PDF', 'DOCX', 'XLSX', 'PPTX', 'JPG', 'PNG', 'TXT', 'HTML'],
      },
    };
  }

  /**
   * Creates and executes a complete universal conversion job
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
    const cleanName = data.sourceFileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');

    // 1. Prepare Source Buffer & Validate Container
    let inputBuffer: Buffer;
    if (data.fileData) {
      if (data.fileData.startsWith('data:')) {
        const base64Data = data.fileData.split(',')[1];
        inputBuffer = Buffer.from(base64Data, 'base64');
      } else {
        inputBuffer = Buffer.from(data.fileData, 'base64');
      }
    } else {
      inputBuffer = Buffer.from(data.sourceFileName);
    }

    // Format Detection & Security Verification
    const detection = FormatDetector.detect(inputBuffer, data.sourceFileName);
    if (!detection.isValid) {
      throw new AppError(`INVALID_FILE: ${detection.error || 'Invalid document format'}`, 400);
    }

    const srcFmt = (detection.format !== 'UNKNOWN' ? detection.format : data.sourceFormat).toUpperCase();
    const tgtFmt = data.targetFormat.toUpperCase();
    const targetFileName = `${cleanName}.${tgtFmt.toLowerCase()}`;

    // 2. Create Job in database
    const job = await ConversionJob.create({
      userId: new mongoose.Types.ObjectId(userId),
      sourceFileName: data.sourceFileName,
      sourceFormat: srcFmt,
      targetFormat: tgtFmt,
      fileSize: inputBuffer.length,
      sourceDocumentId: data.documentId ? new mongoose.Types.ObjectId(data.documentId) : undefined,
      status: ConversionStatus.QUEUED,
      progress: 10,
    });

    try {
      // 3. Preserve Original Source File in Storage
      const userStorageDir = path.join(this.storageDir, 'users', userId, 'documents', String(job._id), 'original');
      fs.mkdirSync(userStorageDir, { recursive: true });
      const originalFilePath = path.join(userStorageDir, data.sourceFileName);
      fs.writeFileSync(originalFilePath, inputBuffer);

      // 4. Pre-Conversion Document Analysis
      job.status = ConversionStatus.ANALYZING;
      job.progress = 25;
      await job.save();

      const inputSha256 = crypto.createHash('sha256').update(inputBuffer).digest('hex');
      logger.info(
        `[CONVERSION] jobId=${job._id} sourceFormat=${srcFmt} targetFormat=${tgtFmt} inputSize=${inputBuffer.length} inputHash=${inputSha256}`
      );

      const analysis = await DocumentAnalyzer.analyze(inputBuffer, srcFmt);
      logger.info(`Document Analysis for Job ${job._id}:`, {
        format: analysis.format,
        estimatedPages: analysis.pageCountEstimated,
        complexity: analysis.complexityScore,
      });

      // 5. Preparation & Provider Dispatch
      job.status = ConversionStatus.PROCESSING;
      job.progress = 50;
      await job.save();

      const providerResult: ProviderConversionResult = await conversionOrchestrator.convert(
        inputBuffer,
        data.sourceFileName,
        srcFmt,
        tgtFmt,
        analysis,
        data.options
      );

      if (!providerResult.success || !providerResult.outputBuffer) {
        throw new Error(providerResult.error || 'Conversion provider failed to generate output');
      }

      // 6. Post-Conversion Output Validation
      job.status = ConversionStatus.VALIDATING;
      job.progress = 80;
      await job.save();

      let pdfValidation: PdfValidationResult = {
        isValid: true,
        pageCount: 1,
        fileSize: providerResult.outputBuffer.length,
      };
      if (tgtFmt === 'PDF') {
        pdfValidation = await PdfValidator.validate(providerResult.outputBuffer);
        if (!pdfValidation.isValid) {
          throw new Error(`OUTPUT_INVALID: ${pdfValidation.error || 'Generated PDF validation failed'}`);
        }
      }

      // 7. Fidelity Quality Gate
      job.status = ConversionStatus.FIDELITY_CHECK;
      job.progress = 90;
      await job.save();

      const fidelityReport = FidelityValidator.evaluate(analysis, pdfValidation, tgtFmt);
      if (!fidelityReport.passed) {
        throw new Error(fidelityReport.failureReason || 'FIDELITY_CHECK_FAILED: Conversion failed quality gate');
      }

      // 8. Persist Converted Output
      const conversionsDir = path.join(this.storageDir, 'users', userId, 'documents', String(job._id), 'conversions');
      fs.mkdirSync(conversionsDir, { recursive: true });

      const storageKey = `converted_${job._id}_${targetFileName}`;
      const finalOutputPath = path.join(this.storageDir, storageKey);
      fs.writeFileSync(finalOutputPath, providerResult.outputBuffer);

      // 9. Complete Job
      job.status = ConversionStatus.COMPLETED;
      job.progress = 100;
      job.storageKey = storageKey;
      job.downloadUrl = `/storage/${storageKey}`;
      job.converterEngine = providerResult.converterEngine;
      job.pageCount = pdfValidation.pageCount;
      job.fidelityScore = fidelityReport.fidelityScore;
      job.warnings = fidelityReport.warnings;
      job.completedAt = new Date();
      await job.save();

      logger.info(
        `Conversion Job completed: ${job._id} (${srcFmt} -> ${tgtFmt}) via ${providerResult.converterEngine} in ${providerResult.durationMs}ms [${pdfValidation.pageCount} pages]`
      );

      return {
        ...job.toObject(),
        downloadUrl: `/storage/${storageKey}`,
        converterEngine: providerResult.converterEngine,
        durationMs: providerResult.durationMs,
        pageCount: pdfValidation.pageCount,
        fidelityScore: fidelityReport.fidelityScore,
        warnings: fidelityReport.warnings,
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
    return ConversionJob.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(30);
  }
}

export const conversionService = new ConversionService();
