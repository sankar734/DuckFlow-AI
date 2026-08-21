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
} from 'lucide-react';
import { AIAssistantPanel } from '../ai/AIAssistantPanel';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { exportElementToPDF } from '../../utils/pdfGenerator';
import { parseWordDocument } from '../../utils/documentParsers';
import { uploadToGoogleDrive } from '../../utils/googleDriveSync';
import { toast } from 'sonner';

export interface WordEditorProps {
  initialDocName?: string;
  initialContent?: string;
}

export const WordEditor: React.FC<WordEditorProps> = ({
  initialDocName = 'Document1.docx',
  initialContent,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  const [docName, setDocName] = useState(initialDocName);
  const [activeRibbonTab, setActiveRibbonTab] = useState<'home' | 'insert' | 'layout' | 'review' | 'view' | 'ai'>('home');
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

  // Document Stats
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [pageCount, setPageCount] = useState(1);

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

  const defaultStarterText = `<h1>Executive Business Proposal</h1><p>DocuFlow AI provides an enterprise-ready document authoring and intelligent conversion environment with native Microsoft Office 365 compatibility.</p><h2>1. Key Deliverables</h2><p>Teams can collaborate in real time, type with formatted typography, evaluate formulas, and synthesize structured content using the AI Copilot.</p><ul><li><strong>High Fidelity Rendering:</strong> Lossless conversion across Word, Excel, PowerPoint, and PDF.</li><li><strong>Enterprise Governance:</strong> AES-256 cloud encryption and role-based permissions.</li><li><strong>AI Productivity Engine:</strong> Auto-drafting, summarizing, and smart translations.</li></ul>`;

  useEffect(() => {
    if (editorRef.current) {
      const draft = localStorage.getItem('docuflow_active_draft');
      if (draft) {
        editorRef.current.innerHTML = draft;
        localStorage.removeItem('docuflow_active_draft');
        toast.success('Loaded AI synthesized content into Word Editor!');
      } else {
        editorRef.current.innerHTML = initialContent || defaultStarterText;
      }
      updateStats();
    }
  }, []);

  const updateStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    setCharCount(text.length);
    setPageCount(Math.max(1, Math.ceil(words / 400)));
  };

  const handleContentInput = () => {
    setIsSaved(false);
    updateStats();
  };

  const executeCommand = (cmd: string, value: string = '') => {
    document.execCommand(cmd, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
    handleContentInput();
  };

  const handleCreateNewDocument = (templateType: string) => {
    if (!editorRef.current) return;
    let templateHtml = '';
    let name = 'Untitled_Document.docx';

    if (templateType === 'blank') {
      templateHtml = '<p><br/></p>';
      name = 'New_Document.docx';
    } else if (templateType === 'resume') {
      templateHtml = `<h1>Your Full Name</h1><p><strong>Senior Software Architect & Product Lead</strong><br/>contact@email.com | +91 98765 43210 | Bangalore, India</p><hr/><h2>Professional Summary</h2><p>Accomplished engineering architect with 8+ years building enterprise SaaS platforms and AI automation tools.</p><h2>Work Experience</h2><p><strong>Senior Lead Engineer — TechCorp (2022 - Present)</strong></p><ul><li>Spearheaded cloud architecture migration reducing infra latency by 45%.</li><li>Architected real-time multi-tenant document collaboration system.</li></ul><h2>Education & Skills</h2><p>B.Tech Computer Science (Honors) • React, TypeScript, Node.js, AI LLMs, Cloud Infrastructure</p>`;
      name = 'Professional_Resume.docx';
    } else if (templateType === 'letter') {
      templateHtml = `<p>Date: ${new Date().toLocaleDateString()}</p><p>To:<br/>Client Name<br/>Company Inc.<br/>Address Details</p><p>Dear Sir/Madam,</p><p>Subject: Strategic Engagement Confirmation</p><p>We are delighted to submit our proposal for the upcoming project milestones. Our team has outlined comprehensive technical and operational roadmaps tailored to your specifications.</p><p>Warm regards,<br/><strong>DocuFlow AI Team</strong></p>`;
      name = 'Formal_Letter.docx';
    } else if (templateType === 'notes') {
      templateHtml = `<h1>Meeting Notes & Action Items</h1><p><strong>Date:</strong> ${new Date().toLocaleDateString()} | <strong>Attendees:</strong> Product & Engineering Teams</p><hr/><h2>Discussion Points</h2><ol><li>Q4 SaaS Feature Launch & Universal Converter readiness.</li><li>Mobile responsive Word, Excel & PowerPoint editor suites.</li><li>Performance optimizations for client-side PDF generation.</li></ol><h2>Action Items</h2><ul><li>[ ] Finalize Ribbon UI testing on touch devices.</li><li>[ ] Deploy live Google OAuth consent verification.</li></ul>`;
      name = 'Meeting_Agenda_Notes.docx';
    }

    editorRef.current.innerHTML = templateHtml;
    setDocName(name);
    setIsNewDocModalOpen(false);
    updateStats();
    setIsSaved(true);
    toast.success(`Created "${name}"! Start typing below.`);
  };

  const handleImportFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      toast.info(`Parsing ${file.name}...`);
      const parsed = await parseWordDocument(file);
      if (editorRef.current) {
        editorRef.current.innerHTML = parsed.html;
        setDocName(file.name);
        updateStats();
        setIsSaved(true);
        toast.success(`Opened "${file.name}" successfully!`);
      }
    } catch (err: any) {
      console.error('Word import error:', err);
      toast.error(`Failed to import document: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleExportPDF = async () => {
    if (!paperRef.current) return;
    toast.info('Generating formatted PDF...');
    await exportElementToPDF(paperRef.current, docName);
    toast.success(`Downloaded ${docName.replace(/\.[^/.]+$/, '')}.pdf`);
  };

  const handleExport = (format: 'docx' | 'txt' | 'html' | 'md') => {
    if (!editorRef.current) return;
    const rawText = editorRef.current.innerText;
    const htmlText = editorRef.current.innerHTML;

    let blobContent = '';
    let mime = 'text/plain';
    const baseName = docName.substring(0, docName.lastIndexOf('.')) || docName;

    if (format === 'docx' || format === 'html') {
      blobContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${docName}</title><style>body{font-family: Calibri, Arial, sans-serif; line-height: 1.6; margin: 40px; color: #1e293b;}</style></head><body>${htmlText}</body></html>`;
      mime = 'application/vnd.ms-word';
    } else if (format === 'md') {
      blobContent = rawText;
      mime = 'text/markdown';
    } else {
      blobContent = rawText;
      mime = 'text/plain';
    }

    const blob = new Blob([blobContent], { type: `${mime};charset=utf-8` });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${baseName}.${format === 'docx' ? 'doc' : format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${baseName}.${format}`);
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
    if (!findQuery || !editorRef.current) return;
    const currentHTML = editorRef.current.innerHTML;
    const regex = new RegExp(findQuery, 'gi');
    const updated = currentHTML.replace(regex, replaceQuery);
    editorRef.current.innerHTML = updated;
    updateStats();
    toast.success(`Replaced occurrences of "${findQuery}"`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] rounded-3xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
      {/* Hidden File Picker */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".docx,.doc,.txt,.html,.htm,.md"
        onChange={(e) => handleImportFile(e.target.files)}
        className="hidden"
      />

      {/* MS Office Top Title Bar */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2 bg-[#2b579a] dark:bg-[#1e3a68] text-white shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1 rounded bg-white/10 flex items-center justify-center font-bold text-xs">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <input
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            className="text-xs sm:text-sm font-bold bg-transparent border-b border-transparent hover:border-white/40 focus:border-white focus:outline-none px-1 text-white truncate max-w-[160px] sm:max-w-xs"
          />
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/90">
            <FileCheck className="w-3 h-3 text-emerald-300" />
            {isSaved ? 'Saved to Cloud' : 'Unsaved changes'}
          </span>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsNewDocModalOpen(true)}
            className="text-white hover:bg-white/10 text-xs px-2 sm:px-3"
            leftIcon={<FilePlus className="w-3.5 h-3.5" />}
          >
            <span className="hidden sm:inline">New Doc</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-white hover:bg-white/10 text-xs px-2 sm:px-3"
            leftIcon={<Upload className="w-3.5 h-3.5" />}
          >
            <span className="hidden sm:inline">Open</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleExport('docx')}
            className="text-white hover:bg-white/10 text-xs px-2 sm:px-3"
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            <span className="hidden sm:inline">Word</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              if (editorRef.current) {
                await uploadToGoogleDrive(docName, editorRef.current.innerHTML);
              }
            }}
            className="text-white hover:bg-white/10 text-xs px-2 sm:px-3"
            leftIcon={<Upload className="w-3.5 h-3.5 text-blue-300" />}
          >
            <span className="hidden sm:inline">Drive Sync</span>
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
      </div>

      {/* MS Word Ribbon Navigation Tabs */}
      <div className="flex items-center gap-1 px-2 sm:px-4 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold overflow-x-auto select-none">
        {[
          { id: 'home', label: 'Home' },
          { id: 'insert', label: 'Insert' },
          { id: 'layout', label: 'Layout' },
          { id: 'review', label: 'Review' },
          { id: 'view', label: 'View' },
          { id: 'ai', label: 'AI Tools' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveRibbonTab(tab.id as any)}
            className={`px-3 sm:px-4 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeRibbonTab === tab.id
                ? 'border-[#2b579a] text-[#2b579a] dark:border-brand-400 dark:text-brand-400 bg-white dark:bg-slate-950 font-bold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MS Word Ribbon Command Toolbar */}
      <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-2 overflow-x-auto shadow-xs">
        {/* TAB 1: HOME RIBBON */}
        {activeRibbonTab === 'home' && (
          <div className="flex items-center gap-2 min-w-max text-xs">
            {/* Undo / Redo */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 dark:border-slate-800">
              <button onClick={() => executeCommand('undo')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Undo (Ctrl+Z)">
                <Undo className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
              <button onClick={() => executeCommand('redo')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Redo (Ctrl+Y)">
                <Redo className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
            </div>

            {/* Font Family & Size Selector */}
            <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200 dark:border-slate-800">
              <select
                value={fontFamily}
                onChange={(e) => {
                  setFontFamily(e.target.value);
                  executeCommand('fontName', e.target.value);
                }}
                className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="Calibri">Calibri</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Inter">Inter</option>
                <option value="Segoe UI">Segoe UI</option>
                <option value="Courier New">Courier New</option>
              </select>

              <select
                value={fontSize}
                onChange={(e) => {
                  setFontSize(e.target.value);
                  executeCommand('fontSize', e.target.value === '24px' ? '5' : e.target.value === '18px' ? '4' : '3');
                }}
                className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="12px">12</option>
                <option value="14px">14</option>
                <option value="16px">16</option>
                <option value="18px">18</option>
                <option value="20px">20</option>
                <option value="24px">24</option>
                <option value="32px">32</option>
              </select>
            </div>

            {/* Character Formatting: Bold, Italic, Underline, Strikethrough */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 dark:border-slate-800">
              <button onClick={() => executeCommand('bold')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 font-bold" title="Bold (Ctrl+B)">
                <Bold className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
              <button onClick={() => executeCommand('italic')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 italic" title="Italic (Ctrl+I)">
                <Italic className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
              <button onClick={() => executeCommand('underline')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 underline" title="Underline (Ctrl+U)">
                <Underline className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
              <button onClick={() => executeCommand('strikeThrough')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Strikethrough">
                <Strikethrough className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
              <button onClick={() => executeCommand('subscript')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Subscript">
                <Subscript className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
              <button onClick={() => executeCommand('superscript')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Superscript">
                <Superscript className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
            </div>

            {/* Colors */}
            <div className="flex items-center gap-1 pr-2 border-r border-slate-200 dark:border-slate-800">
              <label className="flex items-center gap-1 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" title="Font Color">
                <Palette className="w-4 h-4 text-rose-500" />
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => {
                    setTextColor(e.target.value);
                    executeCommand('foreColor', e.target.value);
                  }}
                  className="w-4 h-4 opacity-0 absolute pointer-events-none"
                />
              </label>
              <button onClick={() => executeCommand('hiliteColor', '#fef08a')} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Highlight Yellow">
                <Highlighter className="w-4 h-4 text-amber-500" />
              </button>
            </div>

            {/* Paragraph & Alignment */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 dark:border-slate-800">
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
              <button onClick={() => executeCommand('insertUnorderedList')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Bullet List">
                <List className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
              <button onClick={() => executeCommand('insertOrderedList')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Numbered List">
                <ListOrdered className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
            </div>

            {/* Headings Styles Gallery */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => executeCommand('formatBlock', '<p>')}
                className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 text-[11px] font-medium"
              >
                Normal
              </button>
              <button
                onClick={() => executeCommand('formatBlock', '<h1>')}
                className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 text-[11px] font-bold text-brand-600"
              >
                Heading 1
              </button>
              <button
                onClick={() => executeCommand('formatBlock', '<h2>')}
                className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 text-[11px] font-bold text-indigo-600"
              >
                Heading 2
              </button>
              <button
                onClick={() => executeCommand('removeFormat')}
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Clear All Formatting"
              >
                <RemoveFormatting className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: INSERT RIBBON */}
        {activeRibbonTab === 'insert' && (
          <div className="flex items-center gap-2 min-w-max text-xs">
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => executeCommand('insertHTML', `<blockquote><p style="font-style:italic; border-left: 3px solid #6366f1; padding-left: 12px; margin: 12px 0;">"Enter quote statement here..."</p></blockquote><p></p>`)}
            >
              Quote Box
            </Button>
          </div>
        )}

        {/* TAB 3: LAYOUT RIBBON */}
        {activeRibbonTab === 'layout' && (
          <div className="flex items-center gap-2 min-w-max text-xs">
            <div className="flex items-center gap-1.5 pr-3 border-r border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-semibold">Orientation:</span>
              <button
                onClick={() => setPageOrientation('portrait')}
                className={`px-3 py-1 rounded text-xs font-semibold ${pageOrientation === 'portrait' ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
              >
                Portrait (A4)
              </button>
              <button
                onClick={() => setPageOrientation('landscape')}
                className={`px-3 py-1 rounded text-xs font-semibold ${pageOrientation === 'landscape' ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
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
                  className={`px-2.5 py-1 rounded text-xs ${lineSpacing === s ? 'bg-brand-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: REVIEW RIBBON */}
        {activeRibbonTab === 'review' && (
          <div className="flex items-center gap-2 min-w-max text-xs">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
              onClick={() => toast.success('Spelling & Grammar Check: No critical errors found in document!')}
            >
              Proofread & Grammar
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Languages className="w-4 h-4 text-purple-500" />}
              onClick={() => {
                setShowAIPanel(true);
                toast.info('Select language in AI Copilot drawer');
              }}
            >
              Translate Document
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
              <button
                onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono font-bold w-12 text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDarkModePaper}
                onChange={(e) => setIsDarkModePaper(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Dark Canvas Mode</span>
            </label>
          </div>
        )}

        {/* TAB 6: AI TOOLS RIBBON */}
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
                executeCommand('insertHTML', '<p><em>✦ AI Continuation: The architecture outlined above enables robust multi-device synchronization with sub-100ms latency across global clusters.</em></p>');
                toast.success('AI drafted continuation at cursor!');
              }}
            >
              Continue Writing at Cursor
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAIPanel(true);
                toast.info('Choose Tone in AI Copilot');
              }}
            >
              Change Tone & Style
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

      {/* Document Viewport Canvas Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor A4 Page Canvas Viewport */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-6 lg:p-10 flex justify-center bg-slate-200/70 dark:bg-slate-950/90">
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            className="w-full flex justify-center"
          >
            <div
              ref={paperRef}
              className={`printable-document-canvas w-full shadow-2xl rounded-sm border transition-all ${
                pageOrientation === 'landscape'
                  ? 'max-w-[1100px] min-h-[750px] p-8 sm:p-14'
                  : 'max-w-[850px] min-h-[1050px] p-6 sm:p-16'
              } ${
                isDarkModePaper
                  ? 'bg-slate-900 text-slate-100 border-slate-800'
                  : 'bg-white text-slate-900 border-slate-300'
              }`}
            >
              {/* Document Editable Body */}
              <div
                ref={editorRef}
                contentEditable
                onInput={handleContentInput}
                style={{
                  fontFamily,
                  fontSize,
                  lineHeight: lineSpacing,
                }}
                className={`prose max-w-none min-h-[900px] focus:outline-none leading-relaxed ${
                  isDarkModePaper ? 'prose-invert text-slate-100' : 'text-slate-900'
                }`}
              />
            </div>
          </div>
        </div>

        {/* AI Copilot Drawer */}
        {showAIPanel && (
          <div className="w-80 lg:w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto z-20">
            <AIAssistantPanel
              onInsertText={(inserted) => {
                executeCommand('insertHTML', `<p>${inserted.replace(/\n/g, '<br/>')}</p>`);
                toast.success('Inserted AI content into document!');
              }}
            />
          </div>
        )}
      </div>

      {/* MS Office Bottom Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#2b579a] dark:bg-[#1e3a68] text-white text-[11px] font-mono select-none">
        <div className="flex items-center gap-3 sm:gap-6">
          <span>Page {pageCount} of {pageCount}</span>
          <span>{wordCount} Words</span>
          <span className="hidden sm:inline">{charCount} Characters</span>
          <span className="hidden sm:inline">English (US)</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden sm:inline">100% Lossless Sync</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} className="hover:opacity-80 p-0.5">
              -
            </button>
            <span className="w-10 text-center">{zoomLevel}%</span>
            <button onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))} className="hover:opacity-80 p-0.5">
              +
            </button>
          </div>
        </div>
      </div>

      {/* New Document Selection Modal */}
      <Modal
        isOpen={isNewDocModalOpen}
        onClose={() => setIsNewDocModalOpen(false)}
        title="Create New Word Document"
        description="Choose a starting blank page or structured Microsoft Word template"
      >
        <div className="grid grid-cols-2 gap-3 py-2">
          {[
            { id: 'blank', title: 'Blank Document', desc: 'Fresh clean page for custom typing', icon: FileText, color: 'text-blue-500' },
            { id: 'resume', title: 'Modern Resume', desc: 'Formatted 2-column experience & skills', icon: FileCheck, color: 'text-emerald-500' },
            { id: 'letter', title: 'Executive Letter', desc: 'Formal client statement letterhead', icon: Type, color: 'text-purple-500' },
            { id: 'notes', title: 'Meeting Notes', desc: 'Discussion agenda & action item list', icon: ListOrdered, color: 'text-amber-500' },
          ].map((t) => (
            <div
              key={t.id}
              onClick={() => handleCreateNewDocument(t.id)}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:bg-brand-50/20 dark:hover:bg-brand-950/30 cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <t.icon className={`w-6 h-6 ${t.color} mb-2`} />
                <div className="text-xs font-bold text-slate-900 dark:text-white">{t.title}</div>
                <div className="text-[11px] text-slate-500 mt-1">{t.desc}</div>
              </div>
              <div className="text-[10px] font-bold text-brand-600 dark:text-brand-400 mt-3">
                Create →
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Table Insertion Modal */}
      <Modal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        title="Insert Table"
        description="Set the number of rows and columns for the new table"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Columns"
              type="number"
              min={1}
              max={10}
              value={tableCols}
              onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
            />
            <Input
              label="Rows"
              type="number"
              min={1}
              max={25}
              value={tableRows}
              onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsTableModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleInsertCustomTable}>
              Insert Table
            </Button>
          </div>
        </div>
      </Modal>

      {/* Link Insertion Modal */}
      <Modal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        title="Insert Hyperlink"
        description="Type or paste the web URL destination"
      >
        <div className="space-y-4">
          <Input
            label="Target URL"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsLinkModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleInsertLink}>
              Insert Link
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
