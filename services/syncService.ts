/**
 * Sync Service
 * 
 * Handles cloud synchronization of local data.
 * Phase 7.0: One-Way Sync (Device → Cloud)
 */

import { dbService } from './db.service';

// --- Configuration ---
const API_BASE_URL = import.meta.env.VITE_SYNC_API_URL || '';
const BATCH_SIZE = 20;
const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 2000;

// --- Types ---
export type SyncItemType = 'report' | 'user' | 'log';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';

export interface SyncItem {
    id: string;
    type: SyncItemType;
    payload: any;
    status: SyncStatus;
    retryCount: number;
    createdAt: number;
    lastAttempt?: number;
    error?: string;
}

export interface SyncBatchRequest {
    device_id: string;
    items: {
        type: SyncItemType;
        id: string;
        payload: any;
        createdAt: number;
        updatedAt: number;
    }[];
}

export interface SyncItemResult {
    id: string;
    status: 'ok' | 'conflict' | 'invalid';
    serverId?: string;
    message?: string;
}

export interface SyncBatchResponse {
    results: SyncItemResult[];
    serverTime: string;
}

export interface SyncState {
    isOnline: boolean;
    isSyncing: boolean;
    pendingCount: number;
    lastSyncAt: number | null;
    lastError: string | null;
}

// --- Sync Service Class ---
class SyncService {
    private deviceId: string = '';
    private syncInProgress = false;
    private listeners: Set<(state: SyncState) => void> = new Set();

    constructor() {
        this.initDeviceId();
        this.setupNetworkListener();
    }

    private initDeviceId() {
        let stored = localStorage.getItem('sync_device_id');
        if (!stored) {
            stored = crypto.randomUUID();
            localStorage.setItem('sync_device_id', stored);
        }
        this.deviceId = stored;
    }

