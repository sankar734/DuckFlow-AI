import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  FileText,
  Languages,
  CheckCheck,
  Send,
  Loader2,
  ChevronDown,
  Copy,
  Plus,
} from 'lucide-react';
import { aiService } from '../../services/aiService';
import { Button } from '../common/Button';
import { toast } from 'sonner';

export interface AIAssistantPanelProps {
  onInsertContent?: (text: string) => void;
  onInsertText?: (text: string) => void;
  currentDocumentContent?: string;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  onInsertContent,
  onInsertText,
  currentDocumentContent,
}) => {
  const insertHandler = onInsertContent || onInsertText;
  const [prompt, setPrompt] = useState('');
  const [selectedAction, setSelectedAction] = useState('rewrite');
  const [isLoading, setIsLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState('');

  const quickPrompts = [
    { label: 'Rewrite for Clarity', action: 'rewrite' },
    { label: 'Expand Content', action: 'expand' },
    { label: 'Summarize', action: 'summarize' },
    { label: 'Make Professional', action: 'professional' },
    { label: 'Fix Grammar', action: 'grammar' },
    { label: 'Translate to Spanish', action: 'translate', lang: 'Spanish' },
  ];

  const handleExecuteAI = async (action: string = selectedAction, lang?: string) => {
    setIsLoading(true);
    try {
      const textToProcess = prompt || currentDocumentContent || 'Executive overview of project milestones and deliverables.';
      const res = await aiService.aiWriter({
        action,
        content: textToProcess,
        targetLanguage: lang || 'Spanish',
      });
      setAiOutput(res.result);
      toast.success('AI generation completed!');
    } catch {
      toast.error('AI request failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-purple-600 to-brand-600 text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">AI Assistant</h3>
            <p className="text-[10px] text-slate-400">Context-Aware Document Copilot</p>
          </div>
        </div>
      </div>

      {/* Quick Actions Scrollable Chips */}
      <div className="my-3">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Suggested Actions
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((q, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedAction(q.action);
                handleExecuteAI(q.action, q.lang);
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Output Display Area */}
      <div className="flex-1 min-h-[160px] bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 overflow-y-auto my-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed shadow-inner">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
            <span className="text-[11px] animate-pulse">DocuFlow AI is drafting...</span>
          </div>
        ) : aiOutput ? (
          <div className="space-y-3">
            <div className="whitespace-pre-wrap">{aiOutput}</div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {insertHandler && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => {
                    insertHandler(aiOutput);
                    toast.success('Inserted AI content into active canvas');
                  }}
                >
                  Insert to Doc
                </Button>
              )}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(aiOutput);
                  toast.success('Copied to clipboard');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 text-[11px] p-4">
            <Wand2 className="w-6 h-6 text-slate-300 dark:text-slate-700 mb-2" />
            <span>Select a prompt or ask AI to write, expand, format, or summarize your text.</span>
          </div>
        )}
      </div>

      {/* Prompt Input Box */}
      <div className="pt-2">
        <div className="relative">
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask AI to improve this document..."
            className="w-full p-2.5 pr-10 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleExecuteAI();
              }
            }}
          />
          <button
            onClick={() => handleExecuteAI()}
            disabled={isLoading}
            className="absolute right-2 bottom-3 p-1.5 rounded-lg bg-gradient-to-tr from-purple-600 to-brand-600 text-white disabled:opacity-50 hover:scale-105 transition-transform"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
