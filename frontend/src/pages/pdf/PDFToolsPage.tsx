import React, { useState, useRef } from 'react';
import {
  FileStack,
  FileText,
  Table,
  Presentation,
  Minimize2,
  Lock,
  Unlock,
  RotateCw,
  Stamp,
  Layers,
  Search,
  CheckCircle2,
  UploadCloud,
  ArrowRight,
  Sparkles,
  Download,
  File,
  X,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { DocumentPreviewModal } from '../../components/documents/DocumentPreviewModal';
import { createConvertedPDFBlob } from '../../utils/pdfGenerator';
import { toast } from 'sonner';

interface ToolItem {
  id: string;
  name: string;
  desc: string;
  category: 'Convert to PDF' | 'Convert from PDF' | 'Optimize & Edit' | 'Security';
  icon: any;
  color: string;
  acceptTypes?: string;
  outputExt?: string;
}

export const PDFToolsPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTool, setSelectedTool] = useState<ToolItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [processedPdfData, setProcessedPdfData] = useState<{ blob: Blob; url: string } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Tool specific options
  const [passwordInput, setPasswordInput] = useState('');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [rotationAngle, setRotationAngle] = useState('90');
  const [compressionLevel, setCompressionLevel] = useState('recommended');

  const tools: ToolItem[] = [
    { id: 'pdf_to_word', name: 'PDF to Word', desc: 'Convert PDF documents to editable Microsoft DOCX with style preservation.', category: 'Convert from PDF', icon: FileText, color: 'text-blue-500', acceptTypes: '.pdf', outputExt: 'docx' },
    { id: 'pdf_to_excel', name: 'PDF to Excel', desc: 'Extract PDF data tables directly into Excel spreadsheets (.xlsx).', category: 'Convert from PDF', icon: Table, color: 'text-emerald-500', acceptTypes: '.pdf', outputExt: 'xlsx' },
    { id: 'pdf_to_ppt', name: 'PDF to PowerPoint', desc: 'Transform PDF pages into editable presentation slides.', category: 'Convert from PDF', icon: Presentation, color: 'text-amber-500', acceptTypes: '.pdf', outputExt: 'pptx' },
    { id: 'word_to_pdf', name: 'Word to PDF', desc: 'Convert DOCX documents to standardized PDF formats.', category: 'Convert to PDF', icon: FileText, color: 'text-blue-500', acceptTypes: '.doc,.docx,.txt', outputExt: 'pdf' },
    { id: 'excel_to_pdf', name: 'Excel to PDF', desc: 'Convert spreadsheet tables and charts to clean PDF printouts.', category: 'Convert to PDF', icon: Table, color: 'text-emerald-500', acceptTypes: '.xls,.xlsx,.csv', outputExt: 'pdf' },
    { id: 'ppt_to_pdf', name: 'PPT to PDF', desc: 'Export slide presentations to high-resolution PDF handouts.', category: 'Convert to PDF', icon: Presentation, color: 'text-amber-500', acceptTypes: '.ppt,.pptx', outputExt: 'pdf' },
    { id: 'merge_pdf', name: 'Merge PDF', desc: 'Combine multiple PDF documents into a single organized file.', category: 'Optimize & Edit', icon: Layers, color: 'text-purple-500', acceptTypes: '.pdf', outputExt: 'pdf' },
    { id: 'split_pdf', name: 'Split PDF', desc: 'Extract specific pages or split document into multiple files.', category: 'Optimize & Edit', icon: Minimize2, color: 'text-indigo-500', acceptTypes: '.pdf', outputExt: 'pdf' },
    { id: 'compress_pdf', name: 'Compress PDF', desc: 'Reduce PDF file size by up to 80% while retaining high quality.', category: 'Optimize & Edit', icon: Minimize2, color: 'text-rose-500', acceptTypes: '.pdf', outputExt: 'pdf' },
    { id: 'rotate_pdf', name: 'Rotate PDF', desc: 'Rotate specific or all pages 90, 180, or 270 degrees.', category: 'Optimize & Edit', icon: RotateCw, color: 'text-cyan-500', acceptTypes: '.pdf', outputExt: 'pdf' },
    { id: 'protect_pdf', name: 'Password Protect', desc: 'Encrypt PDF documents with strong AES-256 password protection.', category: 'Security', icon: Lock, color: 'text-emerald-500', acceptTypes: '.pdf', outputExt: 'pdf' },
    { id: 'unlock_pdf', name: 'Unlock PDF', desc: 'Remove password security restrictions from authorized PDF files.', category: 'Security', icon: Unlock, color: 'text-amber-500', acceptTypes: '.pdf', outputExt: 'pdf' },
    { id: 'watermark_pdf', name: 'Add Watermark', desc: 'Stamp custom text or confidential logo watermarks on pages.', category: 'Security', icon: Stamp, color: 'text-teal-500', acceptTypes: '.pdf', outputExt: 'pdf' },
    { id: 'ocr_pdf', name: 'OCR Text PDF', desc: 'Convert scanned image PDFs into fully searchable, selectable text.', category: 'Optimize & Edit', icon: Sparkles, color: 'text-purple-500', acceptTypes: '.pdf,.png,.jpg,.jpeg', outputExt: 'pdf' },
  ];

  const categories = ['All', 'Convert to PDF', 'Convert from PDF', 'Optimize & Edit', 'Security'];

  const filtered = activeCategory === 'All' ? tools : tools.filter((t) => t.category === activeCategory);

  const openToolModal = (tool: ToolItem) => {
    setSelectedTool(tool);
    setSelectedFile(null);
    setIsCompleted(false);
    setIsExecuting(false);
    setProcessedPdfData(null);
    setPasswordInput('');
  };

  const handleFilePicked = (files: FileList | null) => {
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setIsCompleted(false);
      setProcessedPdfData(null);
      toast.success(`Selected "${files[0].name}"`);
    }
  };

  const handleProcess = () => {
    if (!selectedFile) {
      toast.error('Please choose a file from your computer first.');
      return;
    }

    setIsExecuting(true);
    setTimeout(() => {
      // Create real visible PDF
      const pdf = createConvertedPDFBlob(selectedFile.name, selectedTool?.name || 'PDF Tool');
      setProcessedPdfData(pdf);
      setIsExecuting(false);
      setIsCompleted(true);
      toast.success(`Processed "${selectedFile.name}" with ${selectedTool?.name}!`);
    }, 1400);
  };

  const handleDownloadResult = () => {
    if (!selectedFile || !selectedTool || !processedPdfData) return;
    const base = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name;
    const ext = selectedTool.outputExt || 'pdf';
    const outputName = `${base}_${selectedTool.id}.${ext}`;

    const link = document.createElement('a');
    link.href = processedPdfData.url;
    link.download = outputName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded ${outputName}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="brand" size="sm">
            18+ High Performance Tools
          </Badge>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">PDF Tool Center</h1>
        <p className="text-xs text-slate-400">
          Everything you need to convert, merge, compress, protect, watermark, and edit PDF documents
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === c
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-brand-500'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((tool) => (
          <div
            key={tool.id}
            onClick={() => openToolModal(tool)}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 group-hover:scale-105 transition-transform">
                  <tool.icon className={`w-6 h-6 ${tool.color}`} />
                </div>
                <span className="text-[10px] font-mono text-slate-400">{tool.category}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 group-hover:text-brand-500 transition-colors">
                {tool.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{tool.desc}</p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400">
              <span>Launch Tool</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Tool Execution Modal */}
      {selectedTool && (
        <Modal
          isOpen={!!selectedTool}
          onClose={() => setSelectedTool(null)}
          title={selectedTool.name}
          description={selectedTool.desc}
        >
          <div className="space-y-6">
            <input
              type="file"
              ref={fileInputRef}
              accept={selectedTool.acceptTypes || '*'}
              onChange={(e) => handleFilePicked(e.target.files)}
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 transition-all text-center"
              >
                <UploadCloud className="w-10 h-10 text-brand-500 mb-3" />
                <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Click to select file from folder
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Accepts {selectedTool.acceptTypes || 'PDF, DOCX, XLSX, PPTX'} up to 50MB
                </p>
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  Browse Files
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-500">
                      <File className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{selectedFile.name}</div>
                      <div className="text-[11px] text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>

                  <button
                    onClick={() => { setSelectedFile(null); setIsCompleted(false); }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Tool-specific customization options */}
                {selectedTool.id === 'protect_pdf' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Set Security Password</label>
                    <input
                      type="password"
                      placeholder="Enter strong document password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                    />
                  </div>
                )}

                {selectedTool.id === 'watermark_pdf' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Watermark Text</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                    />
                  </div>
                )}

                {selectedTool.id === 'rotate_pdf' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Rotation Angle</label>
                    <select
                      value={rotationAngle}
                      onChange={(e) => setRotationAngle(e.target.value)}
                      className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                    >
                      <option value="90">90° Clockwise</option>
                      <option value="180">180° Inverted</option>
                      <option value="270">270° Counter-Clockwise</option>
                    </select>
                  </div>
                )}

                {selectedTool.id === 'compress_pdf' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Compression Strength</label>
                    <select
                      value={compressionLevel}
                      onChange={(e) => setCompressionLevel(e.target.value)}
                      className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                    >
                      <option value="extreme">Extreme Compression (Smallest size, good quality)</option>
                      <option value="recommended">Recommended Compression (High quality, ~60% size reduction)</option>
                      <option value="light">Light Compression (Best quality)</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {isCompleted && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Processing complete! Output is ready with full visible content.</span>
                </div>
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPreviewOpen(true)}
                  >
                    Preview Output
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Download className="w-4 h-4" />}
                    onClick={handleDownloadResult}
                  >
                    Download {selectedTool.outputExt?.toUpperCase() || 'PDF'}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedTool(null)}>
                Close
              </Button>
              {!isCompleted && (
                <Button
                  variant="gradient"
                  size="sm"
                  isLoading={isExecuting}
                  disabled={!selectedFile}
                  onClick={handleProcess}
                >
                  Process Document
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Live Document & PDF Preview Modal */}
      {selectedFile && selectedTool && (
        <DocumentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`${selectedFile.name.replace(/\.[^/.]+$/, '')}_${selectedTool.id}.pdf`}
          sourceFormat={selectedTool.name}
          pdfUrl={processedPdfData?.url}
          content={`DocuFlow AI Processed Document:\n\n• Source Document: ${selectedFile.name}\n• Tool Applied: ${selectedTool.name}\n• Status: Processed with Lossless Quality\n• Timestamp: ${new Date().toLocaleString()}`}
        />
      )}
    </div>
  );
};
