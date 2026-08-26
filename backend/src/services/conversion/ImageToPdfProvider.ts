import { PDFDocument, rgb } from 'pdf-lib';
import { ConversionOptions, ProviderConversionResult, IConversionProvider } from './types';

export class ImageToPdfProvider implements IConversionProvider {
  canHandle(sourceFormat: string, targetFormat: string): boolean {
    const src = sourceFormat.toLowerCase();
    const tgt = targetFormat.toLowerCase();
    const imageFormats = ['jpg', 'jpeg', 'png', 'webp', 'bmp'];
    return imageFormats.includes(src) && tgt === 'pdf';
  }

  async convert(
    inputBuffer: Buffer,
    sourceFileName: string,
    sourceFormat: string,
    targetFormat: string,
    options: ConversionOptions = {}
  ): Promise<ProviderConversionResult> {
    const startTime = Date.now();
    const pdfDoc = await PDFDocument.create();
    const src = sourceFormat.toLowerCase();

    let embeddedImage;
    if (src === 'jpg' || src === 'jpeg') {
      embeddedImage = await pdfDoc.embedJpg(inputBuffer);
    } else {
      // Default to PNG embed
      embeddedImage = await pdfDoc.embedPng(inputBuffer);
    }

    const { width: imgWidth, height: imgHeight } = embeddedImage;
    const isLandscape = options.pageOrientation === 'landscape' || imgWidth > imgHeight;
    const pageWidth = isLandscape ? 842 : 595;
    const pageHeight = isLandscape ? 595 : 842;
    const margin = 36;

    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight, 1);
    const renderWidth = imgWidth * scale;
    const renderHeight = imgHeight * scale;

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const x = (pageWidth - renderWidth) / 2;
    const y = (pageHeight - renderHeight) / 2;

    page.drawImage(embeddedImage, {
      x,
      y,
      width: renderWidth,
      height: renderHeight,
    });

    const pdfBytes = await pdfDoc.save();
    const outputBuffer = Buffer.from(pdfBytes);

    return {
      success: true,
      outputBuffer,
      fileSize: outputBuffer.length,
      pageCount: 1,
      converterEngine: 'PDF-Lib Binary Engine',
      durationMs: Date.now() - startTime,
    };
  }
}

export const imageToPdfProvider = new ImageToPdfProvider();
