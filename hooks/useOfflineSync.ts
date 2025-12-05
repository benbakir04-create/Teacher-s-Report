import { useState, useEffect } from 'react';
import { 
    isOnline, 
    setupConnectionListeners, 
    registerServiceWorker,
    clearAppCache as clearCacheService
} from '../services/offlineService';
import { dbService } from '../services/db.service';
import { processSyncQueue } from '../services/googleSheetsService';

export function useOfflineSync() {
    const [online, setOnline] = useState(isOnline());
    const [pendingCount, setPendingCount] = useState(0);

    // Initial Load & Polling for Pending Count
    useEffect(() => {
        console.log('🚀 App Version: 1.4.2 - Offline Layer (IndexedDB)'); 
        registerServiceWorker();

        // Function to update count from DB
        const updateCount = async () => {
            try {
                const count = await dbService.getPendingCount();
                setPendingCount(count);
            } catch (e) {
                console.error('Error getting pending count:', e);
            }
        };

        // Initial check
        updateCount();

        // Listen for online status
        setupConnectionListeners(
            () => {
                setOnline(true);
                console.log('🌐 Online: Triggering sync queue...');
                processSyncQueue().then(() => updateCount());
            },
            () => {
                setOnline(false);
            }
        );

        // Try to sync if already online
        if (isOnline()) {
            processSyncQueue().then(() => updateCount());
        }

        // Poll every 5 seconds to update count (in case user saves new report)
        const interval = setInterval(updateCount, 5000);

        return () => clearInterval(interval);
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
