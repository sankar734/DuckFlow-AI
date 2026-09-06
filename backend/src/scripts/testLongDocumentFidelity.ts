import JSZip from 'jszip';
import { conversionOrchestrator } from '../services/conversion/ConversionOrchestrator';
import { DocumentAnalyzer } from '../services/conversion/DocumentAnalyzer';
import { PdfValidator } from '../services/conversion/validation/PdfValidator';
import { FidelityValidator } from '../services/conversion/validation/FidelityValidator';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

/**
 * Creates an 88-page comprehensive project thesis DOCX archive
 * specifically modeling the long-document failure case (88 pages -> 28 pages):
 * - Page 1: Title & Cover
 * - Page 2: Certificate
 * - Page 3: Declaration
 * - Page 4: Acknowledgement
 * - Page 5-88: 84 Chapter Sections with content, tables, and explicit page breaks
 */
async function create88PageDocxFixture(): Promise<Buffer> {
  const zip = new JSZip();

  // 1x1 transparent PNG image for embedded media
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const logoBuffer = Buffer.from(pngBase64, 'base64');

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdImg" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
</Relationships>`
  );

  zip.file('word/media/image1.png', logoBuffer);

  let docBody = `
    <!-- PAGE 1: COVER -->
    <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="240" w:after="240"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t>DOCUFLOW ENTERPRISE SPECIFICATION (88 PAGES)</w:t></w:r>
    </w:p>
    <w:p><w:r><w:br w:type="page"/></w:r></w:p>

    <!-- PAGE 2: CERTIFICATE -->
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>BONAFIDE CERTIFICATE</w:t></w:r></w:p>
    <w:p><w:r><w:br w:type="page"/></w:r></w:p>

    <!-- PAGE 3: DECLARATION -->
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>DECLARATION</w:t></w:r></w:p>
    <w:p><w:r><w:br w:type="page"/></w:r></w:p>

    <!-- PAGE 4: ACKNOWLEDGEMENT -->
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>ACKNOWLEDGEMENT</w:t></w:r></w:p>
    <w:p><w:r><w:br w:type="page"/></w:r></w:p>
  `;

  // Pages 5 to 88 (84 distinct chapter/topic pages)
  for (let pageNum = 5; pageNum <= 88; pageNum++) {
    docBody += `
      <w:p><w:pPr><w:spacing w:before="180" w:after="120"/></w:pPr>
        <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:rFonts w:ascii="Times New Roman"/></w:rPr><w:t>SECTION ${pageNum - 4}: TECHNICAL ARCHITECTURE MODULE ${pageNum}</w:t></w:r>
      </w:p>
      <w:p><w:pPr><w:jc w:val="both"/><w:spacing w:before="80" w:after="80"/></w:pPr>
        <w:r><w:rPr><w:sz w:val="22"/><w:rFonts w:ascii="Times New Roman"/></w:rPr><w:t>Detailed architectural specification for high-fidelity conversion worker node ${pageNum}. This module enforces vector boundaries and ensures zero page collapse.</w:t></w:r>
      </w:p>
    `;

    if (pageNum % 5 === 0) {
      // Include Table on every 5th page
      docBody += `
        <w:tbl>
          <w:tr>
            <w:tc><w:p><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>Metric</w:t></w:r></w:p></w:tc>
            <w:tc><w:p><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>Value</w:t></w:r></w:p></w:tc>
          </w:tr>
          <w:tr>
            <w:tc><w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>Node ID</w:t></w:r></w:p></w:tc>
            <w:tc><w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>Node-${pageNum}</w:t></w:r></w:p></w:tc>
          </w:tr>
        </w:tbl>
      `;
    }

    if (pageNum < 88) {
      docBody += `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
    }
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <w:body>
    ${docBody}
  </w:body>
