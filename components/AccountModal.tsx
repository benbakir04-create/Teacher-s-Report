import React from 'react';
import { X, LogOut, RefreshCw, Trash2, User } from 'lucide-react';
import { TeacherData } from '../services/teacherService';

interface AccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    teacher: TeacherData | null;
    onLogout: () => void;
    onClearCache: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ 
    isOpen, 
    onClose, 
    teacher, 
    onLogout, 
    onClearCache 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="bg-primary p-4 text-white flex justify-between items-center">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <User size={20} />
                        حسابي
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* User Info */}
                    <div className="text-center space-y-2">
                        <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center border-4 border-white shadow-lg -mt-12 relative z-10">
                            <span className="text-3xl">👤</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-gray-800">{teacher?.name || 'مستخدم'}</h3>
                            <p className="text-sm text-gray-500 font-mono">{teacher?.registrationId}</p>
                            <p className="text-xs text-gray-400 mt-1">{teacher?.school}</p>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={onClearCache}
                            className="w-full py-3 px-4 bg-orange-50 text-orange-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-100 active:scale-95 transition border border-orange-100"
                        >
                            <RefreshCw size={18} />
                            تحديث التطبيق وحل المشاكل
                        </button>
                        <p className="text-[10px] text-gray-400 text-center px-4">
                            استخدم هذا الزر إذا واجهت مشاكل في التطبيق أو لضمان الحصول على آخر تحديث. سيتم إعادة تحميل الصفحة.
                        </p>

                        <button
                            onClick={onLogout}
                            className="w-full py-3 px-4 bg-red-50 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 active:scale-95 transition border border-red-100"
                        >
                            <LogOut size={18} />
                            تسجيل الخروج
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
