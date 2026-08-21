import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  FileText,
  Table,
  Presentation,
  FileStack,
  Layers,
  Camera,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Star,
  Users,
  Lock,
  Globe,
  FileCheck,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    { title: 'AI Document Creation', desc: 'Generate multi-page structured reports, resumes, and proposals in seconds.', icon: Sparkles, color: 'text-purple-500' },
    { title: 'Word Document Studio', desc: 'Full-featured document formatting with live conversational AI copilot.', icon: FileText, color: 'text-blue-500' },
    { title: 'Excel Workspace', desc: 'Interactive spreadsheet formulas, automatic chart visualizers, and data insights.', icon: Table, color: 'text-emerald-500' },
    { title: 'PowerPoint Builder', desc: 'Generate 10-slide decks from natural language prompts with custom themes.', icon: Presentation, color: 'text-amber-500' },
    { title: '18+ PDF Tool Suite', desc: 'Merge, split, compress, protect, watermark, rotate, and unlock PDF files.', icon: FileStack, color: 'text-rose-500' },
    { title: 'Universal File Converter', desc: 'Lossless batch conversion between DOCX, XLSX, PPTX, PDF, and Images.', icon: Layers, color: 'text-indigo-500' },
    { title: 'Mobile Camera OCR', desc: 'Camera edge-detection and instant OCR text extraction on any device.', icon: Camera, color: 'text-purple-500' },
    { title: 'Team Collaboration', desc: 'Granular permissions (Viewer, Commenter, Editor) and real-time cursor sync.', icon: Users, color: 'text-teal-500' },
  ];

  const faqs = [
    { q: 'What file formats does DocuFlow AI support?', a: 'DocuFlow AI natively supports Microsoft Word (.docx), Excel (.xlsx), PowerPoint (.pptx), PDF documents, CSV datasets, plain text (.txt), and major image formats (JPEG, PNG, WEBP).' },
    { q: 'How does the AI credit system work?', a: 'Every plan includes a monthly allocation of AI credits. Standard operations like rewriting or summarizing cost 1 credit, while full multi-page document and presentation generations cost 2 to 3 credits.' },
    { q: 'Is my document data private and secure?', a: 'Yes. All documents are encrypted in transit with TLS 1.3 and at rest with AES-256 zero-trust encryption. Your private files are never used to train public AI models.' },
    { q: 'Can I use DocuFlow AI on mobile devices?', a: 'Absolutely! DocuFlow is built mobile-first, complete with a native-feeling mobile camera scanner, responsive touch toolbars, and bottom tab navigation.' },
    { q: 'Can I cancel or switch my plan anytime?', a: 'Yes. You can upgrade, downgrade, or cancel your subscription at any time directly from the Billing settings.' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Floating Navbar */}
      <nav className="sticky top-0 z-50 glass-panel border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-glow">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
            DocuFlow <span className="text-brand-500">AI</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <a href="#features" className="hover:text-brand-500 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-brand-500 transition-colors">How It Works</a>
          <a href="#conversions" className="hover:text-brand-500 transition-colors">Conversions</a>
          <a href="#pricing" className="hover:text-brand-500 transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-brand-500 transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="gradient" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Open Workspace
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 max-w-6xl mx-auto text-center overflow-hidden">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 text-xs font-semibold mb-8 animate-bounce">
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen AI Document Productivity
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6">
          Create. Convert. <br />
          <span className="bg-gradient-to-r from-brand-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            Understand.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
          One intelligent workspace for Word documents, spreadsheets, presentations, PDFs, universal file conversions, and camera OCR — empowered by generative AI.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link to="/dashboard">
            <Button variant="gradient" size="lg" className="w-full sm:w-auto text-base shadow-glow-lg">
              Start Creating Free
            </Button>
          </Link>
          <a href="#features">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
              Explore All Features
            </Button>
          </a>
        </div>

        {/* Hero Interactive Workspace Preview Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative max-w-5xl mx-auto rounded-3xl p-3 bg-gradient-to-b from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-950 shadow-2xl border border-slate-200 dark:border-slate-800"
        >
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 sm:p-8 text-left shadow-inner border border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono text-slate-400 ml-2">DocuFlow Studio — Live Preview</span>
              </div>
              <Badge variant="brand" size="sm">
                AI Active
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    Quarterly Strategic Growth & Revenue Plan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Automated executive draft synthesized with embedded real-time spreadsheet forecast metrics and market expansion benchmarks.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 text-center">
                    <div className="text-lg font-black text-blue-600 dark:text-blue-400">98.5%</div>
                    <div className="text-[10px] text-slate-400 font-medium">Conversion Rate</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 text-center">
                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">4x Faster</div>
                    <div className="text-[10px] text-slate-400 font-medium">Authoring Speed</div>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/50 text-center">
                    <div className="text-lg font-black text-purple-600 dark:text-purple-400">256-bit</div>
                    <div className="text-[10px] text-slate-400 font-medium">Encryption</div>
                  </div>
                </div>
              </div>

              {/* Simulated AI Assistant Sidecard */}
              <div className="p-4 rounded-2xl bg-gradient-to-tr from-purple-500/10 to-brand-500/10 border border-purple-500/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 mb-2">
                    <Sparkles className="w-3.5 h-3.5" /> Copilot Suggestion
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    "I analyzed your spreadsheet data and generated a 5-slide summary deck ready for stakeholder distribution."
                  </p>
                </div>
                <Button variant="gradient" size="sm" className="mt-4 w-full text-xs" onClick={() => navigate('/dashboard')}>
                  Accept & Insert
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-4 sm:px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="purple" size="sm" className="mb-3">
            Core Modules
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Everything You Need in One Unified Suite
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
            Eliminate app fatigue. Seamlessly transition between Word editing, spreadsheets, slide presentations, and PDF transformations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 w-fit mb-4">
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">{f.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Universal Conversion Visualizer Section */}
      <section id="conversions" className="py-20 px-4 sm:px-6 bg-slate-100 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="brand" size="sm" className="mb-3">
            Universal Conversion Engine
          </Badge>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-12">
            Lossless Conversion in 1-Click
          </h2>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-xs font-bold">
            <div className="flex gap-2">
              {['Word DOCX', 'Excel XLSX', 'PowerPoint PPTX', 'Images & Text'].map((fmt) => (
                <span key={fmt} className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm text-slate-800 dark:text-slate-200">
                  {fmt}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 text-brand-500 font-mono">
              <span className="hidden md:inline">──────</span>
              <div className="p-3 rounded-2xl bg-brand-600 text-white shadow-glow">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="hidden md:inline">──────</span>
            </div>

            <div className="flex gap-2">
              {['PDF Format', 'DOCX Ready', 'XLSX Spreadsheet', 'PPTX Slides'].map((fmt) => (
                <span key={fmt} className="px-3 py-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-300 dark:border-brand-800 text-brand-600 dark:text-brand-300">
                  {fmt}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section id="pricing" className="py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="brand" size="sm" className="mb-3">
            Transparent Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Plans Built for Individuals and Teams
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
            Start for free, scale with powerful AI credits and enterprise collaboration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* FREE */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">FREE</h3>
              <div className="text-3xl font-black my-4 text-slate-900 dark:text-white">
                ₹0 <span className="text-xs font-normal text-slate-400">/ month</span>
              </div>
              <p className="text-xs text-slate-500 mb-6">Perfect for basic personal document editing.</p>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Basic Word & Excel Editor</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 50 AI Credits / Month</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 5GB Cloud Storage</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Standard PDF Tools</li>
              </ul>
            </div>
            <Link to="/dashboard" className="mt-8">
              <Button variant="outline" size="md" className="w-full">Get Started</Button>
            </Link>
          </div>

          {/* PRO */}
          <div className="relative p-8 rounded-3xl bg-gradient-to-b from-brand-50 to-white dark:from-slate-800 dark:to-slate-900 border-2 border-brand-500 flex flex-col justify-between shadow-glow">
            <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-brand-600 to-purple-600 text-white text-[10px] font-bold uppercase tracking-wider">
              Most Popular
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">PRO</h3>
              <div className="text-3xl font-black my-4 text-brand-600 dark:text-brand-400">
                ₹799 <span className="text-xs font-normal text-slate-400">/ month</span>
              </div>
              <p className="text-xs text-slate-500 mb-6">For professionals and power users needing deep AI.</p>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 500 AI Credits / Month</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 50GB High-Speed Storage</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> AI Document & PPT Generator</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> High-Accuracy Mobile OCR</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 100 Daily Conversions</li>
              </ul>
            </div>
            <Link to="/billing" className="mt-8">
              <Button variant="gradient" size="md" className="w-full">Upgrade to Pro</Button>
            </Link>
          </div>

          {/* BUSINESS */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">BUSINESS</h3>
              <div className="text-3xl font-black my-4 text-slate-900 dark:text-white">
                ₹1,999 <span className="text-xs font-normal text-slate-400">/ month</span>
              </div>
              <p className="text-xs text-slate-500 mb-6">For teams and organizations collaborating at scale.</p>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 2,500 AI Credits / Month</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 250GB Team Storage</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Team Workspaces & Roles</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Unlimited Bulk Conversions</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Admin Analytics & Audit Logs</li>
              </ul>
            </div>
            <Link to="/billing" className="mt-8">
              <Button variant="outline" size="md" className="w-full">Choose Business</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20 px-4 sm:px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900 dark:text-white"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">DocuFlow AI</span>
            <span>— © 2026 All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/documents" className="hover:underline">Documents</Link>
            <Link to="/ai" className="hover:underline">AI Studio</Link>
            <Link to="/billing" className="hover:underline">Pricing</Link>
            <Link to="/settings" className="hover:underline">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
