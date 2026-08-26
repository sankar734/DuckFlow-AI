export type ConversionStage =
  | 'UPLOADING'
  | 'QUEUED'
  | 'PREPARING'
  | 'PROCESSING'
  | 'VALIDATING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type ConverterEngineType =
  | 'LibreOffice Headless'
  | 'DocuFlow Native Engine'
  | 'PDF-Lib Binary Engine'
  | 'Hybrid Vector Engine';

export interface ConversionOptions {
  pageOrientation?: 'portrait' | 'landscape' | 'auto';
  pageSize?: 'A4' | 'Letter' | 'Legal' | 'Custom';
  margins?: { topPt: number; bottomPt: number; leftPt: number; rightPt: number };
  watermarkText?: string;
  watermarkOpacity?: number;
  password?: string;
  pageRange?: string;
  rotationDegrees?: 90 | 180 | 270;
  excelPrintSettings?: {
    fitToPage?: boolean;
    fitToWidth?: boolean;
    sheetSelection?: 'current' | 'all';
  };
  imageQuality?: 'standard' | 'high' | 'optimized';
}

export interface ProviderConversionResult {
  success: boolean;
  outputPath?: string;
  outputBuffer?: Buffer;
  downloadUrl?: string;
  fileSize: number;
  converterEngine: ConverterEngineType;
  durationMs: number;
  pageCount?: number;
  warnings?: string[];
  error?: string;
}

export interface IConversionProvider {
  canHandle(sourceFormat: string, targetFormat: string): boolean;
  convert(
    inputBuffer: Buffer,
    sourceFileName: string,
    sourceFormat: string,
    targetFormat: string,
    options?: ConversionOptions
  ): Promise<ProviderConversionResult>;
}
