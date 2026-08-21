import fs from 'fs';
import path from 'path';

export interface StorageProvider {
  name: string;
  uploadFile(filePath: string, destinationKey: string): Promise<{ storageKey: string; publicUrl: string }>;
  downloadFile(storageKey: string, localDestination: string): Promise<string>;
  deleteFile(storageKey: string): Promise<boolean>;
  getSignedUrl(storageKey: string, expiresInSeconds?: number): Promise<string>;
}

export class LocalStorageProvider implements StorageProvider {
  name = 'LocalStorage';
  private storageDir = path.join(process.cwd(), 'storage');

  constructor() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  async uploadFile(filePath: string, destinationKey: string): Promise<{ storageKey: string; publicUrl: string }> {
    const destPath = path.join(this.storageDir, destinationKey);
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(filePath, destPath);
    return {
      storageKey: destinationKey,
      publicUrl: `/storage/${destinationKey}`,
    };
  }

  async downloadFile(storageKey: string, localDestination: string): Promise<string> {
    const srcPath = path.join(this.storageDir, storageKey);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, localDestination);
      return localDestination;
    }
    throw new Error('File not found in local storage');
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    const srcPath = path.join(this.storageDir, storageKey);
    if (fs.existsSync(srcPath)) {
      fs.unlinkSync(srcPath);
      return true;
    }
    return false;
  }

  async getSignedUrl(storageKey: string): Promise<string> {
    return `/storage/${storageKey}`;
  }
}
