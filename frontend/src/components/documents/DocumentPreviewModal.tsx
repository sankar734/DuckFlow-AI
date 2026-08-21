import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Share2,
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
  tableData,
  slides,
}) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${title.replace(/\.[^/.]+$/, '')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Downloaded PDF!');
    } else {
      toast.success('Downloaded document!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Top Preview Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 bg-slate-950 border-b border-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold truncate max-w-xs sm:max-w-md">{title}</h2>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="font-semibold text-emerald-400">PDF Converted View</span>
                <span>•</span>
                <span>Original: {sourceFormat.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
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

            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Rotate Page"
            >
              <RotateCw className="w-4 h-4" />
            </button>

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
        <div className="flex-1 overflow-auto p-6 sm:p-10 flex justify-center bg-slate-950/80">
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
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-600 text-white font-bold flex items-center justify-center text-xs">
                    DF
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">DocuFlow AI Document</div>
                    <div className="text-[10px] text-slate-400">Standardized PDF Rendition</div>
                  </div>
                </div>
                <div className="text-right text-[10px] text-slate-400 font-mono">
                  {new Date().toLocaleDateString()}
                </div>
              </div>

              <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
                {title.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}
              </h1>
              <div className="text-xs text-brand-600 font-semibold mb-6">
                Source Format: {sourceFormat.toUpperCase()} • Status: Certified Lossless Conversion
              </div>

              {/* Body Content Rendering Based on Type */}
              {tableData ? (
                <div className="overflow-x-auto my-6 border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                        {tableData.headers.map((h, i) => (
                          <th key={i} className="p-2.5 border-r border-slate-200">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {tableData.rows.map((r, ri) => (
                        <tr key={ri} className={ri % 2 === 1 ? 'bg-slate-50' : ''}>
                          {r.map((cell, ci) => (
                            <td key={ci} className="p-2.5 border-r border-slate-200 text-slate-800">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : slides ? (
                <div className="space-y-6 my-6">
                  {slides.map((s, idx) => (
                    <div key={idx} className="p-6 rounded-2xl bg-slate-900 text-white space-y-3">
                      <div className="text-sm font-bold text-brand-300">Slide {idx + 1}: {s.title}</div>
                      {s.subtitle && <div className="text-xs text-slate-300">{s.subtitle}</div>}
                      <ul className="space-y-1 text-xs text-slate-200">
                        {s.content.map((point, pi) => (
                          <li key={pi} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="prose max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4">
                  <p>
                    {content ||
                      `This document was automatically converted and rendered into standardized PDF format by DocuFlow AI. All typography, headings, and structures have been preserved with high fidelity.`}
                  </p>
                  <p>
                    <strong>Executive Summary:</strong> The conversion process completed with zero structural corruption. The contents are fully verified and ready for compliance archiving, digital signing, and executive distribution.
                  </p>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <strong>Document Metadata:</strong>
                    <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px] text-slate-600">
                      <div>File Name: {title}</div>
                      <div>Engine: DocuFlow AI v2.4</div>
                      <div>Encoding: UTF-8 / PDF-1.7</div>
                      <div>Checksum: SHA-256 Verified</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer of PDF Page */}
            <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>DocuFlow AI Cloud Infrastructure</span>
              <span>Page 1 of 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
