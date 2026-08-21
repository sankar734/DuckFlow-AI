import React, { useState, useEffect, useRef } from 'react';
import {
  FolderClosed,
  FolderPlus,
  Search,
  Filter,
  Grid,
  List as ListIcon,
  Plus,
  ArrowUpDown,
  UploadCloud,
  Folder,
  Download,
  Trash2,
  Share2,
  Copy,
  Edit2,
} from 'lucide-react';
import { documentService } from '../../services/documentService';
import { DocumentItem } from '../../types/document';
import { DocumentCard } from '../../components/documents/DocumentCard';
import { ShareModal } from '../../components/documents/ShareModal';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useUIStore } from '../../store/uiStore';
import { toast } from 'sonner';

export const MyDocumentsPage: React.FC = () => {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const { activeShareDocId, openShareModal, closeShareModal } = useUIStore();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [folders, setFolders] = useState<Array<{ id: string; name: string; docCount: number }>>([
    { id: 'f1', name: 'Work & Strategy', docCount: 4 },
    { id: 'f2', name: 'Financial Models', docCount: 2 },
    { id: 'f3', name: 'Client Invoices', docCount: 3 },
  ]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // New Folder Modal
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Rename Document Modal
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    documentService.getDocuments().then(setDocuments);
  }, []);

  const filterTypes = ['ALL', 'WORD', 'EXCEL', 'PPT', 'PDF'];

  const handleUploadFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newDocs: DocumentItem[] = Array.from(files).map((file, idx) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let type: 'WORD' | 'EXCEL' | 'PPT' | 'PDF' = 'WORD';
      if (ext.includes('xls') || ext.includes('csv')) type = 'EXCEL';
      else if (ext.includes('ppt')) type = 'PPT';
      else if (ext.includes('pdf')) type = 'PDF';

      return {
        _id: `upload_${Date.now()}_${idx}`,
        ownerId: 'usr_demo_123',
        name: file.name,
        type,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        status: 'ACTIVE',
        isFavorite: false,
        isDeleted: false,
        currentVersionNumber: 1,
        folderId: selectedFolder || undefined,
        metadata: { wordCount: 420 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    setDocuments((prev) => [...newDocs, ...prev]);
    toast.success(`Successfully uploaded ${files.length} document(s)!`);
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setFolders((prev) => [
      ...prev,
      { id: `folder_${Date.now()}`, name: newFolderName.trim(), docCount: 0 },
    ]);
    setNewFolderName('');
    setIsFolderModalOpen(false);
    toast.success('Folder created successfully!');
  };

  const handleRenameSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc || !renameValue.trim()) return;
    setDocuments((prev) =>
      prev.map((d) => (d._id === editingDoc._id ? { ...d, name: renameValue.trim() } : d))
    );
    setEditingDoc(null);
    toast.success('Document renamed!');
  };

  const handleDuplicate = (doc: DocumentItem) => {
    const dup: DocumentItem = {
      ...doc,
      _id: `dup_${Date.now()}`,
      name: `Copy_of_${doc.name}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDocuments((prev) => [dup, ...prev]);
    toast.success(`Duplicated "${doc.name}"`);
  };

  const handleFavoriteToggle = (id: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d._id === id ? { ...d, isFavorite: !d.isFavorite } : d))
    );
    toast.success('Updated favorite status');
  };

  const handleDelete = (id: string) => {
    documentService.moveToTrash(id);
    setDocuments((prev) => prev.filter((d) => d._id !== id));
    toast.success('Document moved to trash');
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesType = activeFilter === 'ALL' || doc.type === activeFilter;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = !selectedFolder || doc.folderId === selectedFolder;
    return matchesType && matchesSearch && matchesFolder;
  });

  return (
    <div className="space-y-6">
      {/* Hidden Native File Input */}
      <input
        type="file"
        ref={uploadInputRef}
        onChange={(e) => handleUploadFiles(e.target.files)}
        multiple
        className="hidden"
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">My Documents</h1>
          <p className="text-xs text-slate-400">Manage and organize all your cloud files, spreadsheets, and folders</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FolderPlus className="w-4 h-4" />}
            onClick={() => setIsFolderModalOpen(true)}
          >
            New Folder
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<UploadCloud className="w-4 h-4" />}
            onClick={() => uploadInputRef.current?.click()}
          >
            Upload from Disk
          </Button>

          <Button
            variant="gradient"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => uploadInputRef.current?.click()}
          >
            Add Files
          </Button>
        </div>
      </div>

      {/* Folders Bar */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedFolder(null)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
            selectedFolder === null
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <FolderClosed className="w-4 h-4" />
          <span>All Documents</span>
        </button>

        {folders.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFolder(f.id === selectedFolder ? null : f.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedFolder === f.id
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-brand-500'
            }`}
          >
            <Folder className="w-4 h-4 text-amber-500" />
            <span>{f.name}</span>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {filterTypes.map((type) => (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeFilter === type
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <UploadCloud className="w-8 h-8 mx-auto opacity-40 text-brand-500" />
          <div>No documents found. Click below to select files from your computer folder.</div>
          <Button variant="outline" size="sm" onClick={() => uploadInputRef.current?.click()}>
            Browse Files
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredDocs.map((doc) => (
            <DocumentCard
              key={doc._id}
              document={doc}
              onFavoriteToggle={handleFavoriteToggle}
              onShare={openShareModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* New Folder Modal */}
      <Modal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        title="Create New Folder"
        description="Organize documents into categorized folders"
      >
        <form onSubmit={handleCreateFolder} className="space-y-4">
          <Input
            label="Folder Name"
            placeholder="e.g. Q4 Financials"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            required
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsFolderModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Create Folder
            </Button>
          </div>
        </form>
      </Modal>

      {/* Share Modal */}
      <ShareModal
        isOpen={!!activeShareDocId}
        onClose={closeShareModal}
        documentId={activeShareDocId || undefined}
      />
    </div>
  );
};
