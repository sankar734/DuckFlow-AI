import { IConversionProvider, ConversionOptions, ProviderConversionResult } from './types';
import { officeToPdfProvider } from './OfficeToPdfProvider';
import { spreadsheetToPdfProvider } from './SpreadsheetToPdfProvider';
import { presentationToPdfProvider } from './PresentationToPdfProvider';
import { imageToPdfProvider } from './ImageToPdfProvider';
import { pdfToImageProvider } from './PdfToImageProvider';
import { pdfToOfficeProvider } from './PdfToOfficeProvider';
import { DocumentAnalysis } from './DocumentAnalyzer';
import { logger } from '../../utils/logger';

export class ConversionOrchestrator {
  private providers: IConversionProvider[] = [];

  constructor() {
    // Register specialized conversion providers in order of specificity
    this.providers = [
      spreadsheetToPdfProvider,
      presentationToPdfProvider,
      officeToPdfProvider,
      imageToPdfProvider,
      pdfToImageProvider,
      pdfToOfficeProvider,
    ];
  }

  /**
   * Selects the format-specific provider and executes conversion
   */
  async convert(
    inputBuffer: Buffer,
    sourceFileName: string,
    sourceFormat: string,
    targetFormat: string,
    analysis?: DocumentAnalysis,
    options: ConversionOptions = {}
  ): Promise<ProviderConversionResult> {
    const src = sourceFormat.toUpperCase();
    const tgt = targetFormat.toUpperCase();

    logger.info(`ConversionOrchestrator: Routing ${src} -> ${tgt} for '${sourceFileName}'`);

    for (const provider of this.providers) {
      if (provider.canHandle(src, tgt)) {
        logger.info(`ConversionOrchestrator: Selected provider [${provider.constructor.name}]`);
        return await provider.convert(inputBuffer, sourceFileName, src, tgt, options);
      }
    }

    // Default fallback to OfficeToPdfProvider
    logger.warn(`ConversionOrchestrator: No specialized provider found for ${src} -> ${tgt}, using OfficeToPdf fallback`);
    return await officeToPdfProvider.convert(inputBuffer, sourceFileName, src, tgt, options);
  }
}

export const conversionOrchestrator = new ConversionOrchestrator();
