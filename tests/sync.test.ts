import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncService, SyncItem } from '../services/syncService';

// Mock dbService
vi.mock('../services/db.service', () => ({
    dbService: {
        add: vi.fn().mockResolvedValue(undefined),
        getAll: vi.fn().mockResolvedValue([]),
        delete: vi.fn().mockResolvedValue(undefined),
        logEvent: vi.fn().mockResolvedValue(undefined)
    }
}));

// Mock fetch
global.fetch = vi.fn();

describe('SyncService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('queueForSync', () => {
        it('should add item to sync queue', async () => {
            const { dbService } = await import('../services/db.service');
            
            const payload = { id: 'test-123', data: 'test-data' };
            await syncService.queueForSync('report', payload);
            
            expect(dbService.add).toHaveBeenCalledWith('syncQueue', expect.objectContaining({
                type: 'report',
                payload,
                status: 'pending'
            }));
        });
    });

    describe('getPendingItems', () => {
        it('should filter items with pending or failed status', async () => {
            const { dbService } = await import('../services/db.service');
            
            const mockItems: SyncItem[] = [
                { id: '1', type: 'report', payload: {}, status: 'pending', retryCount: 0, createdAt: Date.now() },
                { id: '2', type: 'report', payload: {}, status: 'synced', retryCount: 0, createdAt: Date.now() },
                { id: '3', type: 'report', payload: {}, status: 'failed', retryCount: 2, createdAt: Date.now() }
            ];
            
            vi.mocked(dbService.getAll).mockResolvedValue(mockItems);
            
            const pending = await syncService.getPendingItems();
            
            expect(pending).toHaveLength(2);
            expect(pending.map(p => p.id)).toEqual(['1', '3']);
        });
    });

    describe('getConflictedItems', () => {
        it('should return only conflict items', async () => {
            const { dbService } = await import('../services/db.service');
            
            const mockItems: SyncItem[] = [
                { id: '1', type: 'report', payload: {}, status: 'pending', retryCount: 0, createdAt: Date.now() },
                { id: '2', type: 'report', payload: {}, status: 'conflict', retryCount: 1, createdAt: Date.now(), error: 'Server newer' }
            ];
            
            vi.mocked(dbService.getAll).mockResolvedValue(mockItems);
            
            const conflicts = await syncService.getConflictedItems();
            
            expect(conflicts).toHaveLength(1);
            expect(conflicts[0].id).toBe('2');
        });
    });

    describe('getState', () => {
        it('should return correct sync state', async () => {
            const { dbService } = await import('../services/db.service');
            
            vi.mocked(dbService.getAll).mockResolvedValue([
                { id: '1', type: 'report', payload: {}, status: 'pending', retryCount: 0, createdAt: Date.now() }
            ]);
            
            const state = await syncService.getState();
            
            expect(state).toMatchObject({
                isOnline: true, // jsdom default
                isSyncing: false,
                pendingCount: 1
            });
        });
    });
});
