import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ReminderBannerProps {
    daysSinceFirstUse: number;
    onLink: () => void;
    onDismiss: () => void;
}

export const ReminderBanner: React.FC<ReminderBannerProps> = ({ daysSinceFirstUse, onLink, onDismiss }) => {
    const isUrgent = daysSinceFirstUse >= 8;
    
    return (
        <div className={`fixed top-0 left-0 right-0 z-50 ${isUrgent ? 'bg-red-500' : 'bg-yellow-500'} text-white px-4 py-3 shadow-lg animate-fade-in`}>
            <div className="max-w-md mx-auto flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                    <AlertTriangle size={20} />
                    <div className="text-sm">
                        {isUrgent ? (
                            <>
                                <span className="font-bold">⚠️ تحذير:</span> يرجى ربط حسابك بـ Gmail
                            </>
                        ) : (
                            <>
                                <span className="font-bold">تذكير:</span> لم تقم بربط حسابك بـ Gmail بعد
                            </>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={onLink}
                        className="bg-white text-gray-800 px-3 py-1 rounded-lg text-xs font-bold hover:bg-gray-100 transition"
                    >
                        ربط الآن
                    </button>
                    <button
                        onClick={onDismiss}
                        className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};
