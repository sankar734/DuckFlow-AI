import React from 'react';
import { Camera, Sparkles, FileCheck, ScanLine } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useUIStore } from '../../store/uiStore';

export const ScannerPage: React.FC = () => {
  const { openMobileScanner } = useUIStore();

  return (
    <div className="max-w-2xl mx-auto text-center space-y-6 py-8">
      <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center ring-8 ring-purple-50/50">
        <Camera className="w-8 h-8" />
      </div>

      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Mobile Document Scanner & OCR</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
          Use your device camera to capture physical receipts, invoices, agreements, and IDs. Automatic edge detection, color enhancement, and instant OCR text extraction.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-left space-y-4">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Scanner Capabilities
        </h3>
        <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2.5">
            <ScanLine className="w-4 h-4 text-purple-500" />
            <span>AI Automated perspective correction and boundary cropping</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Document cleaning filters (Magic Color, B&W, Crisp Grayscale)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <FileCheck className="w-4 h-4 text-purple-500" />
            <span>Multi-page collation directly into searchable PDF documents</span>
          </div>
        </div>
      </div>

      <Button
        variant="gradient"
        size="lg"
        leftIcon={<Camera className="w-5 h-5" />}
        onClick={openMobileScanner}
        className="w-full sm:w-auto px-8 shadow-glow"
      >
        Launch Camera Scanner
      </Button>
    </div>
  );
};
