import React from 'react';
import {
  Camera,
  Sparkles,
  FileCheck,
  ScanLine,
  Layers,
  Upload,
  Zap,
  ArrowRight,
  ShieldCheck,
  FileText,
  Receipt,
  CreditCard,
  ScrollText,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useUIStore } from '../../store/uiStore';
import { Badge } from '../../components/common/Badge';

export const ScannerPage: React.FC = () => {
  const { openMobileScanner } = useUIStore();

  const scanPresets = [
    {
      id: 'invoice',
      icon: <Receipt className="w-5 h-5 text-emerald-500" />,
      title: 'Tax Invoices & Receipts',
      desc: 'Automatic vendor, amount, and date field extraction into structured tables.',
      badge: 'Financial',
    },
    {
      id: 'contract',
      icon: <ScrollText className="w-5 h-5 text-blue-500" />,
      title: 'Contracts & Legal Forms',
      desc: 'Multi-page collation with text sharpening and signature boundary preservation.',
      badge: 'Legal',
    },
    {
      id: 'id',
      icon: <CreditCard className="w-5 h-5 text-purple-500" />,
      title: 'ID Cards & Badges',
      desc: 'Double-sided alignment and high contrast shadow reduction for crisp ID cards.',
      badge: 'Identity',
    },
    {
      id: 'notes',
      icon: <FileText className="w-5 h-5 text-amber-500" />,
      title: 'Handwritten Notes & Whiteboards',
      desc: 'Magic color filter enhances pen strokes and cleans background noise.',
      badge: 'Notes',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          AI Document Camera & OCR v3.2
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Smart Mobile Document Scanner
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Capture high-resolution documents using your camera or webcam. Enjoy automatic edge alignment, perspective un-skewing, real-time filters, and instant OCR text extraction.
        </p>

        {/* Primary CTA */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="gradient"
            size="lg"
            leftIcon={<Camera className="w-5 h-5" />}
            onClick={() => openMobileScanner()}
            className="px-8 shadow-glow"
          >
            Launch Camera Scanner
          </Button>
        </div>
      </div>

      {/* Feature / Document Presets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {scanPresets.map((preset, idx) => (
          <div
            key={idx}
            onClick={() => openMobileScanner(preset.id)}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 dark:hover:border-purple-500/50 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:scale-105 transition-transform">
                {preset.icon}
              </div>
              <Badge variant="slate" size="sm">
                {preset.badge}
              </Badge>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 group-hover:text-purple-400 transition-colors">
                {preset.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {preset.desc}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Scan now</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* Technical Highlights */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold">Privacy & Edge Processing Guarantee</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Camera video streams and snapshots are processed in real-time via hardware-accelerated canvas filters directly on your device. Zero sensitive camera frames are logged without your consent.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <ScanLine className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Sub-millisecond edge detection</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Layers className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Multi-page batch PDF builder</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Zap className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Instant clipboard OCR copy</span>
          </div>
        </div>
      </div>
    </div>
  );
};
