import { StoredEditorProject } from '../types/editor';

const DB_NAME = 'zitro-editor-db';
const DB_VERSION = 1;

interface MediaAsset {
  id: string;
  projectId: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  blob: Blob;
  thumbnail?: Blob;
  duration?: number;
  createdAt: number;
}

type StoreName = 'projects' | 'media' | 'settings' | 'cache';

class EditorStorage {
  private db: IDBDatabase | null = null;
  private isInitialized = false;
  private initPromise: Promise<boolean> | null = null;

  async init(): Promise<boolean> {
    if (this.isInitialized && this.db) {
      return true;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve) => {
      if (typeof indexedDB === 'undefined') {
        resolve(false);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        resolve(false);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          projectStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains('media')) {
          const mediaStore = db.createObjectStore('media', { keyPath: 'id' });
          mediaStore.createIndex('projectId', 'projectId', { unique: false });
          mediaStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('expiry', 'expiry', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      const success = await this.init();
      if (!success || !this.db) {
        throw new Error('Database not available');
      }
    }
    return this.db;
  }

  async saveProject(project: StoredEditorProject): Promise<boolean> {
    try {
      const db = await this.ensureDb();
      return new Promise((resolve) => {
        const transaction = db.transaction(['projects'], 'readwrite');
        const store = transaction.objectStore('projects');
        
        const request = store.put({
          ...project,
          updatedAt: Date.now(),
        });

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  async getProject(id: string): Promise<StoredEditorProject | null> {
    try {
      const db = await this.ensureDb();
      return new Promise((resolve) => {
        const transaction = db.transaction(['projects'], 'readonly');
        const store = transaction.objectStore('projects');
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  async getAllProjects(): Promise<StoredEditorProject[]> {
    try {
      const db = await this.ensureDb();
      return new Promise((resolve) => {
        const transaction = db.transaction(['projects'], 'readonly');
        const store = transaction.objectStore('projects');
        const index = store.index('updatedAt');
        const request = index.getAll();

        request.onsuccess = () => {
          const projects = request.result || [];
          resolve(projects.sort((a, b) => b.updatedAt - a.updatedAt));
        };
        request.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  async deleteProject(id: string): Promise<boolean> {
    try {
      const db = await this.ensureDb();
      
      await this.deleteMediaByProject(id);

      return new Promise((resolve) => {
        const transaction = db.transaction(['projects'], 'readwrite');
        const store = transaction.objectStore('projects');
        const request = store.delete(id);

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  async saveMedia(asset: MediaAsset): Promise<boolean> {
    try {
      const db = await this.ensureDb();
      return new Promise((resolve) => {
        const transaction = db.transaction(['media'], 'readwrite');
        const store = transaction.objectStore('media');
        const request = store.put(asset);

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  async getMedia(id: string): Promise<MediaAsset | null> {
    try {
      const db = await this.ensureDb();
      return new Promise((resolve) => {
        const transaction = db.transaction(['media'], 'readonly');
        const store = transaction.objectStore('media');
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  async getMediaByProject(projectId: string): Promise<MediaAsset[]> {
    try {
      const db = await this.ensureDb();
      return new Promise((resolve) => {
        const transaction = db.transaction(['media'], 'readonly');
        const store = transaction.objectStore('media');
        const index = store.index('projectId');
        const request = index.getAll(projectId);

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  async deleteMedia(id: string): Promise<boolean> {
    try {
      const db = await this.ensureDb();
      return new Promise((resolve) => {
        const transaction = db.transaction(['media'], 'readwrite');
        const store = transaction.objectStore('media');
        const request = store.delete(id);

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  private async deleteMediaByProject(projectId: string): Promise<boolean> {
    try {
      const assets = await this.getMediaByProject(projectId);
      const results = await Promise.all(
        assets.map(asset => this.deleteMedia(asset.id))
      );
      return results.every(r => r);
    } catch {
      return false;
    }
  }

  async saveSetting<T>(key: string, value: T): Promise<boolean> {
    try {
      const db = await this.ensureDb();
      return new Promise((resolve) => {
        const transaction = db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        const request = store.put({ key, value, updatedAt: Date.now() });

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  async getSetting<T>(key: string): Promise<T | null> {
    try {
      const db = await this.ensureDb();
      return new Promise((resolve) => {
        const transaction = db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        const request = store.get(key);

        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.value : null);
        };
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  async setCache<T>(key: string, value: T, expiryMs: number = 3600000): Promise<boolean> {
    try {
      const db = await this.ensureDb();
      return new Promise((resolve) => {
        const transaction = db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        const request = store.put({
          key,
          value,
          expiry: Date.now() + expiryMs,
        });

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  async getCache<T>(key: string): Promise<T | null> {
    try {
      const db = await this.ensureDb();
      return new Promise((resolve) => {
        const transaction = db.transaction(['cache'], 'readonly');
        const store = transaction.objectStore('cache');
        const request = store.get(key);

        request.onsuccess = () => {
          const result = request.result;
          if (result && result.expiry > Date.now()) {
            resolve(result.value);
          } else {
            if (result) {
              this.deleteCache(key);
            }
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  async deleteCache(key: string): Promise<boolean> {
    try {
      const db = await this.ensureDb();
      return new Promise((resolve) => {
        const transaction = db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        const request = store.delete(key);

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  async clearExpiredCache(): Promise<void> {
    try {
      const db = await this.ensureDb();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('expiry');
      const now = Date.now();

      const range = IDBKeyRange.upperBound(now);
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    } catch {
    }
  }

  async getStorageUsage(): Promise<{ used: number; quota: number } | null> {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          quota: estimate.quota || 0,
        };
      } catch {
      }
    }
    return null;
  }

  async clearAllData(): Promise<boolean> {
    try {
      const db = await this.ensureDb();
      const storeNames: StoreName[] = ['projects', 'media', 'settings', 'cache'];

      await Promise.all(
        storeNames.map(
          (storeName) =>
            new Promise<void>((resolve) => {
              const transaction = db.transaction([storeName], 'readwrite');
              const store = transaction.objectStore(storeName);
              const request = store.clear();
              request.onsuccess = () => resolve();
              request.onerror = () => resolve();
            })
        )
      );

      return true;
    } catch {
      return false;
    }
  }

  async exportProject(projectId: string): Promise<Blob | null> {
    try {
      const project = await this.getProject(projectId);
      if (!project) return null;

      const media = await this.getMediaByProject(projectId);

      const exportData = {
        version: 1,
        project,
        mediaMetadata: media.map(m => ({
          id: m.id,
          name: m.name,
          type: m.type,
          duration: m.duration,
        })),
      };

      return new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
    } catch {
      return null;
    }
  }

  async importProject(blob: Blob): Promise<string | null> {
    try {
      const text = await blob.text();
      const data = JSON.parse(text);

      if (!data.version || !data.project) {
        throw new Error('Invalid project file');
      }

      const newId = `project-${Date.now()}`;
      const project: StoredEditorProject = {
        ...data.project,
        id: newId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const saved = await this.saveProject(project);
      return saved ? newId : null;
    } catch {
      return null;
    }
  }
}

export const editorStorage = new EditorStorage();

export const useEditorStorage = () => {
  return editorStorage;
};

