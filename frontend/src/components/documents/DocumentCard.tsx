import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Table,
  Presentation,
  FileStack,
  Star,
  MoreVertical,
  Download,
  Share2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { DocumentItem } from '../../types/document';
import { Badge } from '../common/Badge';

export interface DocumentCardProps {
  document: DocumentItem;
  onFavoriteToggle?: (id: string) => void;
  onShare?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onFavoriteToggle,
  onShare,
  onDelete,
}) => {
  const navigate = useNavigate();

  const getIcon = () => {
    switch (document.type) {
      case 'WORD':
        return <FileText className="w-6 h-6 text-blue-500" />;
      case 'EXCEL':
      case 'CSV':
        return <Table className="w-6 h-6 text-emerald-500" />;
      case 'PPT':
        return <Presentation className="w-6 h-6 text-amber-500" />;
      case 'PDF':
        return <FileStack className="w-6 h-6 text-rose-500" />;
      default:
        return <FileText className="w-6 h-6 text-slate-400" />;
    }
  };

  const getRoute = () => {
    switch (document.type) {
      case 'WORD':
        return `/word/${document._id}`;
      case 'EXCEL':
      case 'CSV':
        return `/excel/${document._id}`;
      case 'PPT':
        return `/powerpoint/${document._id}`;
      case 'PDF':
        return `/pdf`;
      default:
        return `/word/${document._id}`;
    }
  };

  const formattedSize = (document.size / 1024).toFixed(1) + ' KB';
  const formattedDate = new Date(document.updatedAt || document.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="group relative flex flex-col justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-200">
      {/* Top Bar: Icon, Type Badge & Favorite */}
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 group-hover:scale-105 transition-transform">
          {getIcon()}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onFavoriteToggle?.(document._id)}
            className={`p-1.5 rounded-lg transition-colors ${
              document.isFavorite
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
            }`}
          >
            <Star className="w-4 h-4" />
          </button>

          <button
            onClick={() => onShare?.(document._id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center: Title and Preview metadata */}
      <div className="my-3 cursor-pointer" onClick={() => navigate(getRoute())}>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {document.name}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="slate" size="sm">
            {document.type}
          </Badge>
          <span className="text-[11px] text-slate-400 font-mono">{formattedSize}</span>
        </div>
      </div>

      {/* Bottom Footer: Date & Quick Actions */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span>{formattedDate}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(getRoute())}
            className="flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Open <ExternalLink className="w-3 h-3" />
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(document._id)}
              className="text-slate-400 hover:text-rose-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
