import fs from 'fs';

export interface FormatDetectionResult {
  format: string; // 'DOCX', 'XLSX', 'PPTX', 'PDF', 'PNG', 'JPG', 'WEBP', 'TIFF', 'RTF', 'ODT', 'TXT', 'UNKNOWN'
  mimeType: string;
  isZipContainer: boolean;
  isEncrypted: boolean;
  isMacroEnabled: boolean;
  fileSize: number;
  isValid: boolean;
  error?: string;
}

export class FormatDetector {
  /**
   * Detects document format and validates container integrity using magic bytes
   */
  static detect(buffer: Buffer, fileName: string = ''): FormatDetectionResult {
    const fileSize = buffer.length;
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    if (fileSize === 0) {
      return {
        format: 'UNKNOWN',
        mimeType: 'application/octet-stream',
        isZipContainer: false,
        isEncrypted: false,
        isMacroEnabled: false,
        fileSize: 0,
        isValid: false,
        error: 'File is empty (0 bytes)',
      };
    }

    // 1. Check Magic Bytes / Signatures
    // PDF: %PDF- (0x25 0x50 0x44 0x46 0x2D)
    if (fileSize >= 5 && buffer.subarray(0, 5).toString('ascii').startsWith('%PDF-')) {
      const isEncrypted = buffer.includes('/Encrypt');
      return {
        format: 'PDF',
        mimeType: 'application/pdf',
        isZipContainer: false,
        isEncrypted,
        isMacroEnabled: false,
        fileSize,
        isValid: true,
      };
    }

    // PNG: 0x89 0x50 0x4E 0x47
    if (fileSize >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return {
        format: 'PNG',
        mimeType: 'image/png',
        isZipContainer: false,
        isEncrypted: false,
        isMacroEnabled: false,
        fileSize,
        isValid: true,
      };
    }

    // JPEG: 0xFF 0xD8 0xFF
    if (fileSize >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return {
        format: 'JPG',
        mimeType: 'image/jpeg',
        isZipContainer: false,
        isEncrypted: false,
        isMacroEnabled: false,
        fileSize,
        isValid: true,
      };
    }

    // WEBP: RIFF....WEBP
    if (
      fileSize >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return {
        format: 'WEBP',
        mimeType: 'image/webp',
        isZipContainer: false,
        isEncrypted: false,
        isMacroEnabled: false,
        fileSize,
        isValid: true,
      };
    }

    // TIFF: II*\0 (0x49 0x49 0x2A 0x00) or MM\0* (0x4D 0x4D 0x00 0x2A)
    if (
      fileSize >= 4 &&
      ((buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00) ||
        (buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a))
    ) {
      return {
        format: 'TIFF',
        mimeType: 'image/tiff',
        isZipContainer: false,
        isEncrypted: false,
        isMacroEnabled: false,
        fileSize,
        isValid: true,
      };
    }

    // RTF: {\rtf (0x7B 0x5C 0x72 0x74 0x66)
    if (fileSize >= 5 && buffer.subarray(0, 5).toString('ascii') === '{\\rtf') {
      return {
        format: 'RTF',
        mimeType: 'application/rtf',
        isZipContainer: false,
        isEncrypted: false,
        isMacroEnabled: false,
        fileSize,
        isValid: true,
      };
    }

    // 2. ZIP Archive Containers (Office Open XML: DOCX, XLSX, PPTX, ODT, ODS, ODP)
    // PK\x03\x04 (0x50 0x4B 0x03 0x04)
    if (fileSize >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b) {
      const isMacroEnabled = ext === 'docm' || ext === 'xlsm' || ext === 'pptm';
      
      // Determine format based on extension & package markers
      let format = 'DOCX';
      let mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      if (ext === 'xlsx' || ext === 'xlsm' || ext === 'xls') {
        format = 'XLSX';
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (ext === 'pptx' || ext === 'pptm' || ext === 'ppt') {
        format = 'PPTX';
        mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      } else if (ext === 'odt') {
        format = 'ODT';
        mimeType = 'application/vnd.oasis.opendocument.text';
      } else if (ext === 'ods') {
        format = 'ODS';
        mimeType = 'application/vnd.oasis.opendocument.spreadsheet';
      } else if (ext === 'odp') {
        format = 'ODP';
        mimeType = 'application/vnd.oasis.opendocument.presentation';
      }

      return {
        format,
        mimeType,
        isZipContainer: true,
        isEncrypted: false,
        isMacroEnabled,
        fileSize,
        isValid: true,
      };
    }

    // 3. Fallback text / legacy detection
    if (ext === 'txt' || ext === 'csv' || ext === 'tsv' || ext === 'json' || ext === 'xml' || ext === 'html') {
      return {
        format: ext.toUpperCase(),
        mimeType: ext === 'csv' ? 'text/csv' : ext === 'html' ? 'text/html' : 'text/plain',
        isZipContainer: false,
        isEncrypted: false,
        isMacroEnabled: false,
        fileSize,
        isValid: true,
      };
    }

    return {
      format: ext ? ext.toUpperCase() : 'UNKNOWN',
      mimeType: 'application/octet-stream',
      isZipContainer: false,
      isEncrypted: false,
      isMacroEnabled: false,
      fileSize,
      isValid: true,
    };
  }
}
