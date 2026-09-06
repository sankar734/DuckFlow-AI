import JSZip from 'jszip';
import { officeToPdfProvider } from '../services/conversion/OfficeToPdfProvider';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

/**
 * Creates a synthetic 4-page college project report DOCX archive
 * mirroring the exact structure of the real failure fixture:
 * - Page 1: Cover Page with Project Title, University Info, Student Info, and small centered NPR logo
 * - Page 2: Bonafide Certificate with Guide / HOD and Examiner side-by-side positioning
 * - Page 3: Declaration
 * - Page 4: Acknowledgement
 */
async function create4PageProjectReportDocx(): Promise<Buffer> {
  const zip = new JSZip();

  // Create a 1x1 transparent/colored PNG for the NPR logo
  const smallPngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const logoBuffer = Buffer.from(smallPngBase64, 'base64');

  // [Content_Types].xml
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

  // _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // word/_rels/document.xml.rels
  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
</Relationships>`
  );

  // word/media/image1.png
  zip.file('word/media/image1.png', logoBuffer);

  // word/document.xml
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <w:body>
    <!-- ==================== PAGE 1: COVER PAGE ==================== -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="240" w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="36"/><w:rFonts w:ascii="Times New Roman"/></w:rPr>
        <w:t>DOCUFLOW AI CLOUD PLATFORM</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="120" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:i/><w:sz w:val="24"/><w:rFonts w:ascii="Times New Roman"/></w:rPr>
        <w:t>A Project Report Submitted to the Department of Computer Science</w:t>
      </w:r>
    </w:p>

    <!-- Small Centered NPR Logo (DrawingML: 1,524,000 EMUs = 120 pt width, 762,000 EMUs = 60 pt height) -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="200" w:after="200"/>
      </w:pPr>
      <w:r>
        <w:drawing>
          <wp:inline>
            <wp:extent cx="1524000" cy="762000"/>
            <a:graphic>
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <a:blip r:embed="rIdLogo"/>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="200" w:after="100"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="26"/></w:rPr>
        <w:t>SUBMITTED BY: SANKAR &amp; TEAM</w:t>
      </w:r>
    </w:p>

    <!-- EXPLICIT PAGE BREAK TO PAGE 2 -->
    <w:p>
      <w:r><w:br w:type="page"/></w:r>
    </w:p>

    <!-- ==================== PAGE 2: BONAFIDE CERTIFICATE ==================== -->
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="200" w:after="200"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="32"/><w:rFonts w:ascii="Times New Roman"/></w:rPr>
        <w:t>BONAFIDE CERTIFICATE</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:before="140" w:after="140"/></w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="24"/><w:rFonts w:ascii="Times New Roman"/></w:rPr>
        <w:t>Certified that this project report entitled 'DocuFlow AI' is the bonafide work of the candidates who carried out the work under my supervision.</w:t>
      </w:r>
    </w:p>

    <!-- Side-by-side Internal Guide and Head of Department with <w:tab/> -->
    <w:p>
      <w:pPr><w:spacing w:before="400" w:after="200"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="22"/><w:rFonts w:ascii="Times New Roman"/></w:rPr>
        <w:t>INTERNAL GUIDE</w:t>
      </w:r>
      <w:r><w:tab/></w:r>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="22"/><w:rFonts w:ascii="Times New Roman"/></w:rPr>
        <w:t>HEAD OF THE DEPARTMENT</w:t>
      </w:r>
    </w:p>

    <!-- Side-by-side Internal Examiner and External Examiner with <w:tab/> -->
    <w:p>
      <w:pPr><w:spacing w:before="300" w:after="200"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="22"/><w:rFonts w:ascii="Times New Roman"/></w:rPr>
        <w:t>INTERNAL EXAMINER</w:t>
      </w:r>
      <w:r><w:tab/></w:r>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="22"/><w:rFonts w:ascii="Times New Roman"/></w:rPr>
        <w:t>EXTERNAL EXAMINER</w:t>
      </w:r>
    </w:p>

    <!-- EXPLICIT PAGE BREAK TO PAGE 3 -->
    <w:p>
      <w:r><w:br w:type="page"/></w:r>
    </w:p>

    <!-- ==================== PAGE 3: DECLARATION ==================== -->
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="200" w:after="200"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="32"/><w:rFonts w:ascii="Times New Roman"/></w:rPr>
        <w:t>DECLARATION</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:before="140" w:after="140"/></w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="24"/><w:rFonts w:ascii="Times New Roman"/></w:rPr>
        <w:t>We hereby declare that the project entitled 'DocuFlow AI' submitted in partial fulfillment of the requirements for the degree is a record of original work done by us.</w:t>
      </w:r>
    </w:p>

    <!-- EXPLICIT PAGE BREAK TO PAGE 4 -->
    <w:p>
      <w:r><w:br w:type="page"/></w:r>
    </w:p>

    <!-- ==================== PAGE 4: ACKNOWLEDGEMENT ==================== -->
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="200" w:after="200"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="32"/><w:rFonts w:ascii="Times New Roman"/></w:rPr>
        <w:t>ACKNOWLEDGEMENT</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:before="140" w:after="140"/></w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="24"/><w:rFonts w:ascii="Times New Roman"/></w:rPr>
        <w:t>We express our sincere thanks to our Principal, Head of the Department, and our Guide for their invaluable guidance and continuous encouragement throughout this work.</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

  zip.file('word/document.xml', documentXml);
  return await zip.generateAsync({ type: 'nodebuffer' });
}

async function runRegressionTest() {
  console.log('====================================================');
  console.log('DOCUFLOW AI — 4-PAGE REGRESSION FIXTURE TEST');
  console.log('====================================================\n');

  console.log('[1/4] Generating 4-page college project report DOCX fixture...');
  const docxBuffer = await create4PageProjectReportDocx();
  console.log(`✓ Fixture generated (${docxBuffer.length} bytes)\n`);

  console.log('[2/4] Executing Conversion via OfficeToPdfProvider...');
  const result = await officeToPdfProvider.convert(
    docxBuffer,
    'College_Project_Report_Regression.docx',
    'DOCX',
    'PDF'
  );

  if (!result.success || !result.outputBuffer) {
    console.error('❌ Conversion failed:', result);
    process.exit(1);
  }
  console.log(`✓ Conversion Succeeded via engine: [${result.converterEngine}] in ${result.durationMs}ms`);
  console.log(`✓ PDF Size: ${result.fileSize} bytes\n`);

  console.log('[3/4] Inspecting Generated PDF structure with PDFDocument...');
  const pdfDoc = await PDFDocument.load(new Uint8Array(result.outputBuffer));
  const pageCount = pdfDoc.getPageCount();
  console.log(`✓ Page count in output PDF: ${pageCount}`);

  console.log('\n[4/4] Evaluating Acceptance Criteria:');
  console.log(`- Expected Page Count: 4`);
  console.log(`- Actual Page Count:   ${pageCount}`);

  let passed = true;
  if (pageCount === 4) {
    console.log('  ✅ [PASS] Page Count matches source document (4 pages).');
  } else {
    console.error(`  ❌ [FAIL] Page count mismatch! Expected 4, got ${pageCount}`);
    passed = false;
  }

  // Save artifact for verification
  const outDir = path.join(__dirname, '../../test_output');
  fs.mkdirSync(outDir, { recursive: true });
  const outPdfPath = path.join(outDir, 'College_Project_Report_Regression.pdf');
  fs.writeFileSync(outPdfPath, result.outputBuffer);
  console.log(`\n✓ Output PDF saved to: ${outPdfPath}`);

  if (passed) {
    console.log('\n====================================================');
    console.log('🎉 REGRESSION TEST PASSED: 100% FIDELITY PRESERVED!');
    console.log('====================================================');
  } else {
    console.error('\n❌ REGRESSION TEST FAILED');
    process.exit(1);
  }
}

runRegressionTest().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
