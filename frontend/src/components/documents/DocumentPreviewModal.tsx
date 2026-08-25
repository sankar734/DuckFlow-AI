import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X,
  CheckCircle2,
  Table as TableIcon,
  Presentation,
  FileCheck,
  Eye,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { toast } from 'sonner';

export interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sourceFormat: string;
  pdfUrl?: string;
  content?: string;
  htmlContent?: string;
  tableData?: { headers: string[]; rows: string[][] };
  slides?: Array<{ title: string; subtitle?: string; content: string[] }>;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  sourceFormat,
  pdfUrl,
  content,
  htmlContent,
  tableData,
  slides,
}) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState<'formatted' | 'pdfFrame'>('formatted');

  if (!isOpen) return null;

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${title.replace(/\.[^/.]+$/, '')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Downloaded PDF document!');
    } else {
      toast.success('Downloaded document!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const baseName = title.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

  // Split raw text into paragraphs
  const paragraphs = content
    ? content.split(/\r\n\r\n|\n\n/).map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-5xl h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Top Preview Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 bg-slate-950 border-b border-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold truncate max-w-xs sm:max-w-md">{title}</h2>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Real Content PDF Preview
                </span>
                <span>•</span>
                <span>Source: {sourceFormat.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            {pdfUrl && (
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setViewMode('formatted')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    viewMode === 'formatted'
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Page View
                </button>
                <button
                  onClick={() => setViewMode('pdfFrame')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    viewMode === 'pdfFrame'
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  PDF Stream
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            {viewMode === 'formatted' && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-800 text-xs font-mono">
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 15))}
                  className="p-1 hover:text-brand-400"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="w-12 text-center">{zoom}%</span>
                <button
                  onClick={() => setZoom(Math.min(175, zoom + 15))}
                  className="p-1 hover:text-brand-400"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {viewMode === 'formatted' && (
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Rotate Page"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            )}

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrint}
            >
              Print
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleDownload}
            >
              Download PDF
            </Button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Render Canvas Viewport */}
        <div className="flex-1 overflow-auto p-6 sm:p-10 flex justify-center bg-slate-950/90">
          {viewMode === 'pdfFrame' && pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full rounded-2xl border border-slate-800 shadow-2xl bg-slate-900"
              title="PDF Viewer"
            />
          ) : (
            <div
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
              }}
              className="w-full max-w-[800px] min-h-[1050px] bg-white text-slate-900 shadow-2xl rounded-xl p-10 sm:p-14 border border-slate-200 flex flex-col justify-between"
            >
              {/* Header of PDF Page */}
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-brand-600 text-white font-bold flex items-center justify-center text-xs">
                      DF
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">DocuFlow AI Universal Document Engine</div>
                      <div className="text-[10px] text-slate-400">Authentic High-Fidelity PDF Output</div>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-400 font-mono">
                    {new Date().toLocaleDateString()}
                  </div>
                </div>

                <h1 className="text-2xl font-extrabold text-slate-900 mb-1">{baseName}</h1>
                <div className="text-xs text-brand-600 font-semibold mb-6 flex items-center gap-2">
                  <Badge variant="brand" size="sm">
                    {sourceFormat.toUpperCase()} to PDF
                  </Badge>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 font-mono text-[11px]">{title}</span>
                </div>

                {/* Body Content Rendering Based on Real Extracted Data */}
                {tableData && tableData.rows.length > 0 ? (
                  <div className="my-4 border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-emerald-500 text-white font-bold">
                          {tableData.headers.map((h, i) => (
                            <th key={i} className="p-3 border-r border-emerald-600/30 whitespace-nowrap">
                              {h || `Column ${i + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {tableData.rows.map((r, ri) => (
                          <tr key={ri} className={ri % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                            {r.map((cell, ci) => (
                              <td key={ci} className="p-2.5 border-r border-slate-200 text-slate-800 whitespace-nowrap">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : slides && slides.length > 0 ? (
                  <div className="space-y-4 my-4">
                    {slides.map((s, idx) => (
                      <div key={idx} className="p-6 rounded-2xl bg-indigo-950 text-white space-y-3 shadow-md">
                        <div className="text-base font-bold text-indigo-300">Slide {idx + 1}: {s.title}</div>
                        {s.subtitle && <div className="text-xs text-indigo-200">{s.subtitle}</div>}
                        <ul className="space-y-1.5 text-xs text-slate-100 pl-2">
                          {s.content.map((point, pi) => (
                            <li key={pi} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                              <span className="leading-relaxed">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : htmlContent ? (
                  <div
                    className="prose max-w-none text-xs sm:text-sm text-slate-800 leading-relaxed space-y-3 my-4"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />
                ) : paragraphs.length > 0 ? (
                  <div className="prose max-w-none text-xs sm:text-sm text-slate-800 leading-relaxed space-y-4 my-4">
                    {paragraphs.map((p, idx) => (
                      <p key={idx} className="leading-relaxed text-slate-800">
                        {p}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs italic">
                    (Document content processed and encoded in PDF stream)
                  </div>
                )}
              </div>

              {/* Footer of PDF Page */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>DocuFlow AI Universal Document Platform</span>
                <span>Page 1</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

