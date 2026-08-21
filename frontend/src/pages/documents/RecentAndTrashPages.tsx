import React, { useState, useEffect } from 'react';
import { Clock, Trash2, RotateCcw, ShieldAlert, Share2 } from 'lucide-react';
import { documentService } from '../../services/documentService';
import { DocumentItem } from '../../types/document';
import { DocumentCard } from '../../components/documents/DocumentCard';
import { Button } from '../../components/common/Button';
import { toast } from 'sonner';

export const RecentDocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  useEffect(() => {
    documentService.getRecent().then(setDocuments);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-brand-500" /> Recent Documents
        </h1>
        <p className="text-xs text-slate-400">Files and workspaces you've accessed recently</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {documents.map((doc) => (
          <DocumentCard key={doc._id} document={doc} />
        ))}
      </div>
    </div>
  );
};

export const SharedWithMePage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  useEffect(() => {
    documentService.getDocuments().then((docs) => setDocuments(docs.slice(1, 3)));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Share2 className="w-5 h-5 text-teal-500" /> Shared With Me
        </h1>
        <p className="text-xs text-slate-400">Documents and spreadsheets shared by your teammates</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {documents.map((doc) => (
          <DocumentCard key={doc._id} document={doc} />
        ))}
      </div>
    </div>
  );
};

export const TrashPage: React.FC = () => {
  const [trashItems, setTrashItems] = useState<DocumentItem[]>([
    {
      _id: 'trash_1',
      ownerId: 'usr_demo_123',
      name: 'Old_Marketing_Brief_2025.docx',
      type: 'WORD',
      mimeType: 'application/docx',
      size: 1024 * 32,
      status: 'TRASHED',
      isFavorite: false,
      isDeleted: true,
      currentVersionNumber: 1,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  const handleRestore = (id: string) => {
    setTrashItems((prev) => prev.filter((d) => d._id !== id));
    toast.success('Document restored to My Documents!');
  };

  const handlePermanentDelete = (id: string) => {
    setTrashItems((prev) => prev.filter((d) => d._id !== id));
    toast.success('Document permanently deleted.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-500" /> Trash & Recovery
          </h1>
          <p className="text-xs text-slate-400">Items in trash are automatically deleted after 30 days</p>
        </div>

        {trashItems.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setTrashItems([]);
              toast.success('Trash emptied completely.');
            }}
          >
            Empty Trash
          </Button>
        )}
      </div>

      {trashItems.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          Trash is empty.
        </div>
      ) : (
        <div className="space-y-2">
          {trashItems.map((doc) => (
            <div
              key={doc._id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{doc.name}</div>
                <div className="text-xs text-slate-400">{doc.type} • {(doc.size / 1024).toFixed(1)} KB</div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  onClick={() => handleRestore(doc._id)}
                >
                  Restore
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => handlePermanentDelete(doc._id)}
                >
                  Delete Forever
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