</w:document>`;

  zip.file('word/document.xml', documentXml);
  return await zip.generateAsync({ type: 'nodebuffer' });
}

async function run88PageFidelityTest() {
  console.log('======================================================================');
  console.log('🚀 DOCUFLOW AI — 88-PAGE LONG DOCUMENT FIDELITY QA TEST');
  console.log('======================================================================\n');

  console.log('[1/5] Synthesizing 88-Page Long Document DOCX Fixture...');
  const docxBuffer = await create88PageDocxFixture();
  console.log(`✓ Fixture generated (${docxBuffer.length} bytes)\n`);

  console.log('[2/5] Running Pre-Conversion DocumentAnalyzer...');
  const analysis = await DocumentAnalyzer.analyze(docxBuffer, 'DOCX');
  console.log(`✓ Document Analysis: Estimated Pages = ${analysis.pageCountEstimated}, Complexity = ${analysis.complexityScore}\n`);

  console.log('[3/5] Executing Universal Conversion via ConversionOrchestrator...');
  const result = await conversionOrchestrator.convert(
    docxBuffer,
    'Enterprise_88_Pages_Report.docx',
    'DOCX',
    'PDF',
    analysis
  );

  if (!result.success || !result.outputBuffer) {
    console.error('❌ Conversion failed:', result);
    process.exit(1);
  }
  console.log(`✓ Conversion Succeeded via [${result.converterEngine}] in ${result.durationMs}ms`);
  console.log(`✓ PDF Size: ${result.fileSize} bytes\n`);

  console.log('[4/5] Running PdfValidator on generated PDF...');
  const pdfValidation = await PdfValidator.validate(result.outputBuffer);
  console.log(`✓ PdfValidator: Valid = ${pdfValidation.isValid}, Output Page Count = ${pdfValidation.pageCount}\n`);

  console.log('[5/5] Running FidelityValidator Quality Gate...');
  const fidelityReport = FidelityValidator.evaluate(analysis, pdfValidation, 'PDF');
  console.log(`✓ Fidelity Gate Passed: ${fidelityReport.passed ? 'YES ✅' : 'NO ❌'}`);
  console.log(`✓ Source Estimated Pages: ${fidelityReport.sourceEstimatedPages}`);
  console.log(`✓ Output Rendered Pages:  ${fidelityReport.outputPageCount}`);
  console.log(`✓ Catastrophic Collapse:  ${fidelityReport.isCatastrophicCollapse ? 'YES ❌' : 'NO ✅'}`);
  console.log(`✓ Fidelity Score:         ${fidelityReport.fidelityScore} / 100\n`);

  // Acceptance Criteria Check
  let passed = true;
  if (pdfValidation.pageCount === 88) {
    console.log('  ✅ [PASS] Page Count exactly matches source document (88 pages).');
  } else if (pdfValidation.pageCount >= 85 && pdfValidation.pageCount <= 92) {
    console.log(`  ✅ [PASS] Page Count is within high-fidelity tolerance (${pdfValidation.pageCount} pages).`);
  } else {
    console.error(`  ❌ [FAIL] Catastrophic page collapse! Expected 88, got ${pdfValidation.pageCount}`);
    passed = false;
  }

  if (fidelityReport.passed && !fidelityReport.isCatastrophicCollapse) {
    console.log('  ✅ [PASS] Fidelity Quality Gate verified with zero catastrophic reflow.');
  } else {
    console.error('  ❌ [FAIL] Fidelity Quality Gate failed:', fidelityReport.failureReason);
    passed = false;
  }

  // Save artifact for inspection
  const outDir = path.join(__dirname, '../../test_output');
  fs.mkdirSync(outDir, { recursive: true });
  const outPdfPath = path.join(outDir, 'Enterprise_88_Pages_Report.pdf');
  fs.writeFileSync(outPdfPath, result.outputBuffer);
  console.log(`\n✓ Output PDF saved to: ${outPdfPath}`);

  if (passed) {
    console.log('\n======================================================================');
    console.log('🎉 88-PAGE LONG DOCUMENT FIDELITY QA TEST: 100% PASSED!');
    console.log('======================================================================');
  } else {
    console.error('\n❌ 88-PAGE TEST FAILED');
    process.exit(1);
  }
}

run88PageFidelityTest().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
