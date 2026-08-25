import React, { useState, useRef, useEffect } from 'react';
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
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Quote,
  CheckCircle2,
  Sliders,
  MoreVertical,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { exportSlidesToPDF } from '../../utils/pdfGenerator';
import { parsePowerPoint } from '../../utils/documentParsers';
import { uploadToGoogleDrive } from '../../utils/googleDriveSync';
import { toast } from 'sonner';

export type PowerPointTheme = 'slate' | 'indigo' | 'emerald' | 'amber' | 'crimson' | 'cyber' | 'quartz' | 'midnight';
export type SlideLayout = 'title' | 'content' | 'two_column' | 'stat' | 'quote' | 'blank';

export interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  theme: PowerPointTheme;
  layout?: SlideLayout;
  statNumber?: string;
  statLabel?: string;
  quoteAuthor?: string;
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
  const [showLayoutModal, setShowLayoutModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initial Presentation Slides
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
      layout: 'title',
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
      layout: 'stat',
      statNumber: '+350%',
      statLabel: 'Year-over-Year Enterprise Growth',
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
      theme: 'cyber',
      layout: 'two_column',
      speakerNotes: 'Address enterprise compliance standards and data isolation.',
    },
  ]);

  const activeSlide = slides[activeSlideIndex] || slides[0];

  const handleUpdateSlide = (updatedFields: Partial<Slide>) => {
    const updated = slides.map((s, i) => (i === activeSlideIndex ? { ...s, ...updatedFields } : s));
    setSlides(updated);
    setIsSaved(false);
  };

  const handleAddSlide = (layout: SlideLayout = 'content') => {
    const newSlide: Slide = {
      id: `s_${Date.now()}`,
      title: layout === 'title' ? 'New Presentation Title' : 'New Presentation Slide',
      subtitle: 'Add key subtitle or takeaway message here',
      bullets: ['Key takeaway deliverable 1', 'Key takeaway deliverable 2', 'Key takeaway deliverable 3'],
      theme: activeSlide.theme || 'indigo',
      layout,
      statNumber: layout === 'stat' ? '99.9%' : undefined,
      statLabel: layout === 'stat' ? 'Uptime & Reliability' : undefined,
      quoteAuthor: layout === 'quote' ? 'Executive Leadership' : undefined,
    };
    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
    setIsSaved(false);
    setShowLayoutModal(false);
    toast.success('Added new presentation slide');
  };

  const handleMoveSlideUp = (idx: number) => {
    if (idx <= 0) return;
    const updated = [...slides];
    const temp = updated[idx];
    updated[idx] = updated[idx - 1];
    updated[idx - 1] = temp;
    setSlides(updated);
    setActiveSlideIndex(idx - 1);
    toast.success('Moved slide up');
  };

  const handleMoveSlideDown = (idx: number) => {
    if (idx >= slides.length - 1) return;
    const updated = [...slides];
    const temp = updated[idx];
    updated[idx] = updated[idx + 1];
    updated[idx + 1] = temp;
    setSlides(updated);
    setActiveSlideIndex(idx + 1);
    toast.success('Moved slide down');
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
    if (slides.length <= 1) {
      toast.error('Cannot delete the only slide');
      return;
    }
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
      toast.info(`Parsing presentation ${file.name}...`);
      const parsedSlides = await parsePowerPoint(file);
      if (parsedSlides.length > 0) {
        setSlides(
          parsedSlides.map((s) => ({
            ...s,
            theme: (s.theme as PowerPointTheme) || 'indigo',
            layout: 'content',
          }))
        );
        setActiveSlideIndex(0);
        setDocName(file.name);
        setIsSaved(true);
        toast.success(`Imported presentation with ${parsedSlides.length} slides!`);
      }
    } catch {
      toast.error('Failed to import presentation');
    }
  };

  const handleGenerateAIDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);

    setTimeout(() => {
      const generated: Slide[] = [
        {
          id: `gen_1_${Date.now()}`,
          title: aiPrompt,
          subtitle: 'Executive Presentation & Strategic Roadmap',
          bullets: ['Market Overview & Executive Summary', 'Value Proposition & Technical Architecture', 'Timeline & Next Steps'],
          theme: 'indigo',
          layout: 'title',
        },
        {
          id: `gen_2_${Date.now()}`,
          title: 'Core Advantages & Metrics',
          subtitle: 'Key Deliverables and Performance Indicators',
          bullets: ['99.99% Reliability across all regions', 'Zero friction cross-platform deployment', 'Direct Google Drive and Cloud integration'],
          theme: 'emerald',
          layout: 'stat',
          statNumber: '10x Faster',
          statLabel: 'Deployment & Collaboration Cycle',
        },
        {
          id: `gen_3_${Date.now()}`,
          title: 'Action Plan & Milestones',
          subtitle: 'Q3 & Q4 Execution Phasing',
          bullets: ['Phase 1: Architecture validation & security audit', 'Phase 2: Global pilot rollout', 'Phase 3: Full enterprise scale-up'],
          theme: 'cyber',
          layout: 'two_column',
        },
      ];
      setSlides(generated);
      setActiveSlideIndex(0);
      setIsGenerating(false);
      setShowAIDeckModal(false);
      setAiPrompt('');
      setIsSaved(true);
      toast.success('Generated presentation slides with AI!');
    }, 1200);
  };

  const handleExportPresentation = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(slides, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', docName.replace(/\.pptx$/i, '') + '.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Downloaded presentation deck!');
  };

  // 8 Color Themes
  const themeStyles: Record<PowerPointTheme, string> = {
    slate: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white',
    indigo: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white',
    emerald: 'bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 text-white',
    amber: 'bg-gradient-to-br from-slate-900 via-amber-950 to-slate-950 text-white',
    crimson: 'bg-gradient-to-br from-slate-900 via-rose-950 to-slate-950 text-white',
    cyber: 'bg-gradient-to-br from-cyan-950 via-slate-900 to-purple-950 text-cyan-100 border border-cyan-500/20',
    quartz: 'bg-gradient-to-br from-slate-100 via-white to-blue-50 text-slate-900 border border-slate-200',
    midnight: 'bg-gradient-to-br from-black via-zinc-950 to-amber-950/40 text-amber-100 border border-amber-500/20',
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9.5rem)] lg:h-[calc(100vh-6rem)] rounded-2xl sm:rounded-3xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
      {/* Hidden File Pickers */}
      <input type="file" ref={imageInputRef} accept="image/*" onChange={(e) => handleAddImage(e.target.files)} className="hidden" />
      <input type="file" ref={pptFileInputRef} accept=".pptx,.ppt" onChange={(e) => handleImportPPT(e.target.files)} className="hidden" />

      {/* MS PowerPoint Top Bar */}
      <div className="flex items-center justify-between px-2.5 sm:px-5 py-2 bg-[#d24726] dark:bg-[#a13217] text-white shadow-sm select-none">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
          <div className="p-1 sm:p-1.5 rounded-lg bg-white/15 flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            <Presentation className="w-4 h-4 text-white" />
          </div>
          <input
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            className="text-xs sm:text-sm font-bold bg-transparent border-b border-transparent hover:border-white/40 focus:border-white focus:outline-none px-1 text-white truncate max-w-[120px] xs:max-w-[170px] sm:max-w-xs"
          />
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] text-white/90 shrink-0">
            <FileCheck className="w-3 h-3 text-emerald-200" />
            {isSaved ? 'Saved to Cloud' : 'Unsaved edits'}
          </span>
        </div>

        {/* Desktop Primary Action Buttons */}
        <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLayoutModal(true)}
            className="text-white hover:bg-white/10 text-xs px-2 sm:px-3 bg-white/10"
            leftIcon={<FilePlus className="w-3.5 h-3.5 text-amber-200" />}
          >
            <span>+ New Slide</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => pptFileInputRef.current?.click()}
            className="text-white hover:bg-white/10 text-xs px-2 sm:px-3"
            leftIcon={<Upload className="w-3.5 h-3.5" />}
          >
            <span>Import PPT</span>
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
            <span>Drive Sync</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPlayingShow(true)}
            className="text-white hover:bg-white/10 text-xs px-2 sm:px-3 bg-white/10 font-bold"
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

        {/* Mobile Header Action Buttons (Never Overlapping) */}
        <div className="flex sm:hidden items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPlayingShow(true)}
            className="text-white hover:bg-white/10 text-xs px-2 bg-white/10 font-bold"
            leftIcon={<Play className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />}
          >
            <span>Play</span>
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
            className="text-white hover:bg-white/10 text-xs px-2 bg-white/10"
            leftIcon={<Printer className="w-3.5 h-3.5 text-amber-200" />}
          >
            <span>PDF</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAIDeckModal(true)}
            className="text-xs px-2 text-amber-200 hover:bg-white/10"
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />}
          >
            <span>AI</span>
          </Button>

          <div className="relative">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg text-white hover:bg-white/15 transition-colors"
              title="More Actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMobileMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMobileMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 animate-in fade-in duration-150 text-slate-800 dark:text-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-3 py-1">
                    Slide Options
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setShowLayoutModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-left"
                  >
                    <FilePlus className="w-4 h-4 text-rose-500" />
                    <span>+ New Slide</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      pptFileInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-left"
                  >
                    <Upload className="w-4 h-4 text-blue-500" />
                    <span>Import PPT</span>
                  </button>
                  <button
                    onClick={async () => {
                      setIsMobileMenuOpen(false);
                      const pptContent = JSON.stringify(slides);
                      await uploadToGoogleDrive(docName, pptContent, 'application/vnd.google-apps.presentation');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-left"
                  >
                    <Upload className="w-4 h-4 text-indigo-500" />
                    <span>Drive Sync</span>
                  </button>
                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleExportPresentation();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-left"
                  >
                    <Download className="w-4 h-4 text-rose-600" />
                    <span>Download (.json/.pptx)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MS PowerPoint Ribbon Navigation Tabs */}
      <div className="no-scrollbar flex items-center gap-1 px-2 sm:px-4 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold overflow-x-auto whitespace-nowrap select-none py-1">
        {[
          { id: 'home', label: 'Home' },
          { id: 'insert', label: 'Insert & Elements' },
          { id: 'design', label: '8 Pro Themes' },
          { id: 'slideshow', label: 'Slide Show' },
          { id: 'ai', label: 'AI Deck Builder' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveRibbonTab(tab.id as any)}
            className={`px-3 sm:px-4 py-1.5 rounded-lg border font-medium transition-all whitespace-nowrap ${
              activeRibbonTab === tab.id
                ? 'border-slate-300 dark:border-slate-700 text-[#d24726] dark:text-rose-400 bg-white dark:bg-slate-800 font-bold shadow-xs'
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
            <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5 text-rose-500" />} onClick={() => handleAddSlide('content')}>
              New Slide
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Copy className="w-3.5 h-3.5" />} onClick={() => handleDuplicateSlide(activeSlideIndex)}>
              Duplicate
            </Button>
            <Button variant="outline" size="sm" leftIcon={<ArrowUp className="w-3.5 h-3.5" />} onClick={() => handleMoveSlideUp(activeSlideIndex)}>
              Move Up
            </Button>
            <Button variant="outline" size="sm" leftIcon={<ArrowDown className="w-3.5 h-3.5" />} onClick={() => handleMoveSlideDown(activeSlideIndex)}>
              Move Down
            </Button>
            <Button variant="ghost" size="sm" leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />} onClick={() => handleDeleteSlide(activeSlideIndex)}>
              Delete Slide
            </Button>
          </div>
        )}

        {/* TAB 2: INSERT */}
        {activeRibbonTab === 'insert' && (
          <div className="flex items-center gap-2 min-w-max text-xs">
            <Button variant="outline" size="sm" leftIcon={<ImageIcon className="w-4 h-4 text-emerald-500" />} onClick={() => imageInputRef.current?.click()}>
              Picture
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<TrendingUp className="w-4 h-4 text-amber-500" />}
              onClick={() => {
                handleUpdateSlide({
                  layout: 'stat',
                  statNumber: '+120% YoY',
                  statLabel: 'Enterprise Milestone Goal',
                });
                toast.success('Inserted Metric KPI Card');
              }}
            >
              KPI Stat Card
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Quote className="w-4 h-4 text-purple-500" />}
              onClick={() => {
                handleUpdateSlide({
                  layout: 'quote',
                  quoteAuthor: 'Executive Partner',
                });
                toast.success('Inserted Quote Block');
              }}
            >
              Quote Block
            </Button>
          </div>
        )}

        {/* TAB 3: 8 PRO THEMES */}
        {activeRibbonTab === 'design' && (
          <div className="flex items-center gap-2 min-w-max text-xs">
            <span className="text-slate-500 font-semibold pr-2">Choose Theme:</span>
            {[
              { id: 'indigo', label: 'Royal Indigo', color: 'bg-indigo-600' },
              { id: 'emerald', label: 'Emerald Forest', color: 'bg-emerald-600' },
              { id: 'cyber', label: 'Cyber Neon', color: 'bg-cyan-500' },
              { id: 'quartz', label: 'Quartz Light', color: 'bg-blue-300' },
              { id: 'midnight', label: 'Midnight Gold', color: 'bg-amber-600' },
              { id: 'amber', label: 'Warm Amber', color: 'bg-amber-500' },
              { id: 'crimson', label: 'Ruby Crimson', color: 'bg-rose-600' },
              { id: 'slate', label: 'Titanium Slate', color: 'bg-slate-800' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => handleUpdateSlide({ theme: t.id as any })}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold ${
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
              Play Fullscreen Show
            </Button>
          </div>
        )}

        {/* TAB 5: AI DECK */}
        {activeRibbonTab === 'ai' && (
          <div className="flex items-center gap-2 min-w-max text-xs">
            <Button variant="gradient" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5" />} onClick={() => setShowAIDeckModal(true)}>
              Generate AI Slide Deck
            </Button>
          </div>
        )}
      </div>

      {/* Main Slide Editor Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Slide Thumbnails Pane (Desktop) */}
        <div className="hidden md:block w-52 lg:w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto p-3 space-y-3">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase px-1">
            <span>Slides ({slides.length})</span>
            <button onClick={() => setShowLayoutModal(true)} className="text-[#d24726] hover:underline">
              + New
            </button>
          </div>

          {slides.map((s, i) => (
            <div
              key={s.id}
              onClick={() => setActiveSlideIndex(i)}
              className={`p-2.5 rounded-2xl border transition-all cursor-pointer text-left ${
                activeSlideIndex === i
                  ? 'border-[#d24726] bg-rose-50/40 dark:bg-rose-950/30 ring-2 ring-[#d24726]'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Slide {i + 1}</span>
                <span className="capitalize">{s.theme}</span>
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{s.title}</div>
            </div>
          ))}

          <Button variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowLayoutModal(true)} className="w-full text-xs">
            Add Slide
          </Button>
        </div>

        {/* Central 16:9 Presentation Canvas Viewport */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-6 lg:p-8 flex flex-col items-center justify-center bg-slate-200/70 dark:bg-slate-950/90 gap-3">
          {/* Mobile Slide Navigation Bar */}
          <div className="md:hidden flex items-center justify-between w-full max-w-4xl px-2 py-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
              disabled={activeSlideIndex === 0}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold font-mono text-[11px]">
              Slide {activeSlideIndex + 1} of {slides.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowLayoutModal(true)}
                className="px-2 py-1 rounded bg-rose-500 text-white font-bold text-[10px] flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
              <button
                onClick={() => setActiveSlideIndex(Math.min(slides.length - 1, activeSlideIndex + 1))}
                disabled={activeSlideIndex === slides.length - 1}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={`w-full max-w-4xl aspect-video rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-12 shadow-2xl flex flex-col justify-between transition-all ${themeStyles[activeSlide.theme]}`}>
            {/* Title & Subtitle */}
            <div className="space-y-2 sm:space-y-3">
              <input
                type="text"
                value={activeSlide.title}
                onChange={(e) => handleUpdateSlide({ title: e.target.value })}
                className="w-full text-lg sm:text-2xl lg:text-3xl font-extrabold bg-transparent border-b border-transparent hover:border-white/30 focus:border-white focus:outline-none tracking-tight"
                placeholder="Click to add presentation title..."
              />
              <input
                type="text"
                value={activeSlide.subtitle || ''}
                onChange={(e) => handleUpdateSlide({ subtitle: e.target.value })}
                className="w-full text-xs sm:text-sm lg:text-base font-medium opacity-80 bg-transparent border-b border-transparent hover:border-white/30 focus:border-white focus:outline-none"
                placeholder="Click to add subtitle..."
              />
            </div>

            {/* Special Layout Rendering: Stat / Quote / Bullets */}
            {activeSlide.layout === 'stat' ? (
              <div className="my-2 sm:my-6 p-3 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center space-y-1 sm:space-y-2">
                <input
                  type="text"
                  value={activeSlide.statNumber || '+350%'}
                  onChange={(e) => handleUpdateSlide({ statNumber: e.target.value })}
                  className="w-full text-center text-2xl sm:text-4xl lg:text-5xl font-black bg-transparent border-none focus:outline-none"
                />
                <input
                  type="text"
                  value={activeSlide.statLabel || 'Key Growth Performance'}
                  onChange={(e) => handleUpdateSlide({ statLabel: e.target.value })}
                  className="w-full text-center text-[10px] sm:text-xs lg:text-sm font-semibold opacity-80 bg-transparent border-none focus:outline-none"
                />
              </div>
            ) : activeSlide.layout === 'quote' ? (
              <div className="my-2 sm:my-6 p-3 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 italic space-y-2 sm:space-y-3">
                <textarea
                  rows={2}
                  value={activeSlide.bullets[0] || 'Empowering seamless document transformation across the entire enterprise.'}
                  onChange={(e) => handleUpdateSlide({ bullets: [e.target.value] })}
                  className="w-full text-sm sm:text-base lg:text-xl font-serif bg-transparent border-none focus:outline-none leading-relaxed"
                />
                <input
                  type="text"
                  value={activeSlide.quoteAuthor || '— Executive Leadership'}
                  onChange={(e) => handleUpdateSlide({ quoteAuthor: e.target.value })}
                  className="w-full text-right text-[10px] sm:text-xs font-sans font-bold opacity-80 bg-transparent border-none focus:outline-none"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 my-2 sm:my-4">
                <div className="space-y-2 sm:space-y-3">
                  {activeSlide.bullets.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-start gap-2">
                      <span className="font-bold text-base sm:text-lg mt-0.5">•</span>
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => {
                          const newBullets = [...activeSlide.bullets];
                          newBullets[bIdx] = e.target.value;
                          handleUpdateSlide({ bullets: newBullets });
                        }}
                        className="w-full text-xs sm:text-sm bg-transparent border-b border-transparent hover:border-white/20 focus:border-white/60 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                {activeSlide.imageUrl && (
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 max-h-36 sm:max-h-48">
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
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-[9px] sm:text-[11px] opacity-70 border-t border-white/10 pt-2 sm:pt-3">
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

      {/* Slide Layout Chooser Modal */}
      <Modal isOpen={showLayoutModal} onClose={() => setShowLayoutModal(false)} title="Choose Slide Layout">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2">
          {[
            { layout: 'title', label: 'Title Slide', desc: 'Main presentation cover' },
            { layout: 'content', label: 'Title & Bullets', desc: 'Standard key points' },
            { layout: 'two_column', label: 'Two Column Split', desc: 'Comparison & analysis' },
            { layout: 'stat', label: 'Big Metric KPI', desc: 'High impact statistic' },
            { layout: 'quote', label: 'Quote Callout', desc: 'Executive testimonial' },
          ].map((l) => (
            <div
              key={l.layout}
              onClick={() => handleAddSlide(l.layout as SlideLayout)}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#d24726] hover:bg-rose-50/30 dark:hover:bg-rose-950/30 cursor-pointer transition-all text-left"
            >
              <div className="text-xs font-bold text-slate-900 dark:text-white">{l.label}</div>
              <div className="text-[11px] text-slate-400 mt-1">{l.desc}</div>
            </div>
          ))}
        </div>
      </Modal>

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
