import React, { useState, useRef } from 'react';
import {
  Presentation,
  Plus,
  Trash2,
  Play,
  Sparkles,
  Download,
  Image as ImageIcon,
  Layout,
  Upload,
  Save,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Palette,
  Layers,
  Copy,
  Maximize2,
  Minimize2,
  FilePlus,
  Printer,
  Shapes,
  Type,
  X,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { exportSlidesToPDF } from '../../utils/pdfGenerator';
import { parsePowerPoint } from '../../utils/documentParsers';
import { uploadToGoogleDrive } from '../../utils/googleDriveSync';
import { toast } from 'sonner';

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  theme: 'slate' | 'indigo' | 'emerald' | 'amber' | 'crimson';
  imageUrl?: string;
  speakerNotes?: string;
}

export const PowerPointBuilder: React.FC<{ initialDocName?: string }> = ({
  initialDocName = 'Strategy_Presentation_2026.pptx',
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pptFileInputRef = useRef<HTMLInputElement>(null);
  const [docName, setDocName] = useState(initialDocName);
  const [activeRibbonTab, setActiveRibbonTab] = useState<'home' | 'insert' | 'design' | 'slideshow' | 'ai'>('home');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isPlayingShow, setIsPlayingShow] = useState(false);
  const [showAIDeckModal, setShowAIDeckModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  // Initial Slides
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: 's_1',
      title: 'DocuFlow AI Enterprise Suite',
      subtitle: 'Next-Generation Document Creation, Conversion & AI Orchestration',
      bullets: [
        'Unified SaaS architecture for Word, Excel, PowerPoint & PDF workflows',
        'Lossless cross-format transformations with sub-second latency',
        'AI Ghostwriter and Real-Time Spreadsheet Analytics',
      ],
      theme: 'indigo',
      speakerNotes: 'Welcome stakeholders and introduce our core product pillars.',
    },
    {
      id: 's_2',
      title: 'Market Opportunity & Growth',
      subtitle: 'Capturing the $32B Global SaaS Document Market',
      bullets: [
        'Over 85% of modern workforces use fragmented document software',
        'DocuFlow consolidates authoring, conversion, OCR, and AI into one hub',
        'Projected 350% Year-over-Year revenue expansion',
      ],
      theme: 'emerald',
      speakerNotes: 'Highlight competitive advantages against legacy standalone software.',
    },
    {
      id: 's_3',
      title: 'Platform Architecture & Security',
      subtitle: 'Zero-Trust Cloud Governance & Multi-Region Resilience',
      bullets: [
        'End-to-end AES-256 document payload encryption',
        'Client-side instant PDF compilation using Canvas vector pipelines',
        '99.99% High Availability SLA with automated regional failover',
      ],
      theme: 'slate',
      speakerNotes: 'Address enterprise compliance standards and data isolation.',
    },
  ]);

  const activeSlide = slides[activeSlideIndex] || slides[0];

  const handleUpdateSlide = (updatedFields: Partial<Slide>) => {
    const updated = slides.map((s, i) => (i === activeSlideIndex ? { ...s, ...updatedFields } : s));
    setSlides(updated);
    setIsSaved(false);
  };

  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: `s_${Date.now()}`,
      title: 'New Presentation Slide',
      subtitle: 'Add subtitle or key message here',
      bullets: ['Enter bullet point item 1', 'Enter bullet point item 2'],
      theme: 'indigo',
    };
    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
    setIsSaved(false);
    toast.success('Added new slide');
  };

  const handleDuplicateSlide = (idx: number) => {
    const target = slides[idx];
    const copy: Slide = { ...target, id: `s_${Date.now()}`, title: `${target.title} (Copy)` };
    const updated = [...slides.slice(0, idx + 1), copy, ...slides.slice(idx + 1)];
    setSlides(updated);
    setActiveSlideIndex(idx + 1);
    setIsSaved(false);
    toast.success('Slide duplicated');
  };

  const handleDeleteSlide = (idx: number) => {
    if (slides.length <= 1) return;
    const updated = slides.filter((_, i) => i !== idx);
    setSlides(updated);
    setActiveSlideIndex(Math.max(0, idx - 1));
    setIsSaved(false);
    toast.info('Slide deleted');
  };

  const handleAddImage = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      handleUpdateSlide({ imageUrl: e.target?.result as string });
      toast.success('Image added to active slide!');
    };
    reader.readAsDataURL(file);
  };

  const handleImportPPT = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      toast.info(`Parsing ${file.name}...`);
      const parsedSlides = await parsePowerPoint(file);
      setSlides(parsedSlides);
      setActiveSlideIndex(0);
      setDocName(file.name);
      setIsSaved(true);
      toast.success(`Imported presentation "${file.name}" with ${parsedSlides.length} slides!`);
    } catch (err: any) {
      console.error('PPT import error:', err);
      toast.error(`Failed to import PPT: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleGenerateAIDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt) return;
    setIsGenerating(true);
    setTimeout(() => {
      const generatedSlides: Slide[] = [
        {
          id: `ai_${Date.now()}_1`,
          title: aiPrompt,
          subtitle: 'Executive Presentation generated by DocuFlow AI Copilot',
          bullets: [
            'Comprehensive strategic briefing and operational execution plan',
            'Cross-functional milestone alignment across engineering and marketing',
            'Risk mitigation strategies and measurable ROI deliverables',
          ],
          theme: 'indigo',
        },
        {
          id: `ai_${Date.now()}_2`,
          title: 'Key Objectives & Timeline',
          subtitle: 'Q1 - Q4 Strategic Roadmap',
          bullets: [
            'Phase 1: Architecture stabilization and beta launch',
            'Phase 2: Enterprise customer onboarding and SLA monitoring',
            'Phase 3: Global expansion and partner ecosystem integration',
          ],
          theme: 'emerald',
        },
      ];
      setSlides([...slides, ...generatedSlides]);
      setIsGenerating(false);
      setShowAIDeckModal(false);
      setAiPrompt('');
      setIsSaved(true);
      toast.success('Generated presentation slides with AI!');
    }, 1500);
  };

  // Color Theme Palettes
  const themeStyles = {
    slate: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white',
    indigo: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white',
    emerald: 'bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 text-white',
    amber: 'bg-gradient-to-br from-slate-900 via-amber-950 to-slate-950 text-white',
    crimson: 'bg-gradient-to-br from-slate-900 via-rose-950 to-slate-950 text-white',
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] rounded-3xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
      {/* Hidden Image Picker */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        onChange={(e) => handleAddImage(e.target.files)}
        className="hidden"
      />

      {/* Hidden PPT File Picker */}
      <input
        type="file"
        ref={pptFileInputRef}
        accept=".pptx,.ppt"
        onChange={(e) => handleImportPPT(e.target.files)}
        className="hidden"
      />

      {/* MS PowerPoint Top Bar */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2 bg-[#d24726] dark:bg-[#a13217] text-white shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1 rounded bg-white/10 flex items-center justify-center font-bold text-xs">
            <Presentation className="w-4 h-4 text-white" />
          </div>
          <input
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            className="text-xs sm:text-sm font-bold bg-transparent border-b border-transparent hover:border-white/40 focus:border-white focus:outline-none px-1 text-white truncate max-w-[160px] sm:max-w-xs"
          />
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/90">
            <FileCheck className="w-3 h-3 text-emerald-200" />
            {isSaved ? 'Saved to Cloud' : 'Unsaved edits'}
          </span>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddSlide}
            className="text-white hover:bg-white/10 text-xs px-2 sm:px-3"
            leftIcon={<FilePlus className="w-3.5 h-3.5" />}
          >
            <span className="hidden sm:inline">New Slide</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => pptFileInputRef.current?.click()}
            className="text-white hover:bg-white/10 text-xs px-2 sm:px-3"
            leftIcon={<Upload className="w-3.5 h-3.5" />}
          >
            <span className="hidden sm:inline">Import PPT</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              const pptContent = JSON.stringify(slides);
              await uploadToGoogleDrive(docName, pptContent, 'application/vnd.google-apps.presentation');
            }}
            className="text-white hover:bg-white/10 text-xs px-2 sm:px-3"
            leftIcon={<Upload className="w-3.5 h-3.5 text-blue-200" />}
          >
            <span className="hidden sm:inline">Drive Sync</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPlayingShow(true)}
            className="text-white hover:bg-white/10 text-xs px-2 sm:px-3 bg-white/10"
            leftIcon={<Play className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />}
          >
            <span>Present</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              exportSlidesToPDF(
                slides.map((s) => ({ title: s.title, subtitle: s.subtitle, content: s.bullets })),
                docName
              );
              toast.success('Downloaded presentation as PDF!');
            }}
            className="text-white hover:bg-white/10 text-xs px-2 sm:px-3 bg-white/10"
            leftIcon={<Printer className="w-3.5 h-3.5 text-amber-200" />}
          >
            <span>PDF</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAIDeckModal(true)}
            className="text-xs px-2 sm:px-3 text-amber-200 hover:bg-white/10"
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />}
          >
            <span>AI Deck</span>
          </Button>
        </div>
      </div>

      {/* MS PowerPoint Ribbon Navigation Tabs */}
      <div className="flex items-center gap-1 px-2 sm:px-4 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold overflow-x-auto select-none">
        {[
          { id: 'home', label: 'Home' },
          { id: 'insert', label: 'Insert' },
          { id: 'design', label: 'Design & Themes' },
          { id: 'slideshow', label: 'Slide Show' },
          { id: 'ai', label: 'AI Deck' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveRibbonTab(tab.id as any)}
            className={`px-3 sm:px-4 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeRibbonTab === tab.id
                ? 'border-[#d24726] text-[#d24726] dark:border-rose-400 dark:text-rose-400 bg-white dark:bg-slate-950 font-bold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ribbon Command Strip */}
      <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-2 overflow-x-auto shadow-xs">
        {/* TAB 1: HOME */}
        {activeRibbonTab === 'home' && (
          <div className="flex items-center gap-2 min-w-max text-xs">
            <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5 text-rose-500" />} onClick={handleAddSlide}>
              New Slide
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Copy className="w-3.5 h-3.5" />} onClick={() => handleDuplicateSlide(activeSlideIndex)}>
              Duplicate Slide
            </Button>
            <Button variant="ghost" size="sm" leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />} onClick={() => handleDeleteSlide(activeSlideIndex)}>
              Delete Slide
            </Button>
          </div>
        )}

        {/* TAB 2: INSERT */}
        {activeRibbonTab === 'insert' && (
          <div className="flex items-center gap-2 min-w-max text-xs">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ImageIcon className="w-4 h-4 text-emerald-500" />}
              onClick={() => imageInputRef.current?.click()}
            >
              Insert Picture
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Shapes className="w-4 h-4 text-indigo-500" />}
              onClick={() => {
                const currentBullets = activeSlide.bullets;
                handleUpdateSlide({ bullets: [...currentBullets, 'New Key Takeaway Box'] });
                toast.success('Inserted content box');
              }}
            >
              Add Bullet Box
            </Button>
          </div>
        )}

        {/* TAB 3: DESIGN */}
        {activeRibbonTab === 'design' && (
          <div className="flex items-center gap-2 min-w-max text-xs">
            <span className="text-slate-500 font-semibold pr-2">Theme:</span>
            {[
              { id: 'indigo', label: 'Royal Indigo', color: 'bg-indigo-600' },
              { id: 'emerald', label: 'Emerald Green', color: 'bg-emerald-600' },
              { id: 'amber', label: 'Warm Amber', color: 'bg-amber-600' },
              { id: 'crimson', label: 'Crimson Red', color: 'bg-rose-600' },
              { id: 'slate', label: 'Dark Slate', color: 'bg-slate-800' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => handleUpdateSlide({ theme: t.id as any })}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold ${
                  activeSlide.theme === t.id ? 'bg-slate-900 text-white ring-2 ring-brand-500' : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${t.color}`} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* TAB 4: SLIDESHOW */}
        {activeRibbonTab === 'slideshow' && (
          <div className="flex items-center gap-2 min-w-max text-xs">
            <Button variant="primary" size="sm" leftIcon={<Play className="w-3.5 h-3.5" />} onClick={() => setIsPlayingShow(true)}>
              Start From Beginning
            </Button>
          </div>
        )}

        {/* TAB 5: AI DECK */}
        {activeRibbonTab === 'ai' && (
          <div className="flex items-center gap-2 min-w-max text-xs">
            <Button variant="gradient" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5" />} onClick={() => setShowAIDeckModal(true)}>
              Generate AI Presentation
            </Button>
          </div>
        )}
      </div>

      {/* Main Slide Editor Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Slide Thumbnails Pane */}
        <div className="w-48 sm:w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto p-3 space-y-3">
          <div className="text-[10px] font-bold text-slate-400 uppercase px-1">
            Slides ({slides.length})
          </div>

          {slides.map((s, i) => (
            <div
              key={s.id}
              onClick={() => setActiveSlideIndex(i)}
              className={`p-2.5 rounded-2xl border transition-all cursor-pointer text-left ${
                activeSlideIndex === i
                  ? 'border-[#d24726] bg-rose-50/40 dark:bg-rose-950/30 ring-1 ring-[#d24726]'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Slide {i + 1}</span>
                <span className="capitalize">{s.theme}</span>
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {s.title}
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleAddSlide}
            className="w-full text-xs"
          >
            Add Slide
          </Button>
        </div>

        {/* Central 16:9 Presentation Canvas Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-center bg-slate-200/70 dark:bg-slate-950/90">
          <div className={`w-full max-w-4xl aspect-video rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col justify-between transition-all ${themeStyles[activeSlide.theme]}`}>
            {/* Title & Subtitle */}
            <div className="space-y-3">
              <input
                type="text"
                value={activeSlide.title}
                onChange={(e) => handleUpdateSlide({ title: e.target.value })}
                className="w-full text-2xl sm:text-3xl font-extrabold bg-transparent border-b border-transparent hover:border-white/30 focus:border-white focus:outline-none text-white tracking-tight"
                placeholder="Click to add presentation title..."
              />
              <input
                type="text"
                value={activeSlide.subtitle || ''}
                onChange={(e) => handleUpdateSlide({ subtitle: e.target.value })}
                className="w-full text-sm sm:text-base font-medium text-slate-300 bg-transparent border-b border-transparent hover:border-white/30 focus:border-white focus:outline-none"
                placeholder="Click to add subtitle..."
              />
            </div>

            {/* Bullets & Image Split Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
              <div className="space-y-3">
                {activeSlide.bullets.map((bullet, bIdx) => (
                  <div key={bIdx} className="flex items-start gap-2">
                    <span className="text-brand-400 font-bold text-lg mt-0.5">•</span>
                    <input
                      type="text"
                      value={bullet}
                      onChange={(e) => {
                        const newBullets = [...activeSlide.bullets];
                        newBullets[bIdx] = e.target.value;
                        handleUpdateSlide({ bullets: newBullets });
                      }}
                      className="w-full text-xs sm:text-sm bg-transparent border-b border-transparent hover:border-white/20 focus:border-white/60 focus:outline-none text-slate-200"
                    />
                  </div>
                ))}
              </div>

              {activeSlide.imageUrl && (
                <div className="relative rounded-2xl overflow-hidden border border-white/10 max-h-48">
                  <img src={activeSlide.imageUrl} alt="Slide Visual" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleUpdateSlide({ imageUrl: undefined })}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10 pt-3">
              <span>DocuFlow AI Presentation Suite</span>
              <span>Slide {activeSlideIndex + 1} of {slides.length}</span>
            </div>
          </div>

          {/* Presenter Notes Box (Like Real Microsoft PowerPoint) */}
          <div className="w-full max-w-4xl mt-4 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              <span>Presenter Speaker Notes</span>
              <span className="text-rose-500 font-semibold">Only visible to presenter</span>
            </div>
            <textarea
              rows={2}
              value={activeSlide.speakerNotes || ''}
              onChange={(e) => handleUpdateSlide({ speakerNotes: e.target.value })}
              placeholder="Click to add presenter speaker notes for this slide..."
              className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#d24726]"
            />
          </div>
        </div>
      </div>

      {/* Fullscreen Presenter Mode Modal */}
      {isPlayingShow && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-6 sm:p-12 text-white animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">
              Slide {activeSlideIndex + 1} of {slides.length}
            </span>
            <button
              onClick={() => setIsPlayingShow(false)}
              className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
            >
              Exit Presentation (Esc)
            </button>
          </div>

          <div className="max-w-5xl mx-auto w-full aspect-video flex flex-col justify-center space-y-6">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight">{activeSlide.title}</h1>
            {activeSlide.subtitle && <p className="text-xl sm:text-2xl text-slate-300">{activeSlide.subtitle}</p>}
            <ul className="space-y-4 pt-4">
              {activeSlide.bullets.map((b, i) => (
                <li key={i} className="text-lg sm:text-xl text-slate-200 flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-400" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={activeSlideIndex === 0}
              onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
              className="text-white border-white/20"
            >
              Previous Slide
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={activeSlideIndex === slides.length - 1}
              onClick={() => setActiveSlideIndex(Math.min(slides.length - 1, activeSlideIndex + 1))}
            >
              Next Slide
            </Button>
          </div>
        </div>
      )}

      {/* AI Deck Prompt Modal */}
      <Modal
        isOpen={showAIDeckModal}
        onClose={() => setShowAIDeckModal(false)}
        title="Generate AI Presentation Deck"
        description="Type any topic, product, or proposal to build structured slides instantly"
      >
        <form onSubmit={handleGenerateAIDeck} className="space-y-4">
          <Input
            label="Presentation Topic / Pitch"
            placeholder="e.g. Q3 SaaS Enterprise Growth Strategy and Expansion Roadmap..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            required
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowAIDeckModal(false)}>
              Cancel
            </Button>
            <Button variant="gradient" size="sm" type="submit" isLoading={isGenerating}>
              Generate Slides
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
