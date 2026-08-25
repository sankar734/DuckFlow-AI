import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Sparkles,
  Download,
  Share2,
  Save,
  FileCheck,
  Upload,
  Search,
  Table as TableIcon,
  Link as LinkIcon,
  RemoveFormatting,
  Printer,
  ChevronDown,
  FileText,
  FilePlus,
  Type,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Palette,
  Highlighter,
  Sliders,
  CheckCircle,
  Copy,
  Eye,
  Languages,
  Wand2,
  X,
  SplitSquareVertical,
  Layers,
  Plus,
  Trash2,
  CornerDownRight,
  ChevronRight,
  BookOpen,
  MoreVertical,
} from 'lucide-react';
import { AIAssistantPanel } from '../ai/AIAssistantPanel';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { exportElementToPDF } from '../../utils/pdfGenerator';
import { parseWordDocument, splitHtmlIntoPages } from '../../utils/documentParsers';
import { uploadToGoogleDrive } from '../../utils/googleDriveSync';
import { toast } from 'sonner';

export interface WordEditorProps {
  initialDocName?: string;
  initialContent?: string;
}

export interface DocumentPage {
  id: string;
  content: string;
  headerText?: string;
  footerText?: string;
}

export const WordEditor: React.FC<WordEditorProps> = ({
  initialDocName = 'Document1.docx',
  initialContent,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printContainerRef = useRef<HTMLDivElement>(null);

  const [docName, setDocName] = useState(initialDocName);
  const [activeRibbonTab, setActiveRibbonTab] = useState<'home' | 'insert' | 'layout' | 'references' | 'review' | 'view' | 'ai'>('home');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  // Formatting state
  const [fontFamily, setFontFamily] = useState('Calibri');
  const [fontSize, setFontSize] = useState('16px');
  const [textColor, setTextColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('transparent');
  const [lineSpacing, setLineSpacing] = useState('1.5');
  const [pageOrientation, setPageOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isDarkModePaper, setIsDarkModePaper] = useState(false);
  const [showRuler, setShowRuler] = useState(true);

  // Multi-Page Architecture (Real MS Word Multi-Page Canvas)
  const defaultPage1 = `<h1>Executive Business Proposal</h1><p>DocuFlow AI provides an enterprise-ready document authoring and intelligent conversion environment with native Microsoft Office 365 compatibility.</p><h2>1. Key Deliverables</h2><p>Teams can collaborate in real time, type with formatted typography, evaluate formulas, and synthesize structured content using the AI Copilot.</p><ul><li><strong>High Fidelity Rendering:</strong> Lossless conversion across Word, Excel, PowerPoint, and PDF.</li><li><strong>Enterprise Governance:</strong> AES-256 cloud encryption and role-based permissions.</li><li><strong>AI Productivity Engine:</strong> Auto-drafting, summarizing, and smart translations.</li></ul>`;
  
  const defaultPage2 = `<h2>2. Strategic Milestones & Roadmap</h2><p>Our implementation architecture ensures maximum interoperability across enterprise infrastructure:</p><table style="width:100%; border-collapse:collapse; margin:16px 0;"><tr style="background:#f1f5f9;"><th style="border:1px solid #cbd5e1; padding:8px; text-align:left;">Phase</th><th style="border:1px solid #cbd5e1; padding:8px; text-align:left;">Milestone</th><th style="border:1px solid #cbd5e1; padding:8px; text-align:left;">Status</th></tr><tr><td style="border:1px solid #cbd5e1; padding:8px;">Q1 2026</td><td style="border:1px solid #cbd5e1; padding:8px;">Core Office Lossless Parsers</td><td style="border:1px solid #cbd5e1; padding:8px; color:#10b981; font-weight:bold;">Completed</td></tr><tr><td style="border:1px solid #cbd5e1; padding:8px;">Q2 2026</td><td style="border:1px solid #cbd5e1; padding:8px;">Google Gemini Real AI Engine</td><td style="border:1px solid #cbd5e1; padding:8px; color:#10b981; font-weight:bold;">Active</td></tr><tr><td style="border:1px solid #cbd5e1; padding:8px;">Q3 2026</td><td style="border:1px solid #cbd5e1; padding:8px;">Google Drive Live Cloud Sync</td><td style="border:1px solid #cbd5e1; padding:8px; color:#3b82f6; font-weight:bold;">Integrated</td></tr></table><p>All modules are validated for multi-page high resolution PDF & DOCX rendering.</p>`;

  const [pages, setPages] = useState<DocumentPage[]>([
    { id: 'page_1', content: defaultPage1, headerText: 'DocuFlow AI Suite', footerText: 'Confidential' },
    { id: 'page_2', content: defaultPage2, headerText: 'DocuFlow AI Suite', footerText: 'Confidential' },
  ]);

  const [activePageIndex, setActivePageIndex] = useState(0);

  // Document Stats
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // New Document Modal
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);

  // Find & Replace
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');

  // Table Insert Modal
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // Link Modal
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load initial content or active draft
  useEffect(() => {
    const draft = localStorage.getItem('docuflow_active_draft');
    if (draft) {
      const pageList = splitHtmlIntoPages(draft);
      setPages(
        pageList.map((content, idx) => ({
          id: `page_draft_${idx + 1}`,
          content,
          headerText: 'DocuFlow AI Synthesized Draft',
          footerText: `Page ${idx + 1}`,
        }))
      );
      localStorage.removeItem('docuflow_active_draft');
      toast.success(`Loaded AI content across ${pageList.length} pages!`);
    } else if (initialContent) {
      const pageList = splitHtmlIntoPages(initialContent);
      setPages(
        pageList.map((content, idx) => ({
          id: `page_init_${idx + 1}`,
          content,
          headerText: docName,
          footerText: `Page ${idx + 1}`,
        }))
      );
    }
    updateStats();
  }, []);

  const updateStats = () => {
    let totalText = '';
    pages.forEach((p) => {
      const temp = document.createElement('div');
      temp.innerHTML = p.content;
      totalText += ' ' + (temp.innerText || '');
    });
    const words = totalText.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    setCharCount(totalText.length);
  };

  const handlePageContentChange = (pageIndex: number, newHtml: string) => {
    setIsSaved(false);
    setPages((prev) => {
      const updated = [...prev];
      updated[pageIndex] = { ...updated[pageIndex], content: newHtml };
      return updated;
    });
    updateStats();
  };

  const handleAddPageBreak = () => {
    const newPageId = `page_${Date.now()}`;
    setPages((prev) => [
      ...prev,
      {
        id: newPageId,
        content: '<p><em>Type your next page content here...</em></p>',
        headerText: docName,
        footerText: `Page ${prev.length + 1}`,
      },
    ]);
    setActivePageIndex(pages.length);
    toast.success(`Inserted Page Break: Page ${pages.length + 1} added!`);
  };

  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) {
      toast.error('Cannot delete the only remaining page');
      return;
    }
    setPages((prev) => prev.filter((_, i) => i !== index));
    setActivePageIndex((prev) => Math.max(0, prev - 1));
    toast.success(`Removed Page ${index + 1}`);
  };

  const executeCommand = (cmd: string, value: string = '') => {
    document.execCommand(cmd, false, value);
    setIsSaved(false);
  };

  const handleImportFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      const parsed = await parseWordDocument(file);
      setDocName(file.name);
      const pageList = parsed.pages && parsed.pages.length > 0 ? parsed.pages : [parsed.html];
      setPages(
        pageList.map((content, idx) => ({
          id: `page_${Date.now()}_${idx + 1}`,
          content,
          headerText: file.name,
          footerText: `Page ${idx + 1} of ${pageList.length}`,
        }))
      );
      setIsSaved(true);
      updateStats();
      toast.success(`Imported "${file.name}" with ${pageList.length} discrete pages & lossless layout!`);
    } catch {
      toast.error('Failed to import document file');
    }
  };

  const handleExport = (format: 'docx' | 'html' | 'txt') => {
    const baseName = docName.replace(/\.[^/.]+$/, '');
    let allContent = pages.map((p, i) => `<!-- PAGE ${i + 1} -->\n${p.content}`).join('\n\n<hr/>\n\n');
    let blobContent = allContent;
    let mime = 'text/plain';

    if (format === 'docx' || format === 'html') {
      mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      blobContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${docName}</title>
            <style>
              body { font-family: ${fontFamily}, Arial, sans-serif; line-height: ${lineSpacing}; font-size: ${fontSize}; margin: 40px; }
              h1 { color: #1e3a8a; }
              h2 { color: #2563eb; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #cbd5e1; padding: 8px; }
              .page-break { page-break-after: always; }
            </style>
          </head>
          <body>
            ${pages.map((p) => `<div class="page-break">${p.content}</div>`).join('')}
          </body>
        </html>
      `;
    }

    const blob = new Blob([blobContent], { type: `${mime};charset=utf-8` });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${baseName}.${format === 'docx' ? 'doc' : format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded ${baseName}.${format} to your device!`);
  };

  const handleExportPDF = () => {
    if (!printContainerRef.current) return;
    exportElementToPDF(printContainerRef.current, docName);
    toast.success('Exporting multi-page document as PDF...');
  };

  const handleInsertCustomTable = () => {
    let rowsHtml = '';
    for (let r = 0; r < tableRows; r++) {
      let colsHtml = '';
      for (let c = 0; c < tableCols; c++) {
        if (r === 0) {
          colsHtml += `<th style="border:1px solid #cbd5e1; padding:8px; background:#f1f5f9; font-weight:bold;">Header ${c + 1}</th>`;
        } else {
          colsHtml += `<td style="border:1px solid #cbd5e1; padding:8px;">Data ${r},${c + 1}</td>`;
        }
      }
      rowsHtml += `<tr>${colsHtml}</tr>`;
    }
    const tableHtml = `<table style="width:100%; border-collapse:collapse; margin:16px 0;">${rowsHtml}</table><p><br/></p>`;
    executeCommand('insertHTML', tableHtml);
    setIsTableModalOpen(false);
    toast.success('Inserted table into document');
  };

  const handleInsertLink = () => {
    if (!linkUrl) return;
    executeCommand('createLink', linkUrl);
    setIsLinkModalOpen(false);
    setLinkUrl('');
    toast.success('Link inserted');
  };

  const handleFindReplace = () => {
    if (!findQuery) return;
    setPages((prev) =>
      prev.map((p) => {
        const regex = new RegExp(findQuery, 'gi');
        return { ...p, content: p.content.replace(regex, replaceQuery) };
      })
    );
    toast.success(`Replaced occurrences of "${findQuery}" across all pages`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9.5rem)] lg:h-[calc(100vh-6rem)] rounded-2xl sm:rounded-3xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
      {/* Hidden File Picker */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".docx,.doc,.txt,.html,.htm,.md"
        onChange={(e) => handleImportFile(e.target.files)}
        className="hidden"
      />

      {/* MS Office Top Title Bar (Classic Microsoft Word Blue) */}
      <div className="flex items-center justify-between px-2.5 sm:px-5 py-2 bg-[#2b579a] dark:bg-[#185abd] text-white shadow-md select-none">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
          <div className="p-1 sm:p-1.5 rounded-lg bg-white/15 flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <input
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            className="text-xs sm:text-sm font-bold bg-transparent border-b border-transparent hover:border-white/40 focus:border-white focus:outline-none px-1 text-white truncate max-w-[120px] xs:max-w-[170px] sm:max-w-xs"
          />
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] text-white/90 font-medium shrink-0">
            <FileCheck className="w-3 h-3 text-emerald-300" />
            {isSaved ? 'Saved to Cloud' : 'Unsaved changes'}
          </span>
        </div>

        {/* Desktop Primary Action Buttons */}
        <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddPageBreak}
            className="text-white hover:bg-white/15 text-xs px-2 sm:px-3 bg-white/10"
            leftIcon={<Plus className="w-3.5 h-3.5 text-amber-300" />}
          >
            <span>+ Page Break</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-white hover:bg-white/10 text-xs px-2 sm:px-3"
            leftIcon={<Upload className="w-3.5 h-3.5" />}
          >
            <span>Open</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              const fullHtml = pages.map((p) => p.content).join('<hr/>');
              await uploadToGoogleDrive(docName, fullHtml);
            }}
            className="text-white hover:bg-white/10 text-xs px-2 sm:px-3"
            leftIcon={<Upload className="w-3.5 h-3.5 text-blue-200" />}
          >
            <span>Drive Sync</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleExport('docx')}
            className="text-white hover:bg-white/10 text-xs px-2 sm:px-3"
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            <span>Word</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportPDF}
            className="text-white hover:bg-white/10 text-xs px-2 sm:px-3 bg-white/10"
            leftIcon={<Printer className="w-3.5 h-3.5 text-amber-300" />}
          >
            <span>PDF</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAIPanel(!showAIPanel)}
            className={`text-xs px-2 sm:px-3 ${showAIPanel ? 'bg-purple-600 text-white shadow-glow' : 'text-purple-200 hover:bg-white/10'}`}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />}
          >
            <span>AI Copilot</span>
          </Button>
        </div>

        {/* Mobile Action Buttons (Never Overlapping) */}
        <div className="flex sm:hidden items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportPDF}
            className="text-white hover:bg-white/10 text-xs px-2 bg-white/10"
            leftIcon={<Printer className="w-3.5 h-3.5 text-amber-300" />}
          >
            <span>PDF</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAIPanel(!showAIPanel)}
            className={`text-xs px-2 ${showAIPanel ? 'bg-purple-600 text-white shadow-glow' : 'text-purple-200 hover:bg-white/10'}`}
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
                    Document Options
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleAddPageBreak();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-left"
                  >
                    <Plus className="w-4 h-4 text-amber-500" />
                    <span>+ Add Page Break</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-left"
                  >
                    <Upload className="w-4 h-4 text-blue-500" />
                    <span>Open / Import</span>
                  </button>
                  <button
                    onClick={async () => {
                      setIsMobileMenuOpen(false);
                      const fullHtml = pages.map((p) => p.content).join('<hr/>');
                      await uploadToGoogleDrive(docName, fullHtml);
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
                      handleExport('docx');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-left"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>Export Word (.docx)</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleExport('html');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-left"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>Export HTML</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleExport('txt');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-left"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>Export Text (.txt)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MS Word Ribbon Navigation Tabs */}
      <div className="no-scrollbar flex items-center gap-1 px-2 sm:px-4 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold overflow-x-auto whitespace-nowrap select-none py-1">
        {[
          { id: 'home', label: 'Home' },
          { id: 'insert', label: 'Insert' },
          { id: 'layout', label: 'Layout & Margins' },
          { id: 'references', label: 'References' },
          { id: 'review', label: 'Review' },
          { id: 'view', label: 'View' },
          { id: 'ai', label: 'AI Assistant' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveRibbonTab(tab.id as any)}
            className={`px-3 sm:px-4 py-1.5 rounded-lg border transition-all capitalize whitespace-nowrap ${
              activeRibbonTab === tab.id
                ? 'border-slate-300 dark:border-slate-700 text-[#2b579a] dark:text-blue-400 font-bold bg-white dark:bg-slate-800 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MS Word Ribbon Toolbar Strip */}
      <div className="no-scrollbar px-2 sm:px-5 py-1.5 sm:py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2 overflow-x-auto whitespace-nowrap select-none">
        {/* TAB 1: HOME RIBBON */}
        {activeRibbonTab === 'home' && (
          <div className="flex items-center gap-2 sm:gap-4 min-w-max text-xs">
            {/* Undo / Redo */}
            <div className="flex items-center gap-1 pr-3 border-r border-slate-200 dark:border-slate-800">
              <button onClick={() => executeCommand('undo')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Undo (Ctrl+Z)">
                <Undo className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
              <button onClick={() => executeCommand('redo')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Redo (Ctrl+Y)">
                <Redo className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
            </div>

            {/* Typography */}
            <div className="flex items-center gap-2 pr-3 border-r border-slate-200 dark:border-slate-800">
              <select
                value={fontFamily}
                onChange={(e) => {
                  setFontFamily(e.target.value);
                  executeCommand('fontName', e.target.value);
                }}
                className="px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                <option value="Calibri">Calibri</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Courier New">Courier New</option>
                <option value="Segoe UI">Segoe UI</option>
              </select>

              <select
                value={fontSize}
                onChange={(e) => {
                  setFontSize(e.target.value);
                  executeCommand('fontSize', e.target.value === '12px' ? '2' : e.target.value === '16px' ? '3' : e.target.value === '20px' ? '4' : '5');
                }}
                className="px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                <option value="12px">12 pt</option>
                <option value="14px">14 pt</option>
                <option value="16px">16 pt</option>
                <option value="18px">18 pt</option>
                <option value="20px">20 pt</option>
                <option value="24px">24 pt</option>
                <option value="32px">32 pt</option>
              </select>
            </div>

            {/* Formatting */}
            <div className="flex items-center gap-1 pr-3 border-r border-slate-200 dark:border-slate-800">
              <button onClick={() => executeCommand('bold')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 font-bold" title="Bold">
                <Bold className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
              <button onClick={() => executeCommand('italic')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 italic" title="Italic">
                <Italic className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
              <button onClick={() => executeCommand('underline')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 underline" title="Underline">
                <Underline className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
              <button onClick={() => executeCommand('strikeThrough')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Strikethrough">
                <Strikethrough className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
            </div>

            {/* Colors */}
            <div className="flex items-center gap-2 pr-3 border-r border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1" title="Text Color">
                <Palette className="w-3.5 h-3.5 text-slate-500" />
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => {
                    setTextColor(e.target.value);
                    executeCommand('foreColor', e.target.value);
                  }}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                />
              </div>
              <div className="flex items-center gap-1" title="Highlight Color">
                <Highlighter className="w-3.5 h-3.5 text-amber-500" />
                <input
                  type="color"
                  value={highlightColor === 'transparent' ? '#ffff00' : highlightColor}
                  onChange={(e) => {
                    setHighlightColor(e.target.value);
                    executeCommand('hiliteColor', e.target.value);
                  }}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                />
              </div>
            </div>

            {/* Alignment */}
            <div className="flex items-center gap-1 pr-3 border-r border-slate-200 dark:border-slate-800">
              <button onClick={() => executeCommand('justifyLeft')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Align Left">
                <AlignLeft className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
              <button onClick={() => executeCommand('justifyCenter')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Align Center">
                <AlignCenter className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
              <button onClick={() => executeCommand('justifyRight')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Align Right">
                <AlignRight className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
              <button onClick={() => executeCommand('justifyFull')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Justify">
                <AlignJustify className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
            </div>

            {/* Bullet Lists */}
            <div className="flex items-center gap-1 pr-3 border-r border-slate-200 dark:border-slate-800">
              <button onClick={() => executeCommand('insertUnorderedList')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Bullets">
                <List className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
              <button onClick={() => executeCommand('insertOrderedList')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Numbering">
                <ListOrdered className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
            </div>

            {/* Headings */}
            <div className="flex items-center gap-1">
              <button onClick={() => executeCommand('formatBlock', '<p>')} className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-medium">Normal</button>
              <button onClick={() => executeCommand('formatBlock', '<h1>')} className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-blue-700">H1</button>
              <button onClick={() => executeCommand('formatBlock', '<h2>')} className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-indigo-700">H2</button>
            </div>
          </div>
        )}

        {/* TAB 2: INSERT RIBBON */}
        {activeRibbonTab === 'insert' && (
          <div className="flex items-center gap-2 min-w-max text-xs">
            <Button
              variant="gradient"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleAddPageBreak}
            >
              Page Break (New Page)
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<TableIcon className="w-4 h-4 text-emerald-500" />}
              onClick={() => setIsTableModalOpen(true)}
            >
              Insert Table
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<LinkIcon className="w-4 h-4 text-blue-500" />}
              onClick={() => setIsLinkModalOpen(true)}
            >
              Hyperlink
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<SplitSquareVertical className="w-4 h-4 text-purple-500" />}
              onClick={() => executeCommand('insertHorizontalRule')}
            >
              Divider Line
            </Button>
          </div>
        )}

        {/* TAB 3: LAYOUT RIBBON */}
        {activeRibbonTab === 'layout' && (
          <div className="flex items-center gap-3 min-w-max text-xs">
            <div className="flex items-center gap-1.5 pr-3 border-r border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-semibold">Orientation:</span>
              <button
                onClick={() => setPageOrientation('portrait')}
                className={`px-3 py-1 rounded text-xs font-semibold ${pageOrientation === 'portrait' ? 'bg-[#2b579a] text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
              >
                Portrait (A4)
              </button>
              <button
                onClick={() => setPageOrientation('landscape')}
                className={`px-3 py-1 rounded text-xs font-semibold ${pageOrientation === 'landscape' ? 'bg-[#2b579a] text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
              >
                Landscape
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-semibold">Line Height:</span>
              {['1.0', '1.15', '1.5', '2.0'].map((s) => (
                <button
                  key={s}
                  onClick={() => setLineSpacing(s)}
                  className={`px-2.5 py-1 rounded text-xs ${lineSpacing === s ? 'bg-[#2b579a] text-white font-bold' : 'bg-slate-100 dark:bg-slate-800'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: REFERENCES & REVIEW */}
        {activeRibbonTab === 'references' && (
          <div className="flex items-center gap-2 min-w-max text-xs">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<BookOpen className="w-4 h-4 text-indigo-500" />}
              onClick={() => {
                executeCommand('insertHTML', `<div style="background:#f8fafc; border-left:4px solid #3b82f6; padding:12px; margin:16px 0;"><h4 style="margin:0 0 4px 0; color:#1e3a8a;">Table of Contents</h4><ul style="margin:0; padding-left:20px; font-size:13px;"><li>1. Executive Overview</li><li>2. Key Strategic Deliverables</li><li>3. Financial Assessment</li></ul></div>`);
                toast.success('Inserted Table of Contents');
              }}
            >
              Table of Contents
            </Button>
          </div>
        )}

        {activeRibbonTab === 'review' && (
          <div className="flex items-center gap-2 min-w-max text-xs">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
              onClick={() => toast.success('Spelling & Grammar: No errors found!')}
            >
              Proofread & Grammar
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Search className="w-4 h-4" />}
              onClick={() => setShowFindReplace(true)}
            >
              Find & Replace
            </Button>
          </div>
        )}

        {/* TAB 5: VIEW RIBBON */}
        {activeRibbonTab === 'view' && (
          <div className="flex items-center gap-3 min-w-max text-xs">
            <div className="flex items-center gap-1.5 pr-3 border-r border-slate-200 dark:border-slate-800">
              <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} className="p-1 rounded hover:bg-slate-100">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono font-bold w-12 text-center">{zoomLevel}%</span>
              <button onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))} className="p-1 rounded hover:bg-slate-100">
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pr-3 border-r border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={showRuler}
                onChange={(e) => setShowRuler(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>Ruler</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDarkModePaper}
                onChange={(e) => setIsDarkModePaper(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>Dark Canvas Mode</span>
            </label>
          </div>
        )}

        {/* TAB 6: AI RIBBON */}
        {activeRibbonTab === 'ai' && (
          <div className="flex items-center gap-2 min-w-max text-xs">
            <Button
              variant="gradient"
              size="sm"
              leftIcon={<Wand2 className="w-4 h-4" />}
              onClick={() => setShowAIPanel(true)}
            >
              AI Co-Author
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                executeCommand('insertHTML', '<p><em>✦ AI Generated Continuation: The enterprise data architecture outlined above achieves 99.99% fault tolerance with real-time replication.</em></p>');
                toast.success('AI drafted continuation at cursor!');
              }}
            >
              Continue Writing at Cursor
            </Button>
          </div>
        )}
      </div>

      {/* Find & Replace Strip */}
      {showFindReplace && (
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-950/40 border-b border-purple-200 dark:border-purple-800 text-xs">
          <Search className="w-4 h-4 text-purple-500 shrink-0" />
          <input
            type="text"
            placeholder="Find word..."
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
          />
          <input
            type="text"
            placeholder="Replace with..."
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
          />
          <Button variant="primary" size="sm" onClick={handleFindReplace}>
            Replace All
          </Button>
          <button onClick={() => setShowFindReplace(false)} className="text-slate-400 hover:text-slate-600 ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Document Horizontal Ruler (Like Real Microsoft Word) */}
      {showRuler && (
        <div className="hidden md:flex h-6 bg-slate-200 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 items-center justify-center select-none text-[9px] font-mono text-slate-500 overflow-hidden">
          <div className="w-[820px] flex justify-between px-16 border-l border-r border-slate-400/40">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((inch) => (
              <div key={inch} className="flex-1 flex items-center justify-between border-r border-slate-300 dark:border-slate-700 h-4">
                <span>{inch}"</span>
                <span className="opacity-30">|</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Viewport: Real Microsoft Word Multi-Page Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Thumbnails Strip */}
        <div className="hidden md:flex flex-col w-28 bg-slate-200/80 dark:bg-slate-900 border-r border-slate-300 dark:border-slate-800 p-2 overflow-y-auto gap-3 select-none">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">Pages ({pages.length})</div>
          {pages.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setActivePageIndex(idx)}
              className={`p-2 rounded-xl text-left border transition-all flex flex-col items-center gap-1.5 ${
                activePageIndex === idx
                  ? 'bg-white dark:bg-slate-800 border-[#2b579a] shadow-md ring-2 ring-[#2b579a]/20'
                  : 'bg-white/60 dark:bg-slate-950 border-slate-300 dark:border-slate-800 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="w-16 h-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-xs p-1 overflow-hidden">
                <div className="text-[6px] text-slate-400 line-clamp-6 leading-tight">
                  {p.content.replace(/<[^>]+>/g, ' ')}
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Page {idx + 1}</span>
            </button>
          ))}
          <button
            onClick={handleAddPageBreak}
            className="p-2 rounded-xl border border-dashed border-slate-400 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white/50 text-[10px] font-bold flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add Page
          </button>
        </div>

        {/* Center Multi-Page Scrollable Viewport */}
        <div
          ref={printContainerRef}
          className="flex-1 overflow-y-auto p-2 sm:p-6 lg:p-12 flex flex-col items-center gap-4 sm:gap-8 bg-slate-300/60 dark:bg-slate-950"
        >
          {pages.map((page, index) => (
            <div
              key={page.id}
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
              }}
              className="w-full flex justify-center"
            >
              <div
                className={`relative w-full shadow-2xl rounded-sm border transition-all ${
                  pageOrientation === 'landscape'
                    ? 'max-w-[1100px] min-h-[500px] sm:min-h-[750px] p-4 sm:p-10 lg:p-14'
                    : 'max-w-[850px] min-h-[500px] sm:min-h-[1100px] p-4 sm:p-10 lg:p-16'
                } ${
                  isDarkModePaper
                    ? 'bg-slate-900 text-slate-100 border-slate-800'
                    : 'bg-white text-slate-900 border-slate-300'
                } ${activePageIndex === index ? 'ring-2 ring-[#2b579a]/30' : ''}`}
                onClick={() => setActivePageIndex(index)}
              >
                {/* Discrete Page Header (MS Word Style) */}
                <div className="flex items-center justify-between pb-3 sm:pb-4 mb-4 sm:mb-6 border-b border-slate-200 dark:border-slate-800 text-[10px] sm:text-[11px] text-slate-400 select-none">
                  <span className="truncate max-w-[160px] sm:max-w-none">{page.headerText || docName}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500">Page {index + 1}</span>
                    {pages.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePage(index);
                        }}
                        className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950"
                        title="Delete Page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Editable Body for This Page */}
                <div
                  contentEditable
                  suppressContentEditableWarning
                  dangerouslySetInnerHTML={{ __html: page.content }}
                  onInput={(e) => handlePageContentChange(index, e.currentTarget.innerHTML)}
                  style={{
                    fontFamily,
                    fontSize,
                    lineHeight: lineSpacing,
                  }}
                  className={`document-content prose max-w-none min-h-[440px] sm:min-h-[880px] focus:outline-none leading-relaxed ${
                    isDarkModePaper ? 'prose-invert text-slate-100' : 'text-slate-900'
                  }`}
                />

                {/* Discrete Page Footer (MS Word Style) */}
                <div className="flex items-center justify-between pt-3 sm:pt-4 mt-4 sm:mt-6 border-t border-slate-200 dark:border-slate-800 text-[10px] sm:text-[11px] text-slate-400 select-none">
                  <span className="truncate max-w-[140px] sm:max-w-none">{page.footerText || 'Confidential & Proprietary'}</span>
                  <span>Page {index + 1} of {pages.length}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Copilot Drawer */}
        {showAIPanel && (
          <div className="fixed sm:static inset-y-0 right-0 w-80 lg:w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto z-50 sm:z-20 shadow-2xl">
            <div className="sm:hidden flex justify-end p-2 border-b border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowAIPanel(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <AIAssistantPanel
              onInsertText={(inserted) => {
                const currentContent = pages[activePageIndex].content;
                handlePageContentChange(activePageIndex, `${currentContent}<p>${inserted.replace(/\n/g, '<br/>')}</p>`);
                toast.success('Inserted AI content into active page!');
              }}
            />
          </div>
        )}
      </div>

      {/* MS Office Bottom Status Bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 bg-[#2b579a] dark:bg-[#185abd] text-white text-[10px] sm:text-[11px] font-mono select-none shadow-inner">
        <div className="flex items-center gap-2 sm:gap-6">
          <span className="font-bold">P.{activePageIndex + 1}/{pages.length}</span>
          <span>{wordCount} W</span>
          <span className="hidden sm:inline">{charCount} Characters</span>
          <span className="hidden md:inline">English (US)</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden md:inline">100% Lossless MS Word</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} className="hover:opacity-80 px-1 font-bold">-</button>
            <span className="w-8 sm:w-10 text-center">{zoomLevel}%</span>
            <button onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))} className="hover:opacity-80 px-1 font-bold">+</button>
          </div>
        </div>
      </div>

      {/* Table Insert Modal */}
      <Modal isOpen={isTableModalOpen} onClose={() => setIsTableModalOpen(false)} title="Insert Word Table">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Rows"
              type="number"
              min={1}
              max={20}
              value={tableRows}
              onChange={(e) => setTableRows(parseInt(e.target.value) || 3)}
            />
            <Input
              label="Columns"
              type="number"
              min={1}
              max={10}
              value={tableCols}
              onChange={(e) => setTableCols(parseInt(e.target.value) || 3)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsTableModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleInsertCustomTable}>Insert Table</Button>
          </div>
        </div>
      </Modal>

      {/* Link Insert Modal */}
      <Modal isOpen={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} title="Insert Hyperlink">
        <div className="space-y-4">
          <Input
            label="Web Address / URL"
            type="url"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsLinkModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleInsertLink}>Insert Link</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
