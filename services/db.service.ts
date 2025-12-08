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
    classId?: string; // Indexable
    date?: string;    // Indexable
    owner_user_id?: string; // Linked User ID
    createdAt: number;
    updatedAt?: number;
    status: 'submitted';
}

export interface StoredDraft {
    id: string; // Unique ID
    classId: string; // For querying by class
    date: string;    // For querying by date
    data: any;
    updatedAt: number;
}

// General Data for teacher profile
export interface GeneralData {
    registrationId: string;
    name: string;
    email: string;
    phone?: string;
    school: string;
    level: string;
    sectionNumber: string;
    updatedAt: number;
}

const DB_NAME = 'teacher-report-db';
const DB_VERSION = 4; // Upgraded to 4 for Users/Logs
const STORES = {
    REPORTS: 'reports',
    DRAFTS: 'drafts',
    SYNC_QUEUE: 'syncQueue',
    SETTINGS: 'settings',
    CONFIG: 'config',
    USERS: 'users',      // New Phase 6
    LOGS: 'logs'         // New Phase 6
};

class DBService {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    async init(): Promise<void> {
        if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
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
                console.log('✅ IndexedDB initialized (v4)');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // 1. Reports Store
                if (!db.objectStoreNames.contains(STORES.REPORTS)) {
                    const reportStore = db.createObjectStore(STORES.REPORTS, { keyPath: 'id' });
                    reportStore.createIndex('classId', 'classId', { unique: false });
                    reportStore.createIndex('date', 'date', { unique: false });
                    reportStore.createIndex('owner', 'owner_user_id', { unique: false }); // New Index
                } else {
                    const reportStore = (event.target as IDBOpenDBRequest).transaction!.objectStore(STORES.REPORTS);
                    if (!reportStore.indexNames.contains('classId')) {
                         reportStore.createIndex('classId', 'data.general.sectionId', { unique: false }); 
                    }
                    if (!reportStore.indexNames.contains('date')) {
                        reportStore.createIndex('date', 'data.general.date', { unique: false });
                    }
                    if (!reportStore.indexNames.contains('owner')) {
                        reportStore.createIndex('owner', 'owner_user_id', { unique: false });
                    }
                }

                // 2. Drafts Store
                if (!db.objectStoreNames.contains(STORES.DRAFTS)) {
                    const draftStore = db.createObjectStore(STORES.DRAFTS, { keyPath: 'id' });
                    draftStore.createIndex('classId', 'classId', { unique: false });
                    draftStore.createIndex('date', 'date', { unique: false });
                    draftStore.createIndex('lookupKey', ['classId', 'date'], { unique: false });
                }

                // 3. Sync Queue
                if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
                    db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
                }

