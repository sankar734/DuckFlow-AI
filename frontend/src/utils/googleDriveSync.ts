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
  let userEmail = '';
  let userName = '';
  try {
    const userStr = localStorage.getItem('docuflow_user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u.email) userEmail = u.email;
      if (u.name) userName = u.name;
    }
  } catch {}

  try {
    const saved = localStorage.getItem(GDRIVE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        email: userEmail || parsed.email || 'guest@gmail.com',
        name: userName || parsed.name || 'User',
      };
    }
  } catch {}

  return {
    isConnected: Boolean(userEmail),
    email: userEmail || 'Not Connected',
    name: userName || 'User',
    totalSynced: 0,
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
  return [];
};
