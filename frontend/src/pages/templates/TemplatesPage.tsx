import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutTemplate,
  Search,
  Star,
  FileText,
  Table,
  Presentation,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { toast } from 'sonner';

export const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  const categories = ['All', 'Resume', 'Business', 'Education', 'Reports', 'Invoice', 'Presentation'];

  const templates = [
    {
      id: 't1',
      title: 'Modern Executive Resume',
      category: 'Resume',
      type: 'WORD',
      desc: 'Clean two-column resume format with structured experience and skill pills.',
      isPremium: false,
      uses: 1420,
      route: '/word',
    },
    {
      id: 't2',
      title: 'Q3 Financial Budget & Projection',
      category: 'Business',
      type: 'EXCEL',
      desc: 'Quarterly financial forecast spreadsheet with auto-calculating totals and formula rows.',
      isPremium: true,
      uses: 890,
      route: '/excel',
    },
    {
      id: 't3',
      title: 'AI Product Pitch Deck',
      category: 'Presentation',
      type: 'PPT',
      desc: 'Vibrant 8-slide presentation deck designed for startup product launches.',
      isPremium: true,
      uses: 2150,
      route: '/powerpoint',
    },
    {
      id: 't4',
      title: 'Invoice & Service Statement',
      category: 'Invoice',
      type: 'WORD',
      desc: 'Professional billing statement format with line-item table and tax summary.',
      isPremium: false,
      uses: 1670,
      route: '/word',
    },
    {
      id: 't5',
      title: 'Academic Research Paper',
      category: 'Education',
      type: 'WORD',
      desc: 'Standard APA formatted document with abstract, citations, and appendix.',
      isPremium: false,
      uses: 940,
      route: '/word',
    },
    {
      id: 't6',
      title: 'Quarterly KPI Scorecard',
      category: 'Reports',
      type: 'EXCEL',
      desc: 'Track team goals, progress indicators, and quarterly performance benchmarks.',
      isPremium: true,
      uses: 1120,
      route: '/excel',
    },
  ];

  const filtered = templates.filter((t) => {
    const matchCat = activeCategory === 'All' || t.category === activeCategory;
    const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Badge variant="brand" size="sm" className="mb-1">
          Marketplace
        </Badge>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Template Marketplace</h1>
        <p className="text-xs text-slate-400">Pre-built, designer-crafted document, spreadsheet, and slide templates</p>
      </div>

      {/* Category and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === c
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((tmpl) => (
          <div
            key={tmpl.id}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 hover:shadow-xl transition-all duration-200 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <Badge variant={tmpl.type === 'WORD' ? 'brand' : tmpl.type === 'EXCEL' ? 'success' : 'warning'} size="sm">
                  {tmpl.type}
                </Badge>
                {tmpl.isPremium && <Badge variant="purple" size="sm">PRO</Badge>}
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 group-hover:text-brand-500 transition-colors">
                {tmpl.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{tmpl.desc}</p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">{tmpl.uses.toLocaleString()} uses</span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  toast.success(`Loaded template: ${tmpl.title}`);
                  navigate(tmpl.route);
                }}
              >
                Use Template
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