                // 4. Settings
                if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                    db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
                }

                // 5. Config
                if (!db.objectStoreNames.contains(STORES.CONFIG)) {
                    db.createObjectStore(STORES.CONFIG, { keyPath: 'key' });
                }

                // 6. Users Store (New Phase 6)
                if (!db.objectStoreNames.contains(STORES.USERS)) {
                    const userStore = db.createObjectStore(STORES.USERS, { keyPath: 'id' });
                    userStore.createIndex('teacher_id', 'teacher_id', { unique: true }); // Teacher ID must be unique
                    userStore.createIndex('email', 'email', { unique: true });
                }

                // 7. Logs Store (New Phase 6)
                if (!db.objectStoreNames.contains(STORES.LOGS)) {
                    const logStore = db.createObjectStore(STORES.LOGS, { keyPath: 'id' });
                    logStore.createIndex('userId', 'userId', { unique: false });
                    logStore.createIndex('date', 'timestamp', { unique: false });
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

    // --- REPORTS APIs ---

    async saveReport(report: any): Promise<void> {
        const id = report.uid || Date.now().toString();
        
        // --- Lookup Owner (Phase 6) ---
        let ownerId = report.owner_user_id;
        if (!ownerId && report.general?.id) {
            try {
                const user = await this.getUserByTeacherId(report.general.id);
                if (user) ownerId = user.id;
            } catch (e) { /* ignore */ }
        }
        
        const storedReport: StoredReport = {
            id: id,
            data: { ...report, owner_user_id: ownerId }, // Also inject into data blob for ease
            classId: report.general?.sectionId,
            date: report.general?.date,
            owner_user_id: ownerId,
            createdAt: report.createdAt || Date.now(),
            updatedAt: Date.now(),
            status: 'submitted'
        };
        await this.add(STORES.REPORTS, storedReport);
    }

    async getReportById(id: string): Promise<any | null> {
         const db = await this.getDB();
         return new Promise((resolve, reject) => {
             const transaction = db.transaction([STORES.REPORTS], 'readonly');
             const store = transaction.objectStore(STORES.REPORTS);
             const request = store.get(id);
             request.onsuccess = () => resolve(request.result?.data || null);
             request.onerror = () => reject(request.error);
         });
    }

    async getAllReports(): Promise<any[]> {
        const stored = await this.getAll<StoredReport>(STORES.REPORTS);
        return stored.map(item => item.data);
    }

    // --- DRAFTS APIs ---

    async saveDraft(draftData: any): Promise<void> {
        if (!draftData.general?.sectionId || !draftData.general?.date) return;
        
        // Ensure ID is stable for same day/class to overwrite properly
        const draftId = `${draftData.general.sectionId}_${draftData.general.date}`; 
        
        const draft: StoredDraft = {
            id: draftId,
            classId: draftData.general.sectionId,
            date: draftData.general.date,
            data: draftData,
            updatedAt: Date.now()
        };
        
        await this.add(STORES.DRAFTS, draft);
    }

    async getDraft(classId: string, date: string): Promise<any | null> {
        const db = await this.getDB();
        const draftId = `${classId}_${date}`;
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORES.DRAFTS], 'readonly');
            const store = transaction.objectStore(STORES.DRAFTS);
            const request = store.get(draftId);
            request.onsuccess = () => resolve(request.result?.data || null);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteDraft(classId: string, date: string): Promise<void> {
        const draftId = `${classId}_${date}`;
        await this.delete(STORES.DRAFTS, draftId);
    }

    // --- SYNC & CONFIG ---

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
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORES.SYNC_QUEUE], 'readonly');
            const store = transaction.objectStore(STORES.SYNC_QUEUE);
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async saveGeneralData(data: GeneralData): Promise<void> {
        await this.add(STORES.CONFIG, {
            key: 'generalData',
            ...data,
            updatedAt: Date.now()
        });
    }

    async getGeneralData(): Promise<GeneralData | null> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORES.CONFIG], 'readonly');
            const store = transaction.objectStore(STORES.CONFIG);
            const request = store.get('generalData');
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? (({ key, ...data }) => data)(result) as GeneralData : null);
            };
            request.onerror = () => reject(request.error);
        });
    }


    // --- USERS APIs (Phase 6) ---

    async createUser(user: any): Promise<void> {
        await this.add(STORES.USERS, user);
    }

    async getUser(id: string): Promise<any | null> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORES.USERS], 'readonly');
            const store = transaction.objectStore(STORES.USERS);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async getUserByTeacherId(teacherId: string): Promise<any | null> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORES.USERS], 'readonly');
            const store = transaction.objectStore(STORES.USERS);
            const index = store.index('teacher_id'); // Ensure index exists
            const request = index.get(teacherId);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async updateUser(user: any): Promise<void> {
        await this.add(STORES.USERS, user); // put overwrites
    }

    // --- LOGS APIs (Phase 6) ---

    async logEvent(entry: any): Promise<void> {
        await this.add(STORES.LOGS, entry);
    }

    async getLogs(limit: number = 50): Promise<any[]> {
        // For simple usage, get all and sort. For millions of logs, use cursor or IDB KeyRange.
        const all = await this.getAll<any>(STORES.LOGS);
        return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    }
}

export const dbService = new DBService();
