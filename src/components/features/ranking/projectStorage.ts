// Utility for storing ranking projects with File objects using IndexedDB

const DB_NAME = 'ranking-projects-db';
const DB_VERSION = 2; // Increment version for new store
const STORE_NAME = 'video-files';
const OVERLAY_STORE_NAME = 'overlay-images';

interface StoredFileData {
  id: string;
  projectId: string;
  file: Blob;
  fileName: string;
  fileType: string;
  lastModified: number;
}

class ProjectStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<boolean> | null = null;

  private async init(): Promise<boolean> {
    if (this.db) return true;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve) => {
      if (typeof indexedDB === 'undefined') {
        console.warn('IndexedDB not supported');
        resolve(false);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB');
        resolve(false);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('projectId', 'projectId', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(OVERLAY_STORE_NAME)) {
          const overlayStore = db.createObjectStore(OVERLAY_STORE_NAME, { keyPath: 'id' });
          overlayStore.createIndex('projectId', 'projectId', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  private async ensureDb(): Promise<IDBDatabase> {
    await this.init();
    if (!this.db) {
      throw new Error('Database not available');
    }
    return this.db;
  }

  async saveVideoFiles(projectId: string, videos: Array<{ id: string; file: File }>): Promise<void> {
    const db = await this.ensureDb();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('projectId');

    // Delete old files for this project
    await new Promise<void>((resolve) => {
      const getAllRequest = index.getAll(projectId);
      getAllRequest.onsuccess = () => {
        const existingFiles = getAllRequest.result as StoredFileData[];
        if (existingFiles.length === 0) {
          resolve();
          return;
        }
        let deleted = 0;
        const total = existingFiles.length;
        for (const fileData of existingFiles) {
          const deleteRequest = store.delete(fileData.id);
          deleteRequest.onsuccess = () => {
            deleted++;
            if (deleted === total) resolve();
          };
          deleteRequest.onerror = () => {
            deleted++;
            if (deleted === total) resolve();
          };
        }
      };
      getAllRequest.onerror = () => resolve();
    });

    // Save new files (in the same transaction)
    const savePromises = videos.map((video) => {
      return new Promise<void>((resolve, reject) => {
        const fileData: StoredFileData = {
          id: `${projectId}_${video.id}`,
          projectId,
          file: video.file,
          fileName: video.file.name,
          fileType: video.file.type,
          lastModified: video.file.lastModified,
        };

        const putRequest = store.put(fileData);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      });
    });

    await Promise.all(savePromises);
  }

  async loadVideoFiles(projectId: string, videos: Array<{ id: string }>): Promise<Map<string, File>> {
    const fileMap = new Map<string, File>();
    
    try {
      const db = await this.ensureDb();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      for (const video of videos) {
        const fileId = `${projectId}_${video.id}`;
        const fileData = await new Promise<StoredFileData | null>((resolve) => {
          const request = store.get(fileId);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => resolve(null);
        });

        if (fileData) {
          const file = new File(
            [fileData.file],
            fileData.fileName,
            { type: fileData.fileType, lastModified: fileData.lastModified }
          );
          fileMap.set(video.id, file);
        }
      }
    } catch (error) {
      console.error('Error loading video files:', error);
    }

    return fileMap;
  }

  async saveOverlayImages(projectId: string, overlays: Array<{ id: string; imageFile?: File }>): Promise<void> {
    const db = await this.ensureDb();
    const transaction = db.transaction(OVERLAY_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(OVERLAY_STORE_NAME);
    const index = store.index('projectId');

    // Delete old overlay images for this project
    await new Promise<void>((resolve) => {
      const getAllRequest = index.getAll(projectId);
      getAllRequest.onsuccess = () => {
        const existingFiles = getAllRequest.result as StoredFileData[];
        if (existingFiles.length === 0) {
          resolve();
          return;
        }
        let deleted = 0;
        const total = existingFiles.length;
        for (const fileData of existingFiles) {
          const deleteRequest = store.delete(fileData.id);
          deleteRequest.onsuccess = () => {
            deleted++;
            if (deleted === total) resolve();
          };
          deleteRequest.onerror = () => {
            deleted++;
            if (deleted === total) resolve();
          };
        }
      };
      getAllRequest.onerror = () => resolve();
    });

    // Save new overlay images
    const savePromises = overlays
      .filter((overlay) => overlay.imageFile)
      .map((overlay) => {
        return new Promise<void>((resolve, reject) => {
          const fileData: StoredFileData = {
            id: `${projectId}_overlay_${overlay.id}`,
            projectId,
            file: overlay.imageFile!,
            fileName: overlay.imageFile!.name,
            fileType: overlay.imageFile!.type,
            lastModified: overlay.imageFile!.lastModified,
          };

          const putRequest = store.put(fileData);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        });
      });

    await Promise.all(savePromises);
  }

  async loadOverlayImages(projectId: string, overlays: Array<{ id: string }>): Promise<Map<string, File>> {
    const fileMap = new Map<string, File>();
    
    try {
      const db = await this.ensureDb();
      const transaction = db.transaction(OVERLAY_STORE_NAME, 'readonly');
      const store = transaction.objectStore(OVERLAY_STORE_NAME);

      for (const overlay of overlays) {
        const fileId = `${projectId}_overlay_${overlay.id}`;
        const fileData = await new Promise<StoredFileData | null>((resolve) => {
          const request = store.get(fileId);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => resolve(null);
        });

        if (fileData) {
          const file = new File(
            [fileData.file],
            fileData.fileName,
            { type: fileData.fileType, lastModified: fileData.lastModified }
          );
          fileMap.set(overlay.id, file);
        }
      }
    } catch (error) {
      console.error('Error loading overlay images:', error);
    }

    return fileMap;
  }

  async deleteProjectFiles(projectId: string): Promise<void> {
    try {
      const db = await this.ensureDb();
      
      // Delete video files
      const videoTransaction = db.transaction(STORE_NAME, 'readwrite');
      const videoStore = videoTransaction.objectStore(STORE_NAME);
      const videoIndex = videoStore.index('projectId');
      const videoRequest = videoIndex.getAllKeys(projectId);

      await new Promise<void>((resolve) => {
        videoRequest.onsuccess = async () => {
          const keys = videoRequest.result;
          for (const key of keys) {
            await new Promise<void>((res) => {
              const deleteRequest = videoStore.delete(key);
              deleteRequest.onsuccess = () => res();
              deleteRequest.onerror = () => res();
            });
          }
          resolve();
        };
        videoRequest.onerror = () => resolve();
      });

      // Delete overlay images
      const overlayTransaction = db.transaction(OVERLAY_STORE_NAME, 'readwrite');
      const overlayStore = overlayTransaction.objectStore(OVERLAY_STORE_NAME);
      const overlayIndex = overlayStore.index('projectId');
      const overlayRequest = overlayIndex.getAllKeys(projectId);

      await new Promise<void>((resolve) => {
        overlayRequest.onsuccess = async () => {
          const keys = overlayRequest.result;
          for (const key of keys) {
            await new Promise<void>((res) => {
              const deleteRequest = overlayStore.delete(key);
              deleteRequest.onsuccess = () => res();
              deleteRequest.onerror = () => res();
            });
          }
          resolve();
        };
        overlayRequest.onerror = () => resolve();
      });
    } catch (error) {
      console.error('Error deleting project files:', error);
    }
  }
}

export const projectStorage = new ProjectStorage();

