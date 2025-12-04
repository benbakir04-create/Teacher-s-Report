import { useState, useEffect } from 'react';
import { 
    isOnline, 
    setupConnectionListeners, 
    syncPendingReports, 
    getPendingReports, 
    registerServiceWorker,
    clearAppCache as clearCacheService
} from '../services/offlineService';

export function useOfflineSync() {
    const [online, setOnline] = useState(isOnline());
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        console.log('🚀 App Version: 1.3.0 - Refactored Hooks'); 
        // Register Service Worker for PWA
        registerServiceWorker();
        
        // Setup connection listeners
        setupConnectionListeners(
            () => {
                setOnline(true);
                syncPendingReports().then(() => {
                    setPendingCount(getPendingReports().length);
                });
            },
            () => setOnline(false)
        );

        // Check pending reports count
        setPendingCount(getPendingReports().length);
        
        // Try to sync pending reports
        if (isOnline()) {
            syncPendingReports();
        }
    }, []);

    const handleClearCache = () => {
        if (confirm('سيتم مسح جميع البيانات المؤقتة وإعادة تحميل التطبيق. هل أنت متأكد؟')) {
            clearCacheService();
        }
    };

    return {
        online,
        pendingCount,
        setPendingCount,
        handleClearCache
    };
}
