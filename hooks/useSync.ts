import { useState, useEffect, useCallback } from 'react';
import { syncService, SyncState, SyncItem } from '../services/syncService';

export function useSync() {
    const [syncState, setSyncState] = useState<SyncState>({
        isOnline: navigator.onLine,
        isSyncing: false,
        pendingCount: 0,
        lastSyncAt: null,
        lastError: null
    });
    const [conflicts, setConflicts] = useState<SyncItem[]>([]);

    useEffect(() => {
        // Initial state
        syncService.getState().then(setSyncState);
        syncService.getConflictedItems().then(setConflicts);

        // Subscribe to updates
        const unsubscribe = syncService.subscribe((state) => {
            setSyncState(state);
            syncService.getConflictedItems().then(setConflicts);
        });

        return unsubscribe;
    }, []);

    const triggerSync = useCallback(() => {
        syncService.syncPending();
    }, []);

    const retryFailed = useCallback(() => {
        syncService.retryFailed();
    }, []);

    const resolveConflict = useCallback((itemId: string, resolution: 'keep_local' | 'keep_server') => {
        syncService.resolveConflict(itemId, resolution);
    }, []);

    const formatLastSync = useCallback(() => {
        if (!syncState.lastSyncAt) return 'لم تتم المزامنة بعد';
        
        const diff = Date.now() - syncState.lastSyncAt;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'الآن';
        if (minutes < 60) return `منذ ${minutes} دقيقة`;
        if (hours < 24) return `منذ ${hours} ساعة`;
        return `منذ ${days} يوم`;
    }, [syncState.lastSyncAt]);

    return {
        ...syncState,
        conflicts,
        triggerSync,
        retryFailed,
        resolveConflict,
        formatLastSync
    };
}