    private setupNetworkListener() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.onOnline());
            window.addEventListener('offline', () => this.notifyListeners());
        }
    }

    private async onOnline() {
        console.log('📶 Network online - triggering sync');
        await this.syncPending();
    }

    // --- Queue Management ---

    async queueForSync(type: SyncItemType, payload: any): Promise<void> {
        const item: SyncItem = {
            id: payload.id || payload.uid || crypto.randomUUID(),
            type,
            payload,
            status: 'pending',
            retryCount: 0,
            createdAt: Date.now()
        };

        await dbService.add('syncQueue', item);
        this.notifyListeners();
        
        // Auto-trigger sync if online
        if (navigator.onLine) {
            this.syncPending();
        }
    }

    async getPendingItems(): Promise<SyncItem[]> {
        const all = await dbService.getAll<SyncItem>('syncQueue');
        return all.filter(item => item.status === 'pending' || item.status === 'failed');
    }

    async getConflictedItems(): Promise<SyncItem[]> {
        const all = await dbService.getAll<SyncItem>('syncQueue');
        return all.filter(item => item.status === 'conflict');
    }

    // --- Sync Execution ---

    async syncPending(): Promise<void> {
        if (this.syncInProgress || !navigator.onLine || !API_BASE_URL) {
            return;
        }

        this.syncInProgress = true;
        this.notifyListeners();

        try {
            const pending = await this.getPendingItems();
            
            if (pending.length === 0) {
                this.syncInProgress = false;
                this.notifyListeners();
                return;
            }

            // Process in batches
            for (let i = 0; i < pending.length; i += BATCH_SIZE) {
                const batch = pending.slice(i, i + BATCH_SIZE);
                await this.uploadBatch(batch);
            }

            // Update last sync time
            localStorage.setItem('last_sync_at', Date.now().toString());

        } catch (error) {
            console.error('❌ Sync failed:', error);
        } finally {
            this.syncInProgress = false;
            this.notifyListeners();
        }
    }

    private async uploadBatch(items: SyncItem[]): Promise<void> {
        // Mark as syncing
        for (const item of items) {
            item.status = 'syncing';
            item.lastAttempt = Date.now();
            await dbService.add('syncQueue', item);
        }

        const request: SyncBatchRequest = {
            device_id: this.deviceId,
            items: items.map(item => ({
                type: item.type,
                id: item.id,
                payload: item.payload,
                createdAt: item.createdAt,
                updatedAt: item.payload.updatedAt || item.createdAt
            }))
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/sync/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result: SyncBatchResponse = await response.json();

            // Process results
            for (const itemResult of result.results) {
                const item = items.find(i => i.id === itemResult.id);
                if (!item) continue;

                if (itemResult.status === 'ok') {
                    // Success - remove from queue
                    await dbService.delete('syncQueue', item.id);
                } else if (itemResult.status === 'conflict') {
                    // Conflict - mark for resolution
                    item.status = 'conflict';
                    item.error = itemResult.message || 'Server has newer version';
                    await dbService.add('syncQueue', item);
                } else {
                    // Invalid - mark failed
                    item.status = 'failed';
                    item.error = itemResult.message || 'Validation failed';
                    await dbService.add('syncQueue', item);
                }
            }

            // Log sync event
            await dbService.logEvent({
                id: crypto.randomUUID(),
                event: 'sync.batch_complete',
                userId: 'system',
                timestamp: Date.now(),
                details: { count: items.length, device: this.deviceId }
            });

        } catch (error: any) {
            // Network/server error - schedule retry
            for (const item of items) {
                item.retryCount++;
                
                if (item.retryCount >= MAX_RETRIES) {
                    item.status = 'failed';
                    item.error = `Max retries exceeded: ${error.message}`;
                } else {
                    item.status = 'pending'; // Will retry
                }
                
                await dbService.add('syncQueue', item);
            }

            // Schedule retry with exponential backoff
            const backoffMs = Math.min(BASE_BACKOFF_MS * Math.pow(2, items[0]?.retryCount || 1), 3600000);
            setTimeout(() => this.syncPending(), backoffMs);
        }
    }

    private getAuthToken(): string {
        // Get JWT from localStorage or auth service
        const teacher = localStorage.getItem('teacher_data');
        if (teacher) {
            const parsed = JSON.parse(teacher);
            return parsed.syncToken || '';
        }
        return '';
    }

    // --- Conflict Resolution ---

    async resolveConflict(itemId: string, resolution: 'keep_local' | 'keep_server'): Promise<void> {
        const all = await dbService.getAll<SyncItem>('syncQueue');
        const item = all.find(i => i.id === itemId);
        
        if (!item) return;

        if (resolution === 'keep_local') {
            // Force re-upload with override flag
            item.payload._forceOverwrite = true;
            item.status = 'pending';
            item.retryCount = 0;
            await dbService.add('syncQueue', item);
            this.syncPending();
        } else {
            // Discard local, remove from queue
            await dbService.delete('syncQueue', item.id);
            // Optionally: fetch server version and update local
        }

        await dbService.logEvent({
            id: crypto.randomUUID(),
            event: 'sync.conflict_resolved',
            userId: 'user',
            timestamp: Date.now(),
            details: { itemId, resolution }
        });

        this.notifyListeners();
    }

    // --- State & Listeners ---

    async getState(): Promise<SyncState> {
        const pending = await this.getPendingItems();
        const lastSync = localStorage.getItem('last_sync_at');

        return {
            isOnline: navigator.onLine,
            isSyncing: this.syncInProgress,
            pendingCount: pending.length,
            lastSyncAt: lastSync ? parseInt(lastSync) : null,
            lastError: null
        };
    }

    subscribe(callback: (state: SyncState) => void): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    private async notifyListeners() {
        const state = await this.getState();
        this.listeners.forEach(cb => cb(state));
    }

    // --- Manual Actions ---

    async retryFailed(): Promise<void> {
        const all = await dbService.getAll<SyncItem>('syncQueue');
        for (const item of all) {
            if (item.status === 'failed') {
                item.status = 'pending';
                item.retryCount = 0;
                await dbService.add('syncQueue', item);
            }
        }
        this.syncPending();
    }

    async clearQueue(): Promise<void> {
        const all = await dbService.getAll<SyncItem>('syncQueue');
        for (const item of all) {
            await dbService.delete('syncQueue', item.id);
        }
        this.notifyListeners();
    }
}

export const syncService = new SyncService();
