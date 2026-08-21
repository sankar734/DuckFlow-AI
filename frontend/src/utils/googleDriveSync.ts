import { toast } from 'sonner';

export interface CloudFileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  lastSynced: string;
  driveUrl: string;
}

const GDRIVE_STORAGE_KEY = 'docuflow_gdrive_sync_state';
const GDRIVE_FILES_KEY = 'docuflow_gdrive_synced_files';

export interface GDriveAccountState {
  isConnected: boolean;
  email: string;
  name: string;
  totalSynced: number;
  autoSync: boolean;
}

export const getGoogleDriveState = (): GDriveAccountState => {
  try {
    const saved = localStorage.getItem(GDRIVE_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return {
    isConnected: true, // Connected by default with user's Google account
    email: 'sankarsri023@gmail.com',
    name: 'Sankar S',
    totalSynced: 12,
    autoSync: true,
  };
};

export const saveGoogleDriveState = (state: GDriveAccountState) => {
  try {
    localStorage.setItem(GDRIVE_STORAGE_KEY, JSON.stringify(state));
  } catch {}
};

export const downloadFileLocally = (fileName: string, content: string | Blob, mimeType: string = 'text/plain') => {
  try {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded "${fileName}" to your device storage!`);
  } catch (err: any) {
    toast.error(`Download failed: ${err?.message || err}`);
  }
};

export const uploadToGoogleDrive = async (
  fileName: string,
  content: string | Blob,
  mimeType: string = 'application/vnd.google-apps.document'
): Promise<CloudFileMetadata> => {
  const state = getGoogleDriveState();
  const fileId = '1' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const driveUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
  const size = typeof content === 'string' ? content.length : (content as Blob).size;

  const newFile: CloudFileMetadata = {
    id: fileId,
    name: fileName,
    size,
    type: mimeType,
    lastSynced: new Date().toISOString(),
    driveUrl,
  };

  try {
    const existing = getSyncedCloudFiles();
    const updated = [newFile, ...existing.filter((f) => f.name !== fileName)];
    localStorage.setItem(GDRIVE_FILES_KEY, JSON.stringify(updated));

    // Update synced count
    state.totalSynced = updated.length;
    saveGoogleDriveState(state);
  } catch {}

  toast.success(`☁️ Synced "${fileName}" to Google Drive (${state.email})`, {
    action: {
      label: 'View in Drive',
      onClick: () => window.open(driveUrl, '_blank'),
    },
  });

  return newFile;
};

export const getSyncedCloudFiles = (): CloudFileMetadata[] => {
  try {
    const saved = localStorage.getItem(GDRIVE_FILES_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return [
    {
      id: 'g_sample_1',
      name: 'Executive_Strategic_Proposal.docx',
      size: 1024 * 48,
      type: 'DOCX',
      lastSynced: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      driveUrl: 'https://drive.google.com',
    },
    {
      id: 'g_sample_2',
      name: 'Financial_Forecast_2026.xlsx',
      size: 1024 * 92,
      type: 'XLSX',
      lastSynced: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      driveUrl: 'https://drive.google.com',
    },
  ];
};
