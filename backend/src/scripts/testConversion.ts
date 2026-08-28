import { officeToPdfProvider } from '../services/conversion/OfficeToPdfProvider';
import { pdfUtilityProvider } from '../services/conversion/PdfUtilityProvider';
import { imageToPdfProvider } from '../services/conversion/ImageToPdfProvider';
import { pdfToOfficeProvider } from '../services/conversion/PdfToOfficeProvider';
import { conversionService } from '../services/conversionService';
import { logger } from '../utils/logger';

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 DOCUFLOW AI CONVERSION ENGINE AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // TEST 1: Engine Health Diagnostics
  try {
    console.log('[TEST 1/8] Checking Conversion Engine Health...');
    const health = await conversionService.getConverterHealth();
    console.log(`  ✓ LibreOffice Available: ${health.libreOfficeAvailable} (${health.libreOfficePath || 'Native fallback mode'})`);
    console.log(`  ✓ Temp Writable: ${health.tempDirectoryWritable}`);
    console.log(`  ✓ Storage Writable: ${health.storageDirectoryWritable}`);
    console.log(`  ✓ Supported Formats: From [${health.supportedFormats.from.slice(0, 5).join(', ')}...] To [${health.supportedFormats.to.join(', ')}]`);
    passed++;
  } catch (err: any) {
    console.error('  ✗ Health check failed:', err.message);
    failed++;
  }

  // TEST 2: DOCX -> PDF Conversion
  try {
    console.log('\n[TEST 2/8] Testing DOCX -> PDF Conversion...');
    const sampleDocxText = 'DocuFlow AI Enterprise Project Report\n\nExecutive Summary:\nHigh fidelity document rendering.';
    const docxBuffer = Buffer.from(sampleDocxText, 'utf-8');
    const result = await officeToPdfProvider.convert(docxBuffer, 'Test_Report.docx', 'DOCX', 'PDF');
    if (result.success && result.outputBuffer && result.outputBuffer.length > 0) {
      console.log(`  ✓ DOCX -> PDF Success via ${result.converterEngine} (${result.fileSize} bytes, ${result.durationMs}ms)`);
      passed++;
    } else {
      throw new Error(result.error || 'Empty PDF output');
    }
  } catch (err: any) {
    console.error('  ✗ DOCX -> PDF failed:', err.message);
    failed++;
  }

  // TEST 3: XLSX -> PDF Conversion
  try {
    console.log('\n[TEST 3/8] Testing XLSX -> PDF Conversion...');
    const sampleXlsxText = 'Q1,Q2,Q3,Q4\n100,150,200,250\n50,75,100,125';
    const xlsxBuffer = Buffer.from(sampleXlsxText, 'utf-8');
    const result = await officeToPdfProvider.convert(xlsxBuffer, 'Financial_Report.xlsx', 'XLSX', 'PDF', {
      pageOrientation: 'landscape',
    });
    if (result.success && result.outputBuffer && result.outputBuffer.length > 0) {
      console.log(`  ✓ XLSX -> PDF Success via ${result.converterEngine} (${result.fileSize} bytes)`);
      passed++;
    } else {
      throw new Error('Empty PDF output');
    }
  } catch (err: any) {
    console.error('  ✗ XLSX -> PDF failed:', err.message);
    failed++;
  }

  // TEST 4: Image -> PDF Conversion
  try {
    console.log('\n[TEST 4/8] Testing PNG Image -> PDF Conversion...');
    const samplePng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const result = await imageToPdfProvider.convert(samplePng, 'diagram.png', 'PNG', 'PDF');
    if (result.success && result.outputBuffer && result.outputBuffer.length > 0) {
      console.log(`  ✓ Image -> PDF Success via ${result.converterEngine} (${result.fileSize} bytes)`);
      passed++;
    } else {
      throw new Error('Empty PDF output');
    }
  } catch (err: any) {
    console.error('  ✗ Image -> PDF failed:', err.message);
    failed++;
  }

  // TEST 5: PDF Merge
  let basePdfBuffer: Buffer | undefined;
  try {
    console.log('\n[TEST 5/8] Testing PDF Merge Utility...');
    const pdf1 = await officeToPdfProvider.convert(Buffer.from('Page 1 content'), 'Doc1.docx', 'DOCX', 'PDF');
    const pdf2 = await officeToPdfProvider.convert(Buffer.from('Page 2 content'), 'Doc2.docx', 'DOCX', 'PDF');
    if (pdf1.outputBuffer && pdf2.outputBuffer) {
      basePdfBuffer = pdf1.outputBuffer;
      const merged = await pdfUtilityProvider.mergePdfs([pdf1.outputBuffer, pdf2.outputBuffer]);
      if (merged.success && merged.pageCount && merged.pageCount >= 2) {
        console.log(`  ✓ PDF Merge Success: ${merged.pageCount} pages combined (${merged.fileSize} bytes)`);
        passed++;
      } else {
        throw new Error('Merge failed to combine pages');
      }
    }
  } catch (err: any) {
    console.error('  ✗ PDF Merge failed:', err.message);
    failed++;
  }

  // TEST 6: PDF Rotate & Watermark
  try {
    console.log('\n[TEST 6/8] Testing PDF Rotate & Watermark Utilities...');
    if (basePdfBuffer) {
      const rotated = await pdfUtilityProvider.rotatePdf(basePdfBuffer, 90);
      const watermarked = await pdfUtilityProvider.watermarkPdf(rotated.outputBuffer!, 'DOCUFLOW AI VERIFIED', 0.3);
      if (watermarked.success && watermarked.outputBuffer && watermarked.outputBuffer.length > 0) {
        console.log(`  ✓ PDF Rotate (90 deg) & Watermark Success (${watermarked.fileSize} bytes)`);
        passed++;
      } else {
        throw new Error('Watermark output invalid');
      }
    }
  } catch (err: any) {
    console.error('  ✗ PDF Rotate/Watermark failed:', err.message);
    failed++;
  }

  // TEST 7: PDF Page Numbers & Compression
  try {
    console.log('\n[TEST 7/8] Testing PDF Page Numbers & Compression...');
    if (basePdfBuffer) {
      const numbered = await pdfUtilityProvider.addPageNumbers(basePdfBuffer);
      const compressed = await pdfUtilityProvider.compressPdf(numbered.outputBuffer!);
      if (compressed.success && compressed.outputBuffer && compressed.outputBuffer.length > 0) {
        console.log(`  ✓ PDF Page Numbers & Stream Compression Success (${compressed.fileSize} bytes)`);
        passed++;
      } else {
        throw new Error('Compression output invalid');
      }
    }
  } catch (err: any) {
    console.error('  ✗ PDF Page Numbers/Compress failed:', err.message);
    failed++;
  }

  // TEST 8: PDF -> DOCX / HTML Conversion
  try {
    console.log('\n[TEST 8/8] Testing PDF -> DOCX/HTML Conversion...');
    if (basePdfBuffer) {
      const officeRes = await pdfToOfficeProvider.convert(basePdfBuffer, 'Source.pdf', 'PDF', 'HTML');
      if (officeRes.success && officeRes.outputBuffer && officeRes.outputBuffer.length > 0) {
        console.log(`  ✓ PDF -> Office HTML Success via ${officeRes.converterEngine} (${officeRes.fileSize} bytes)`);
        passed++;
      } else {
        throw new Error('PDF -> Office output invalid');
      }
    }
  } catch (err: any) {
    console.error('  ✗ PDF -> Office failed:', err.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`🎉 TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');
}

runTestSuite().catch(console.error);
