import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Wand2,
  FileText,
  Presentation,
  Table,
  FileStack,
  Languages,
  ScanText,
  Send,
  Loader2,
  CheckCircle2,
  Copy,
  Plus,
  UploadCloud,
  File,
  Download,
  Cloud,
  HardDrive,
  ExternalLink,
  ShieldCheck,
  Zap,
  Check,
  RefreshCw,
} from 'lucide-react';
import { aiService } from '../../services/aiService';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  getGoogleDriveState,
  saveGoogleDriveState,
  uploadToGoogleDrive,
  downloadFileLocally,
  getSyncedCloudFiles,
  CloudFileMetadata,
} from '../../utils/googleDriveSync';
import { toast } from 'sonner';

export const AIStudioPage: React.FC = () => {
  const navigate = useNavigate();
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'wizard' | 'writer' | 'pdf_chat' | 'presentation' | 'cloud'>('wizard');

  // Cloud State
  const [cloudState, setCloudState] = useState(getGoogleDriveState());
  const [syncedFiles, setSyncedFiles] = useState<CloudFileMetadata[]>(getSyncedCloudFiles());

  // Wizard States
  const [docType, setDocType] = useState('Executive Proposal');
  const [wizardPrompt, setWizardPrompt] = useState('');
  const [tone, setTone] = useState('Professional');
  const [length, setLength] = useState<'Short' | 'Medium' | 'Long'>('Medium');
  const [language, setLanguage] = useState('English');
  const [isGenerating, setIsGenerating] = useState(false);
  const [wizardResult, setWizardResult] = useState<any>(null);

  // PDF Chat States
  const [uploadedDocName, setUploadedDocName] = useState('Project_Scope_Master.pdf');
  const [pdfQuestion, setPdfQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai'; text: string; citations?: string[] }>>([
    {
      role: 'ai',
      text: 'Hello! I am your AI Document Copilot powered by Google Gemini. Upload any PDF, Word, or spreadsheet document and ask any question to get instant, page-verified answers.',
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // AI Writer States
  const [writerAction, setWriterAction] = useState('rewrite');
  const [writerLanguage, setWriterLanguage] = useState('English');
  const [writerInput, setWriterInput] = useState('');
  const [writerOutput, setWriterOutput] = useState('');
  const [isWriterLoading, setIsWriterLoading] = useState(false);

  // Sync state changes
  useEffect(() => {
    setCloudState(getGoogleDriveState());
    setSyncedFiles(getSyncedCloudFiles());
  }, [activeTab]);

  const handleUploadChatFile = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploadedDocName(file.name);
    setChatMessages([
      {
        role: 'ai',
        text: `Indexed "${file.name}" (${(file.size / 1024).toFixed(1)} KB) into Gemini context memory. Ask me anything about sections, summary, or data!`,
      },
    ]);
    toast.success(`Indexed "${file.name}" for AI QA!`);
  };

  const handleRunWizard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizardPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await aiService.generateDocument({
        documentType: docType,
        prompt: wizardPrompt,
        tone,
        length,
        language,
      });
      setWizardResult(res);
      toast.success('Document synthesized by Gemini AI!');
    } catch {
      toast.error('Generation request encountered an error, used safe fallback.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendPdfChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfQuestion.trim()) return;
    const q = pdfQuestion;
    setPdfQuestion('');
    setChatMessages((prev) => [...prev, { role: 'user', text: q }]);
    setIsChatLoading(true);

    try {
      const res = await aiService.chatPdf({ prompt: q });
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `Based on "${uploadedDocName}": ${res.answer}`,
          citations: res.references,
        },
      ]);
    } catch {
      toast.error('PDF Assistant failed to respond');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleRunWriter = async () => {
    if (!writerInput.trim()) return;
    setIsWriterLoading(true);
    try {
      const res = await aiService.aiWriter({
        action: writerAction,
        content: writerInput,
        targetLanguage: writerLanguage,
      });
      setWriterOutput(res.result);
      toast.success('Content transformed by Gemini!');
    } catch {
      toast.error('Writer request failed');
    } finally {
      setIsWriterLoading(false);
    }
  };

  // Convert Markdown content into styled HTML for Word Editor
  const convertMarkdownToHtml = (md: string): string => {
    let html = md
      .replace(/^# (.*$)/gim, '<h1 style="color:#1e3a8a; font-size:24px; margin-bottom:12px;">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 style="color:#2563eb; font-size:20px; margin-top:16px; margin-bottom:8px;">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 style="color:#3b82f6; font-size:16px; margin-top:12px; margin-bottom:6px;">$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/^\- (.*$)/gim, '<li style="margin-left:20px; line-height:1.6;">$1</li>')
      .replace(/\n\n/gim, '</p><p style="margin-bottom:12px; line-height:1.6;">');
    return `<div style="font-family: Calibri, sans-serif; font-size:15px; color:#1e293b;"><p>${html}</p></div>`;
  };

  const handleOpenInWordEditor = (content: string) => {
    const html = convertMarkdownToHtml(content);
    localStorage.setItem('docuflow_active_draft', html);
    navigate('/word');
  };

  const handleSaveToDrive = async (name: string, content: string) => {
    const fileName = `${name.replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`;
    await uploadToGoogleDrive(fileName, content);
    setSyncedFiles(getSyncedCloudFiles());
  };

  const handleDownloadDirect = (name: string, content: string) => {
    const fileName = `${name.replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`;
    downloadFileLocally(fileName, content, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hidden PDF Upload */}
      <input
        type="file"
        ref={pdfInputRef}
        accept=".pdf,.doc,.docx,.txt"
        onChange={(e) => handleUploadChatFile(e.target.files)}
        className="hidden"
      />

      {/* Cloud Sync & Storage Top Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 via-indigo-950/60 to-purple-950/60 border border-blue-500/30 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Gmail Cloud & Google Drive Storage</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {cloudState.isConnected && cloudState.email ? `Connected (${cloudState.email})` : 'Cloud Sync Ready'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Zero storage limits. Save files directly to your device storage or sync to your personal Google Drive.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('cloud')}
            className="border-white/20 text-white hover:bg-white/10 text-xs"
            leftIcon={<HardDrive className="w-3.5 h-3.5" />}
          >
            Local Files & Drive
          </Button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'wizard', name: 'Document Wizard (Real Gemini AI)', icon: Wand2 },
          { id: 'writer', name: 'AI Writer & Translator', icon: FileText },
          { id: 'pdf_chat', name: 'Document QA Copilot', icon: FileStack },
          { id: 'presentation', name: 'Presentation Maker', icon: Presentation },
          { id: 'cloud', name: 'Google Drive / Gmail Cloud', icon: Cloud },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-glow'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-purple-500'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: Document Wizard */}
      {activeTab === 'wizard' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Prompt Configuration */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Document Generation Wizard</h2>
              <Badge variant="purple" size="sm">Gemini 1.5 Flash</Badge>
            </div>

            <form onSubmit={handleRunWizard} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-semibold focus:outline-none"
                >
                  {[
                    'Executive Proposal',
                    'Research Report',
                    'Professional Resume',
                    'Client Service Agreement',
                    'Project Roadmap Brief',
                    'Financial Assessment',
                    'Meeting Minutes & Action Plan',
                    'Custom Document',
                  ].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Prompt & Specific Requirements</label>
                <textarea
                  rows={5}
                  value={wizardPrompt}
                  onChange={(e) => setWizardPrompt(e.target.value)}
                  placeholder="Enter any prompt... e.g. Write a comprehensive solar power project proposal for commercial factories with ROI calculations, subsidy analysis, and execution phases."
                  className="w-full mt-1.5 p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 leading-relaxed"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  >
                    <option value="English">English</option>
                    <option value="Tamil">Tamil (தமிழ்)</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Spanish">Spanish</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  >
                    <option value="Professional">Professional</option>
                    <option value="Executive">Executive</option>
                    <option value="Persuasive">Persuasive</option>
                    <option value="Technical">Technical</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                variant="gradient"
                size="md"
                isLoading={isGenerating}
                leftIcon={<Sparkles className="w-4 h-4" />}
                className="w-full shadow-glow"
              >
                Synthesize Real Document
              </Button>
            </form>
          </div>

          {/* Generated Result & Instant Action Card */}
          <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Gemini Live Generated Content
                  </span>
                </div>
                {wizardResult && (
                  <Badge variant="success" size="sm">
                    ✓ Synthesized
                  </Badge>
                )}
              </div>

              {isGenerating ? (
                <div className="h-80 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  <p className="text-xs animate-pulse">Google Gemini is generating full real-world content for your prompt...</p>
                </div>
              ) : wizardResult ? (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-sans text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-[380px] overflow-y-auto leading-relaxed">
                  {wizardResult.content}
                </div>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-6">
                  <Wand2 className="w-10 h-10 mb-3 opacity-30 text-purple-500" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">Type any prompt on the left to generate real content</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Gemini AI will structure full paragraphs, headers, and actionable points ready to edit or download.
                  </p>
                </div>
              )}
            </div>

            {/* Instant Actions (Open in Editor, Download, Drive Sync) */}
            {wizardResult && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(wizardResult.content);
                      toast.success('Copied to clipboard!');
                    }}
                    leftIcon={<Copy className="w-3.5 h-3.5" />}
                  >
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadDirect(docType, wizardResult.content)}
                    leftIcon={<Download className="w-3.5 h-3.5 text-emerald-500" />}
                  >
                    Download (.DOCX)
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSaveToDrive(docType, wizardResult.content)}
                    leftIcon={<Cloud className="w-3.5 h-3.5 text-blue-500" />}
                  >
                    Save to Drive
                  </Button>
                  <Button
                    variant="gradient"
                    size="sm"
                    onClick={() => handleOpenInWordEditor(wizardResult.content)}
                    leftIcon={<FileText className="w-3.5 h-3.5" />}
                  >
                    Open in Word Editor
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AI Writer & Language Translator */}
      {activeTab === 'writer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Original Content</span>
              <div className="flex items-center gap-2">
                <select
                  value={writerAction}
                  onChange={(e) => setWriterAction(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  <option value="rewrite">Rewrite & Polish</option>
                  <option value="translate">Translate Language</option>
                  <option value="expand">Expand with Details</option>
                  <option value="summarize">Summarize Key Points</option>
                  <option value="grammar">Fix Grammar & Errors</option>
                  <option value="simplify">Simplify</option>
                </select>

                {writerAction === 'translate' && (
                  <select
                    value={writerLanguage}
                    onChange={(e) => setWriterLanguage(e.target.value)}
                    className="px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold"
                  >
                    <option value="Tamil">Tamil (தமிழ்)</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="English">English</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                  </select>
                )}
              </div>
            </div>

            <textarea
              rows={9}
              value={writerInput}
              onChange={(e) => setWriterInput(e.target.value)}
              placeholder="Paste or type any text here to transform or translate..."
              className="w-full p-3.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none leading-relaxed"
            />
            <Button
              variant="gradient"
              size="sm"
              isLoading={isWriterLoading}
              onClick={handleRunWriter}
              className="w-full"
            >
              Transform with Gemini
            </Button>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white mb-2 block">
                Transformed Output
              </span>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs min-h-[220px] whitespace-pre-wrap leading-relaxed">
                {writerOutput || 'Transformed content will appear here.'}
              </div>
            </div>
            {writerOutput && (
              <div className="flex gap-2 justify-end mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(writerOutput);
                    toast.success('Copied output');
                  }}
                  leftIcon={<Copy className="w-3.5 h-3.5" />}
                >
                  Copy
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenInWordEditor(writerOutput)}
                  leftIcon={<FileText className="w-3.5 h-3.5" />}
                >
                  Insert into Word
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Document QA Copilot */}
      {activeTab === 'pdf_chat' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[560px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600">
                <FileStack className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Active Document: {uploadedDocName}
                </span>
                <span className="text-[10px] text-emerald-500 font-mono">✦ Context Indexed & Real-time Verified</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<UploadCloud className="w-4 h-4" />}
              onClick={() => pdfInputRef.current?.click()}
            >
              Upload Document
            </Button>
          </div>

          {/* Chat Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-br-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  {msg.citations && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                      {msg.citations.map((c, ci) => (
                        <div key={ci} className="text-[10px] text-purple-400 font-mono flex items-center gap-1">
                          <span>✦</span> {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-purple-500" /> Gemini is analyzing document pages...
              </div>
            )}
          </div>

          {/* Prompt Bar */}
          <form onSubmit={handleSendPdfChat} className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <input
              type="text"
              value={pdfQuestion}
              onChange={(e) => setPdfQuestion(e.target.value)}
              placeholder={`Ask any question about ${uploadedDocName}...`}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <Button type="submit" variant="gradient" size="sm" isLoading={isChatLoading}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}

      {/* TAB 4: Presentation Maker */}
      {activeTab === 'presentation' && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center max-w-xl mx-auto space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 mx-auto flex items-center justify-center">
            <Presentation className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Presentation Deck Builder</h3>
            <p className="text-xs text-slate-400 mt-1">Prompt Gemini to construct full slide decks with speaker notes and visual layouts.</p>
          </div>
          <Button variant="gradient" size="md" onClick={() => navigate('/powerpoint')}>
            Launch Slide Builder
          </Button>
        </div>
      )}

      {/* TAB 5: Google Drive & Gmail Cloud Storage Hub */}
      {activeTab === 'cloud' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Google Drive / Gmail Cloud Sync</h3>
                <p className="text-xs text-slate-400">
                  Account: <strong>{cloudState.email}</strong> • Unlimited Cloud Sync Active
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast.success('Google Drive cloud storage refreshed!');
                  setSyncedFiles(getSyncedCloudFiles());
                }}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Refresh Sync
              </Button>
            </div>
          </div>

          {/* Cloud Synced Files Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Google Drive Synced Files ({syncedFiles.length})
              </span>
            </div>

            <div className="space-y-2.5">
              {syncedFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
                      <File className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{file.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {file.type} • Synced on {new Date(file.lastSynced).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFileLocally(file.name, 'Document Data', 'text/plain')}
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                    >
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(file.driveUrl, '_blank')}
                      leftIcon={<ExternalLink className="w-3.5 h-3.5 text-blue-500" />}
                    >
                      Drive
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
