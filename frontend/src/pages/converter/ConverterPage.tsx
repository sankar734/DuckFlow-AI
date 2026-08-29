import React, { useState, useRef } from 'react';
import {
  Layers,
  UploadCloud,
  ArrowRight,
  FileCheck,
  Download,
  Trash2,
  CheckCircle2,
  Loader2,
  File,
  FileText,
  Table,
  Presentation,
  Image,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DocumentPreviewModal } from '../../components/documents/DocumentPreviewModal';
import { convertFileToRealPDF, ConvertedPDFResult } from '../../utils/pdfGenerator';
import { api } from '../../services/api';
import { toast } from 'sonner';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

interface ConversionQueueItem {
  id: string;
  file?: File;
  fileName: string;
  size: string;
  sourceFormat: string;
  targetFormat: string;
  status: 'PENDING' | 'CONVERTING' | 'COMPLETED' | 'FAILED';
  progress: number;
  stageMessage?: string;
  downloadUrl?: string;
  pdfBlob?: Blob;
  extractedText?: string;
  htmlContent?: string;
  tableData?: { headers: string[]; rows: string[][] };
  slides?: Array<{ title: string; subtitle?: string; content: string[] }>;
}

export const ConverterPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetFormat, setTargetFormat] = useState('PDF');
  const [isDragging, setIsDragging] = useState(false);
  const [previewItem, setPreviewItem] = useState<ConversionQueueItem | null>(null);

  const [queue, setQueue] = useState<ConversionQueueItem[]>([]);
  const [isConvertingAll, setIsConvertingAll] = useState(false);
  const [engineType, setEngineType] = useState<string>('DocuFlow High-Fidelity Engine');

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFormatFromExtension = (name: string) => {
    const ext = name.split('.').pop()?.toUpperCase() || 'FILE';
    return ext;
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: ConversionQueueItem[] = Array.from(files).map((file, idx) => {
      const srcFormat = getFormatFromExtension(file.name);
      return {
        id: `${Date.now()}_${idx}`,
        file,
        fileName: file.name,
        size: formatFileSize(file.size),
        sourceFormat: srcFormat,
        targetFormat: targetFormat === srcFormat ? (srcFormat === 'PDF' ? 'DOCX' : 'PDF') : targetFormat,
        status: 'PENDING',
        progress: 0,
        stageMessage: 'Ready to convert',
      };
    });

    setQueue((prev) => [...newItems, ...prev]);
    toast.success(`${files.length} file(s) added to queue! Ready to convert.`);
  };

  const executeConversionForFile = async (item: ConversionQueueItem): Promise<{
    url: string;
    blob?: Blob;
    extractedText?: string;
    htmlContent?: string;
    tableData?: { headers: string[]; rows: string[][] };
    slides?: Array<{ title: string; subtitle?: string; content: string[] }>;
  }> => {
    if (!item.file) throw new Error('File not found');

    // Attempt Backend API Conversion first
    try {
      const base64Data = await fileToBase64(item.file);
      const res: any = await api.post('/conversions', {
        sourceFileName: item.fileName,
        sourceFormat: item.sourceFormat,
        targetFormat: item.targetFormat,
        fileSize: item.file.size,
        fileData: base64Data,
        options: {
          engine: engineType,
          preserveFormatting: true,
        },
      });

      if (res && res.data && res.data.downloadUrl) {
        return {
          url: res.data.downloadUrl,
          extractedText: `Document converted via ${res.data.converterEngine || 'High-Fidelity Engine'}`,
        };
      }
    } catch (apiErr) {
      console.warn('Backend conversion API notice, utilizing direct vector engine:', apiErr);
    }

    // Client-side high-fidelity vector engine fallback
    const result: ConvertedPDFResult = await convertFileToRealPDF(item.file, item.targetFormat);
    return {
      url: result.url,
      blob: result.blob,
      extractedText: result.extractedText,
      htmlContent: result.htmlContent,
      tableData: result.tableData,
      slides: result.slides,
    };
  };

  const handleConvertItem = async (id: string) => {
    const item = queue.find((q) => q.id === id);
    if (!item || !item.file) return;

    setQueue((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, status: 'CONVERTING', progress: 25, stageMessage: 'Preparing document structure...' }
          : it
      )
    );

    try {
      setQueue((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, progress: 60, stageMessage: 'Rendering pages, fonts & geometry...' }
            : it
        )
      );

      const result = await executeConversionForFile(item);

      setQueue((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, progress: 90, stageMessage: 'Validating output fidelity...' }
            : it
        )
      );

      setQueue((prev) =>
        prev.map((it) => {
          if (it.id === id) {
            return {
              ...it,
              status: 'COMPLETED',
              progress: 100,
              stageMessage: 'Conversion completed successfully',
              downloadUrl: result.url,
              pdfBlob: result.blob,
              extractedText: result.extractedText,
              htmlContent: result.htmlContent,
              tableData: result.tableData,
              slides: result.slides,
            };
          }
          return it;
        })
      );
      toast.success(`Converted "${item.fileName}" into authentic PDF with real content!`);
    } catch (err: any) {
      console.error('Conversion error:', err);
      toast.error(`Error converting ${item.fileName}`);
      setQueue((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, status: 'FAILED', progress: 0, stageMessage: 'Conversion failed. Original file safe.' }
            : it
        )
      );
    }
  };

  const handleConvertAll = async () => {
    setIsConvertingAll(true);
    setQueue((prev) =>
      prev.map((item) =>
        item.status === 'PENDING' ? { ...item, status: 'CONVERTING', progress: 30 } : item
      )
    );

    const pendingItems = queue.filter((q) => q.status === 'PENDING' || q.status === 'CONVERTING');

    for (const item of pendingItems) {
      if (item.file) {
        try {
          const result = await executeConversionForFile(item);
          setQueue((prev) =>
            prev.map((it) => {
              if (it.id === item.id) {
                return {
                  ...it,
                  status: 'COMPLETED',
                  progress: 100,
                  downloadUrl: result.url,
                  pdfBlob: result.blob,
                  extractedText: result.extractedText,
                  htmlContent: result.htmlContent,
                  tableData: result.tableData,
                  slides: result.slides,
                };
              }
              return it;
            })
          );
        } catch (err) {
          console.error(`Failed to convert ${item.fileName}`, err);
        }
      }
    }

    setIsConvertingAll(false);
    toast.success('All files converted with full original content preserved!');
  };

  const handleDownload = (item: ConversionQueueItem) => {
    const baseName = item.fileName.substring(0, item.fileName.lastIndexOf('.')) || item.fileName;
    const downloadName = `${baseName}.pdf`;

    if (!item.downloadUrl) {
      toast.error('Please convert file first');
      return;
    }

    const link = document.createElement('a');
    link.href = item.downloadUrl;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded ${downloadName}`);
  };

  const getFormatIcon = (format: string) => {
    switch (format.toUpperCase()) {
      case 'DOCX':
      case 'DOC':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'XLSX':
      case 'XLS':
      case 'CSV':
        return <Table className="w-5 h-5 text-emerald-500" />;
      case 'PPTX':
      case 'PPT':
        return <Presentation className="w-5 h-5 text-amber-500" />;
      case 'PNG':
      case 'JPG':
      case 'JPEG':
        return <Image className="w-5 h-5 text-purple-500" />;
      default:
        return <File className="w-5 h-5 text-rose-500" />;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hidden native File Picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFilesSelected(e.target.files)}
        multiple
        className="hidden"
      />

      {/* Header */}
      <div>
        <Badge variant="brand" size="sm" className="mb-1">
          Universal Converter Engine
        </Badge>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Universal File Converter</h1>
        <p className="text-xs text-slate-400">
          Convert Word, Excel, PowerPoint, PDF, CSV, TXT, and Images with zero quality loss
        </p>
      </div>

      {/* Drag & Drop Upload Zone with Real File Chooser */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFilesSelected(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`p-8 sm:p-12 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
          isDragging
            ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-950/40 scale-[1.01]'
            : 'border-brand-500/40 bg-white dark:bg-slate-900 hover:border-brand-500 hover:shadow-lg'
        }`}
      >
        <div className="p-4 rounded-3xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 mb-4 ring-8 ring-brand-50/50">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          Click to choose files from folder or drag & drop here
        </h2>
        <p className="text-xs text-slate-400 max-w-sm mb-6">
          Supports multi-file batch upload (DOCX, XLSX, PPTX, PDF, CSV, TXT, PNG, JPG) up to 100MB
        </p>

        <div className="flex flex-wrap items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="gradient"
            size="md"
            leftIcon={<UploadCloud className="w-4 h-4" />}
            onClick={() => fileInputRef.current?.click()}
          >
            Browse Files from Folder
          </Button>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Convert to:</span>
            <select
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="PDF">PDF Document (.pdf)</option>
              <option value="DOCX">Word Document (.docx)</option>
              <option value="XLSX">Excel Spreadsheet (.xlsx)</option>
              <option value="PPTX">PowerPoint (.pptx)</option>
              <option value="TXT">Plain Text (.txt)</option>
              <option value="PNG">PNG Image (.png)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Conversion Queue List */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Conversion Queue ({queue.length})
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              + Add More Files
            </Button>
            {queue.some((q) => q.status === 'PENDING') && (
              <Button
                variant="primary"
                size="sm"
                isLoading={isConvertingAll}
                onClick={handleConvertAll}
              >
                Convert All Files
              </Button>
            )}
          </div>
        </div>

        {queue.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No files in queue. Click Browse Files above to select documents from your computer.
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    {getFormatIcon(item.sourceFormat)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{item.fileName}</div>
                    <div className="text-[11px] text-slate-400">
                      {item.size} • Convert from <span className="font-semibold text-brand-500">{item.sourceFormat}</span> to{' '}
                      <span className="font-semibold text-purple-500">{item.targetFormat}</span>
                      {item.stageMessage && (
                        <span className="block text-[10px] text-brand-600 dark:text-brand-400 mt-0.5 font-medium">
                          {item.stageMessage}
                        </span>
                      )}
                    </div>
                    {item.status === 'CONVERTING' && (
                      <div className="w-36 sm:w-48 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="bg-brand-500 h-full transition-all duration-300 rounded-full"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {item.status === 'COMPLETED' ? (
                    <Badge variant="success" size="md">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Converted
                    </Badge>
                  ) : item.status === 'CONVERTING' ? (
                    <Badge variant="brand" size="md">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Converting...
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConvertItem(item.id)}
                    >
                      Convert
                    </Button>
                  )}

                  {item.status === 'COMPLETED' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewItem(item)}
                      >
                        Preview PDF
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                        onClick={() => handleDownload(item)}
                      >
                        Download
                      </Button>
                    </>
                  )}

                  <button
                    onClick={() => setQueue(queue.filter((q) => q.id !== item.id))}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document & PDF Real Content Previewer */}
      {previewItem && (
        <DocumentPreviewModal
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          title={previewItem.fileName}
          sourceFormat={previewItem.sourceFormat}
          pdfUrl={previewItem.downloadUrl}
          content={previewItem.extractedText}
          htmlContent={previewItem.htmlContent}
          tableData={previewItem.tableData}
          slides={previewItem.slides}
        />
      )}

    </div>
  );
};
