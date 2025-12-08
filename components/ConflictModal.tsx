import React from 'react';
import { AlertTriangle, X, Cloud, Smartphone } from 'lucide-react';
import { useSync } from '../hooks/useSync';

interface ConflictModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({ isOpen, onClose }) => {
    const { conflicts, resolveConflict } = useSync();

    if (!isOpen || conflicts.length === 0) return null;

    const currentConflict = conflicts[0];

    const handleResolve = (resolution: 'keep_local' | 'keep_server') => {
        resolveConflict(currentConflict.id, resolution);
        if (conflicts.length <= 1) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 left-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition"
                    >
                        <X size={18} />
                    </button>
                    
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={32} />
                        <div>
                            <h3 className="text-xl font-bold">تعارض في البيانات</h3>
                            <p className="text-white/80 text-sm">{conflicts.length} عناصر تحتاج حل</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <p className="text-sm text-gray-600 mb-2">
                            <strong>نوع العنصر:</strong> {currentConflict.type === 'report' ? 'تقرير' : currentConflict.type}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                            <strong>المعرّف:</strong> <code className="bg-gray-200 px-1 rounded">{currentConflict.id.slice(0, 8)}...</code>
                        </p>
                        <p className="text-sm text-red-600">
                            <strong>السبب:</strong> {currentConflict.error || 'توجد نسخة أحدث على السحابة'}
                        </p>
                    </div>

                    <p className="text-gray-700 text-center mb-6">
                        اختر النسخة التي تريد الاحتفاظ بها:
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleResolve('keep_local')}
                            className="flex flex-col items-center gap-3 p-4 border-2 border-blue-200 rounded-xl hover:bg-blue-50 hover:border-blue-400 transition group"
                        >
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition">
                                <Smartphone size={24} />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-gray-800">نسختي المحلية</p>
                                <p className="text-xs text-gray-500">استبدال النسخة على السحابة</p>
                            </div>
                        </button>

                        <button
                            onClick={() => handleResolve('keep_server')}
                            className="flex flex-col items-center gap-3 p-4 border-2 border-purple-200 rounded-xl hover:bg-purple-50 hover:border-purple-400 transition group"
                        >
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition">
                                <Cloud size={24} />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-gray-800">نسخة السحابة</p>
                                <p className="text-xs text-gray-500">تجاهل التغييرات المحلية</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 text-center">
                    <p className="text-xs text-gray-500">
                        ⚠️ هذا الإجراء لا يمكن التراجع عنه
                    </p>
                </div>
            </div>
        </div>
    );
};
