export interface SyncItem {
    id: string; // Unique ID (timestamp + random)
    payload: any;
    status: 'pending' | 'syncing' | 'failed';
    retryCount: number;
    createdAt: number;
}

export interface StoredReport {
    id: string;
    data: any;
    createdAt: number;
}

const DB_NAME = 'teacher-report-db';
const DB_VERSION = 1;
const STORES = {
    REPORTS: 'reports',
    SYNC_QUEUE: 'syncQueue',
    SETTINGS: 'settings'
};

class DBService {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    // Removed constructor call - initialization is now lazy

    async init(): Promise<void> {
        // Only run in browser environment
        if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
            console.warn('IndexedDB not available (non-browser environment)');
            return Promise.resolve();
        }
        
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error('IndexedDB error:', event);
                reject('Error opening database');
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                console.log('✅ IndexedDB initialized');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Reports Store
                if (!db.objectStoreNames.contains(STORES.REPORTS)) {
                    db.createObjectStore(STORES.REPORTS, { keyPath: 'id' });
                }

                // Sync Queue Store
                if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
                    db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
                }

                // Settings Store
                if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                    db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
                }
            };
        });

        return this.initPromise;
    }

    private async getDB(): Promise<IDBDatabase> {
        if (!this.db) await this.init();
        if (!this.db) throw new Error('Database not initialized');
        return this.db;
    }

    // --- Generic Operations ---

    async add(storeName: string, item: any): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(item);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getAll<T>(storeName: string): Promise<T[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result as T[]);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName: string, id: string): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async count(storeName: string): Promise<number> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // --- Specific Helpers ---

    async saveReport(report: any): Promise<void> {
        const storedReport: StoredReport = {
            id: report.uid || Date.now().toString(),
            data: report,
            createdAt: Date.now()
        };
        await this.add(STORES.REPORTS, storedReport);
    }

    async addToSyncQueue(payload: any): Promise<void> {
        const syncItem: SyncItem = {
            id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
            payload: payload,
            status: 'pending',
            retryCount: 0,
            createdAt: Date.now()
        };
        await this.add(STORES.SYNC_QUEUE, syncItem);
    }

    async getPendingSyncItems(): Promise<SyncItem[]> {
        return this.getAll<SyncItem>(STORES.SYNC_QUEUE);
    }

    async removeSyncItem(id: string): Promise<void> {
        return this.delete(STORES.SYNC_QUEUE, id);
    }

    async getPendingCount(): Promise<number> {
        return this.count(STORES.SYNC_QUEUE);
    }
}

export const dbService = new DBService();
