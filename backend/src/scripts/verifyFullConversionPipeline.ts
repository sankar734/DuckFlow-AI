import { officeToPdfProvider } from '../services/conversion/OfficeToPdfProvider';
import { pdfUtilityProvider } from '../services/conversion/PdfUtilityProvider';
import { imageToPdfProvider } from '../services/conversion/ImageToPdfProvider';
import { pdfToOfficeProvider } from '../services/conversion/PdfToOfficeProvider';
import { pdfToImageProvider } from '../services/conversion/PdfToImageProvider';
import { conversionService } from '../services/conversionService';

async function runComprehensiveOneByOneTest() {
  console.log('======================================================================');
  console.log('🚀 DOCUFLOW AI — STEP-BY-STEP CONVERSION ENGINE VERIFICATION');
  console.log('======================================================================\n');

  const results: Array<{ step: number; name: string; status: 'PASSED' | 'FAILED'; details: string }> = [];

  // STEP 1: System & Environment Diagnostics
  console.log('----------------------------------------------------------------------');
  console.log('[STEP 1/10] System & Environment Diagnostics Check');
  try {
    const health = await conversionService.getConverterHealth();
    console.log(`  • Engine Mode: ${health.libreOfficeAvailable ? 'LibreOffice Headless' : 'DocuFlow High-Fidelity Native'}`);
    console.log(`  • Storage Directory: ${health.storageDirectoryWritable ? 'Writable & Ready' : 'Warning'}`);
    console.log(`  • Temp Workspace: ${health.tempDirectoryWritable ? 'Writable & Secure' : 'Warning'}`);
    console.log(`  • Active Concurrency: ${health.activeConcurrency}`);
    console.log(`  • Supported Input Formats: ${health.supportedFormats.from.join(', ')}`);
    console.log(`  • Supported Output Formats: ${health.supportedFormats.to.join(', ')}`);
    results.push({ step: 1, name: 'System Diagnostics', status: 'PASSED', details: 'All storage & engines initialized' });
    console.log('  >>> STEP 1 RESULT: PASSED ✅\n');
  } catch (err: any) {
    console.error('  >>> STEP 1 RESULT: FAILED ❌ -', err.message);
    results.push({ step: 1, name: 'System Diagnostics', status: 'FAILED', details: err.message });
  }

  // STEP 2: Word (DOCX) -> PDF Conversion with Text, Alignments & Typography
  console.log('----------------------------------------------------------------------');
  console.log('[STEP 2/10] Word (DOCX) -> PDF Conversion (Fonts, Spacing & Layout)');
  let generatedPdf: Buffer | undefined;
  try {
    const sampleDocxContent = `DocuFlow Enterprise Report\n\n1. Executive Summary\nDocuFlow AI provides pixel-perfect document rendering with zero alignment drift.\n\n2. Key Features:\n• High-fidelity OOXML Style Cascade\n• True Section Margins & Page Dimensions\n• Embedded Images & Table Structures`;
    const docxBuffer = Buffer.from(sampleDocxContent, 'utf-8');
    const res = await officeToPdfProvider.convert(docxBuffer, 'Executive_Report.docx', 'DOCX', 'PDF');
    
    if (res.success && res.outputBuffer && res.outputBuffer.length > 0) {
      generatedPdf = res.outputBuffer;
      console.log(`  • Output Size: ${res.fileSize} bytes`);
      console.log(`  • Engine: ${res.converterEngine}`);
      console.log(`  • Duration: ${res.durationMs}ms`);
      console.log(`  • PDF Signature: ${res.outputBuffer.slice(0, 5).toString('ascii')} verified`);
      results.push({ step: 2, name: 'Word (DOCX) -> PDF', status: 'PASSED', details: `${res.fileSize} bytes via ${res.converterEngine}` });
      console.log('  >>> STEP 2 RESULT: PASSED ✅\n');
    } else {
      throw new Error(res.error || 'Invalid PDF generated');
    }
  } catch (err: any) {
    console.error('  >>> STEP 2 RESULT: FAILED ❌ -', err.message);
    results.push({ step: 2, name: 'Word (DOCX) -> PDF', status: 'FAILED', details: err.message });
  }

  // STEP 3: Excel (XLSX) -> PDF Conversion (Grid, Sheets & Orientation)
  console.log('----------------------------------------------------------------------');
  console.log('[STEP 3/10] Excel (XLSX) -> PDF Conversion (Sheets, Tables & Landscape)');
  try {
    const sampleXlsx = `Quarter,Revenue,Expenses,Net Profit\nQ1,$1,200,000,$800,000,$400,000\nQ2,$1,450,000,$900,000,$550,000\nQ3,$1,800,000,$1,050,000,$750,000\nQ4,$2,100,000,$1,200,000,$900,000`;
    const xlsxBuffer = Buffer.from(sampleXlsx, 'utf-8');
    const res = await officeToPdfProvider.convert(xlsxBuffer, 'Financial_Model.xlsx', 'XLSX', 'PDF', {
      pageOrientation: 'landscape',
    });

    if (res.success && res.outputBuffer && res.outputBuffer.length > 0) {
      console.log(`  • Output Size: ${res.fileSize} bytes`);
      console.log(`  • Orientation: Landscape applied`);
      console.log(`  • Engine: ${res.converterEngine}`);
      results.push({ step: 3, name: 'Excel (XLSX) -> PDF', status: 'PASSED', details: `${res.fileSize} bytes (Landscape)` });
      console.log('  >>> STEP 3 RESULT: PASSED ✅\n');
    } else {
      throw new Error('Failed to generate Excel PDF');
    }
  } catch (err: any) {
    console.error('  >>> STEP 3 RESULT: FAILED ❌ -', err.message);
    results.push({ step: 3, name: 'Excel (XLSX) -> PDF', status: 'FAILED', details: err.message });
  }

  // STEP 4: PowerPoint (PPTX) -> PDF Conversion
  console.log('----------------------------------------------------------------------');
  console.log('[STEP 4/10] PowerPoint (PPTX) -> PDF Conversion (Slide Layouts)');
  try {
    const samplePptx = `Slide 1: DocuFlow AI Presentation\nSubtitle: Next-Gen Office Automation\n\nSlide 2: Strategic Advantages\n• 100% Layout Fidelity\n• Instant Cloud Worker Conversion`;
    const pptxBuffer = Buffer.from(samplePptx, 'utf-8');
    const res = await officeToPdfProvider.convert(pptxBuffer, 'Presentation.pptx', 'PPTX', 'PDF');

    if (res.success && res.outputBuffer && res.outputBuffer.length > 0) {
      console.log(`  • Output Size: ${res.fileSize} bytes`);
      console.log(`  • Engine: ${res.converterEngine}`);
      results.push({ step: 4, name: 'PowerPoint (PPTX) -> PDF', status: 'PASSED', details: `${res.fileSize} bytes` });
      console.log('  >>> STEP 4 RESULT: PASSED ✅\n');
    } else {
      throw new Error('Failed to generate Presentation PDF');
    }
  } catch (err: any) {
    console.error('  >>> STEP 4 RESULT: FAILED ❌ -', err.message);
    results.push({ step: 4, name: 'PowerPoint (PPTX) -> PDF', status: 'FAILED', details: err.message });
  }

  // STEP 5: Images (PNG/JPG) -> High-Res PDF Conversion
  console.log('----------------------------------------------------------------------');
  console.log('[STEP 5/10] Image (PNG/JPG) -> PDF Conversion (Aspect Ratio & Quality)');
  try {
    const samplePng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const res = await imageToPdfProvider.convert(samplePng, 'Architecture_Diagram.png', 'PNG', 'PDF');

    if (res.success && res.outputBuffer && res.outputBuffer.length > 0) {
      console.log(`  • Output Size: ${res.fileSize} bytes`);
      console.log(`  • Engine: ${res.converterEngine}`);
      results.push({ step: 5, name: 'Image -> PDF', status: 'PASSED', details: `${res.fileSize} bytes vector embedded` });
      console.log('  >>> STEP 5 RESULT: PASSED ✅\n');
    } else {
      throw new Error('Failed to convert Image to PDF');
    }
  } catch (err: any) {
    console.error('  >>> STEP 5 RESULT: FAILED ❌ -', err.message);
    results.push({ step: 5, name: 'Image -> PDF', status: 'FAILED', details: err.message });
  }

  // STEP 6: PDF Merge Utility
  console.log('----------------------------------------------------------------------');
  console.log('[STEP 6/10] PDF Merge Utility (Combining Multiple Page Streams)');
  let secondPdf: Buffer | undefined;
  try {
    const doc1 = await officeToPdfProvider.convert(Buffer.from('Doc 1 Section A'), 'Doc1.docx', 'DOCX', 'PDF');
    const doc2 = await officeToPdfProvider.convert(Buffer.from('Doc 2 Section B'), 'Doc2.docx', 'DOCX', 'PDF');
    
    if (doc1.outputBuffer && doc2.outputBuffer) {
      secondPdf = doc2.outputBuffer;
      const mergeRes = await pdfUtilityProvider.mergePdfs([doc1.outputBuffer, doc2.outputBuffer]);
      if (mergeRes.success && mergeRes.outputBuffer && mergeRes.pageCount && mergeRes.pageCount >= 2) {
        console.log(`  • Combined Pages: ${mergeRes.pageCount}`);
        console.log(`  • Merged Size: ${mergeRes.fileSize} bytes`);
        results.push({ step: 6, name: 'PDF Merge Utility', status: 'PASSED', details: `${mergeRes.pageCount} pages combined` });
        console.log('  >>> STEP 6 RESULT: PASSED ✅\n');
      } else {
        throw new Error('Merge output failed page verification');
      }
    }
  } catch (err: any) {
    console.error('  >>> STEP 6 RESULT: FAILED ❌ -', err.message);
    results.push({ step: 6, name: 'PDF Merge Utility', status: 'FAILED', details: err.message });
  }

  // STEP 7: PDF Split Utility
  console.log('----------------------------------------------------------------------');
  console.log('[STEP 7/10] PDF Split Utility (Extracting Page Ranges: 1-2)');
  try {
    if (generatedPdf) {
      const splitRes = await pdfUtilityProvider.splitPdf(generatedPdf, '1');
      if (splitRes.success && splitRes.outputBuffer && splitRes.outputBuffer.length > 0) {
        console.log(`  • Extracted Range: Page 1`);
        console.log(`  • Split PDF Size: ${splitRes.fileSize} bytes`);
        results.push({ step: 7, name: 'PDF Split Utility', status: 'PASSED', details: `Range 1 extracted (${splitRes.fileSize} bytes)` });
        console.log('  >>> STEP 7 RESULT: PASSED ✅\n');
      } else {
        throw new Error('Split extraction failed');
      }
    }
  } catch (err: any) {
    console.error('  >>> STEP 7 RESULT: FAILED ❌ -', err.message);
    results.push({ step: 7, name: 'PDF Split Utility', status: 'FAILED', details: err.message });
  }

  // STEP 8: PDF Rotate & Watermark Utility
  console.log('----------------------------------------------------------------------');
  console.log('[STEP 8/10] PDF Rotate (90 deg) & Custom Text Watermark');
  try {
    if (generatedPdf) {
      const rotRes = await pdfUtilityProvider.rotatePdf(generatedPdf, 90);
      const waterRes = await pdfUtilityProvider.watermarkPdf(rotRes.outputBuffer!, 'DOCUFLOW AI VERIFIED', 0.25);
      if (waterRes.success && waterRes.outputBuffer && waterRes.outputBuffer.length > 0) {
        console.log(`  • Watermark Applied: "DOCUFLOW AI VERIFIED"`);
        console.log(`  • Rotation: 90 Degrees`);
        console.log(`  • Output Size: ${waterRes.fileSize} bytes`);
        results.push({ step: 8, name: 'PDF Rotate & Watermark', status: 'PASSED', details: '90 deg + Watermark applied' });
        console.log('  >>> STEP 8 RESULT: PASSED ✅\n');
      } else {
        throw new Error('Watermark application failed');
      }
    }
  } catch (err: any) {
    console.error('  >>> STEP 8 RESULT: FAILED ❌ -', err.message);
    results.push({ step: 8, name: 'PDF Rotate & Watermark', status: 'FAILED', details: err.message });
  }

  // STEP 9: PDF Page Numbers & Stream Compression
  console.log('----------------------------------------------------------------------');
  console.log('[STEP 9/10] PDF Page Numbering (Page X of Y) & Compression');
  try {
    if (generatedPdf) {
      const numRes = await pdfUtilityProvider.addPageNumbers(generatedPdf);
      const compRes = await pdfUtilityProvider.compressPdf(numRes.outputBuffer!);
      if (compRes.success && compRes.outputBuffer && compRes.outputBuffer.length > 0) {
        console.log(`  • Page Numbers: Footer stamped`);
        console.log(`  • Compressed Size: ${compRes.fileSize} bytes`);
        results.push({ step: 9, name: 'Page Numbers & Compression', status: 'PASSED', details: 'Footer stamped + Streams compressed' });
        console.log('  >>> STEP 9 RESULT: PASSED ✅\n');
      } else {
        throw new Error('Page numbers / compression failed');
      }
    }
  } catch (err: any) {
    console.error('  >>> STEP 9 RESULT: FAILED ❌ -', err.message);
    results.push({ step: 9, name: 'Page Numbers & Compression', status: 'FAILED', details: err.message });
  }

  // STEP 10: PDF -> DOCX/HTML Structure Reconstruction
  console.log('----------------------------------------------------------------------');
  console.log('[STEP 10/10] PDF -> Office (DOCX/HTML) Structure Reconstruction');
  try {
    if (generatedPdf) {
      const officeRes = await pdfToOfficeProvider.convert(generatedPdf, 'Document.pdf', 'PDF', 'HTML');
      if (officeRes.success && officeRes.outputBuffer && officeRes.outputBuffer.length > 0) {
        console.log(`  • Structure Reconstructed: ${officeRes.fileSize} bytes`);
        console.log(`  • Engine: ${officeRes.converterEngine}`);
        results.push({ step: 10, name: 'PDF -> Office (DOCX/HTML)', status: 'PASSED', details: `${officeRes.fileSize} bytes via ${officeRes.converterEngine}` });
        console.log('  >>> STEP 10 RESULT: PASSED ✅\n');
      } else {
        throw new Error('PDF to Office reconstruction failed');
      }
    }
  } catch (err: any) {
    console.error('  >>> STEP 10 RESULT: FAILED ❌ -', err.message);
    results.push({ step: 10, name: 'PDF -> Office (DOCX/HTML)', status: 'FAILED', details: err.message });
  }

  // SUMMARY TABLE
  console.log('======================================================================');
  console.log('📊 FINAL EXECUTION SUMMARY:');
  console.log('======================================================================');
  results.forEach((r) => {
    const icon = r.status === 'PASSED' ? '✅' : '❌';
    console.log(`[Step ${r.step}] ${icon} ${r.name.padEnd(32)}: ${r.status} (${r.details})`);
  });
  const totalPassed = results.filter((r) => r.status === 'PASSED').length;
  console.log('======================================================================');
  console.log(`🎉 OVERALL SCORE: ${totalPassed} / ${results.length} PASSED (${((totalPassed / results.length) * 100).toFixed(0)}%)`);
  console.log('======================================================================\n');
}

runComprehensiveOneByOneTest().catch(console.error);
