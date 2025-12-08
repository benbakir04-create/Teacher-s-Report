import React from 'react';
import { AlertCircle, AlertTriangle, Info, Check, User, Building2, Smartphone, Clock } from 'lucide-react';
import { AdminException, ExceptionSeverity } from '../../services/adminService';

interface ExceptionsFeedProps {
    exceptions: AdminException[];
    onResolve: (id: string) => void;
    isLoading: boolean;
}

const getSeverityConfig = (severity: ExceptionSeverity) => {
    switch (severity) {
        case 'critical':
            return {
                icon: <AlertCircle size={18} />,
                bg: 'bg-red-50',
                border: 'border-red-200',
                text: 'text-red-700',
                badge: 'bg-red-100 text-red-700'
            };
        case 'warning':
            return {
                icon: <AlertTriangle size={18} />,
                bg: 'bg-amber-50',
                border: 'border-amber-200',
                text: 'text-amber-700',
                badge: 'bg-amber-100 text-amber-700'
            };
        case 'info':
        default:
            return {
                icon: <Info size={18} />,
                bg: 'bg-blue-50',
                border: 'border-blue-200',
                text: 'text-blue-700',
                badge: 'bg-blue-100 text-blue-700'
            };
    }
};

const getEntityIcon = (type: 'teacher' | 'school' | 'device') => {
    switch (type) {
        case 'teacher': return <User size={14} />;
        case 'school': return <Building2 size={14} />;
        case 'device': return <Smartphone size={14} />;
    }
};

const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
};

export const ExceptionsFeed: React.FC<ExceptionsFeedProps> = ({ exceptions, onResolve, isLoading }) => {
    const unresolvedExceptions = exceptions.filter(e => !e.resolved);

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-gray-100 rounded-xl mb-3 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={20} className="text-amber-500" />
                    <h3 className="font-bold text-gray-800">التنبيهات والاستثناءات</h3>
                    {unresolvedExceptions.length > 0 && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                            {unresolvedExceptions.length}
                        </span>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                {unresolvedExceptions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Check size={32} className="mx-auto mb-2 text-green-500" />
                        <p>لا توجد تنبيهات حالياً</p>
                    </div>
                ) : (
                    unresolvedExceptions.map(exception => {
                        const config = getSeverityConfig(exception.severity);
                        
                        return (
                            <div 
                                key={exception.id}
                                className={`p-4 ${config.bg} hover:brightness-95 transition-all`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`mt-0.5 ${config.text}`}>
                                        {config.icon}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-800 text-sm">
                                                {exception.title}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${config.badge}`}>
                                                {exception.severity === 'critical' ? 'حرج' : 
                                                 exception.severity === 'warning' ? 'تحذير' : 'معلومة'}
                                            </span>
                                        </div>
                                        
                                        <p className="text-xs text-gray-600 mb-2">
                                            {exception.description}
                                        </p>
                                        
                                        <div className="flex items-center gap-4 text-[10px] text-gray-500">
                                            <span className="flex items-center gap-1">
                                                {getEntityIcon(exception.entityType)}
                                                {exception.entityName}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {formatTime(exception.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={() => onResolve(exception.id)}
                                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition shrink-0"
                                    >
                                        تم الحل
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
