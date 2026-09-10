import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

interface FooterProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const Footer: React.FC<FooterProps> = ({ className = '', variant = 'full' }) => {
  const linkedinUrl =
    'https://www.linkedin.com/in/sankar-s-707792291/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BqVCs3j3tQAurygkWC7HhVQ%3D%3D';

  if (variant === 'compact') {
    return (
      <footer
        className={`w-full py-4 px-4 sm:px-6 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-xs text-slate-500 dark:text-slate-400 mt-auto ${className}`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-brand-600 flex items-center justify-center text-white">
              <Sparkles className="w-3 h-3" />
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">DocuFlow AI</span>
            <span>— © 2026</span>
          </div>

          <div className="flex items-center gap-2">
            <span>Created by</span>
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0077B5] dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-800/80 hover:bg-[#0077B5] hover:text-white dark:hover:bg-[#0077B5] dark:hover:text-white transition-all duration-200 shadow-sm group cursor-pointer"
              title="Visit Sankar S on LinkedIn"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
              <span>Sankar S</span>
              <span className="text-[11px] opacity-70 group-hover:opacity-100 transition-opacity">↗</span>
            </a>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className={`w-full py-10 px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-500 dark:text-slate-400 mt-auto ${className}`}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">DocuFlow AI</span>
            <span>— © 2026 All rights reserved.</span>
          </div>

          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>

          <div className="flex items-center gap-2">
            <span>Created by</span>
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0077B5] dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-800/80 hover:bg-[#0077B5] hover:text-white dark:hover:bg-[#0077B5] dark:hover:text-white transition-all duration-200 shadow-sm group cursor-pointer"
              title="Connect with Sankar S on LinkedIn"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
              <span>Sankar S</span>
              <span className="text-[11px] opacity-70 group-hover:opacity-100 transition-opacity">↗</span>
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6">
          <Link to="/documents" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Documents
          </Link>
          <Link to="/ai" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            AI Studio
          </Link>
          <Link to="/billing" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Pricing
          </Link>
          <Link to="/settings" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Security
          </Link>
        </div>
      </div>
    </footer>
  );
};
