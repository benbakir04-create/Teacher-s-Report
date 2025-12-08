import React from 'react';
import { Cloud, CloudOff, RefreshCw, AlertTriangle, Check } from 'lucide-react';
import { useSync } from '../hooks/useSync';

interface SyncStatusProps {
    compact?: boolean;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ compact = false }) => {
    const { isOnline, isSyncing, pendingCount, formatLastSync, conflicts, triggerSync } = useSync();

    const getStatusIcon = () => {
        if (!isOnline) return <CloudOff size={16} className="text-gray-400" />;
        if (isSyncing) return <RefreshCw size={16} className="text-blue-500 animate-spin" />;
        if (conflicts.length > 0) return <AlertTriangle size={16} className="text-amber-500" />;
        if (pendingCount > 0) return <Cloud size={16} className="text-blue-500" />;
        return <Check size={16} className="text-green-500" />;
    };

    const getStatusText = () => {
        if (!isOnline) return 'غير متصل';
        if (isSyncing) return 'جاري المزامنة...';
        if (conflicts.length > 0) return `${conflicts.length} تعارضات`;
        if (pendingCount > 0) return `${pendingCount} في الانتظار`;
        return 'متزامن';
    };

    const getStatusColor = () => {
        if (!isOnline) return 'bg-gray-100 text-gray-600';
        if (isSyncing) return 'bg-blue-50 text-blue-600';
        if (conflicts.length > 0) return 'bg-amber-50 text-amber-600';
        if (pendingCount > 0) return 'bg-blue-50 text-blue-600';
        return 'bg-green-50 text-green-600';
    };

    if (compact) {
        return (
            <button
                onClick={triggerSync}
                disabled={isSyncing || !isOnline}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition ${getStatusColor()}`}
                title={formatLastSync()}
            >
                {getStatusIcon()}
                {pendingCount > 0 && (
                    <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded-full text-[10px]">
                        {pendingCount}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${getStatusColor()}`}>
            <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="font-medium">{getStatusText()}</span>
            </div>
            
            <div className="flex-1 text-left text-xs opacity-75">
                {formatLastSync()}
            </div>

            {pendingCount > 0 && isOnline && !isSyncing && (
                <button
                    onClick={triggerSync}
                    className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition"
                >
                    مزامنة الآن
                </button>
            )}
        </div>
    );
};
