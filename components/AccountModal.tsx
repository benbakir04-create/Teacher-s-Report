import React, { useRef } from 'react';
import { X, LogOut, RefreshCw, Camera, User } from 'lucide-react';
import { TeacherData } from '../services/teacherService';

interface AccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    teacher: TeacherData | null;
    userImage?: string | null;
    googlePhotoUrl?: string | null;
    onLogout: () => void;
    onClearCache: () => void;
    onImageUpload?: (file: File) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ 
    isOpen, 
    onClose, 
    teacher, 
    userImage,
    googlePhotoUrl,
    onLogout, 
    onClearCache,
    onImageUpload
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && onImageUpload) {
            onImageUpload(file);
        }
    };

    // Priority: Google photo > Custom upload > Default icon
    const displayImage = googlePhotoUrl || userImage;

    const handleResetSessions = async () => {
        if (!teacher) return;
        
        if (confirm('هل أنت متأكد؟ سيتم تسجيل الخروج من جميع الأجهزة الأخرى المتصلة بحسابك فوراً.')) {
            const currentFingerprint = localStorage.getItem('device_fingerprint');
            if (!currentFingerprint) return;

            // Import dynamically to avoid circular dependencies if any (though here it's fine)
            const { resetDeviceFingerprints } = await import('../services/teacherService');
            
            const response = await resetDeviceFingerprints(teacher.registrationId, currentFingerprint);
            
            if (response.success) {
                alert('تم تسجيل الخروج من جميع الأجهزة الأخرى بنجاح.');
            } else {
                alert(`حدث خطأ: ${response.error || 'يرجى المحاولة لاحقاً'}`);
            }
        }
    };

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
                    {/* User Info with Profile Picture */}
                    <div className="text-center space-y-2">
                        <div 
                            onClick={handleImageClick}
                            className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full mx-auto flex items-center justify-center border-4 border-white shadow-lg -mt-14 relative z-10 cursor-pointer hover:scale-105 transition-transform group overflow-hidden"
                        >
                            {displayImage ? (
                                <img 
                                    src={displayImage} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-4xl text-white">
                                    {teacher?.name ? teacher.name.charAt(0) : '👤'}
                                </span>
                            )}
                            {/* Camera overlay on hover */}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={24} className="text-white" />
                            </div>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <p className="text-[10px] text-gray-400">اضغط على الصورة لتغييرها</p>
                        <div>
                            <h3 className="font-bold text-xl text-gray-800">{teacher?.name || 'مستخدم'}</h3>
                            <p className="text-sm text-gray-500 font-mono">{teacher?.registrationId}</p>
                            <p className="text-xs text-gray-400 mt-1">{teacher?.school}</p>
                            {teacher?.email && (
                                <p className="text-xs text-green-600 mt-1 flex items-center justify-center gap-1">
                                    <span>✓</span> {teacher.email}
                                </p>
                            )}
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Actions */}
                    <div className="space-y-3">
                        {/* Security: Reset Sessions */}
                        {teacher?.email && (
                             <button
                                onClick={handleResetSessions}
                                className="w-full py-3 px-4 bg-purple-50 text-purple-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-100 active:scale-95 transition border border-purple-100"
                            >
                                <span className="text-lg">🛡️</span>
                                إنهاء الجلسات الأخرى
                            </button>
                        )}

                        <button
                            onClick={onClearCache}
                            className="w-full py-3 px-4 bg-orange-50 text-orange-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-100 active:scale-95 transition border border-orange-100"
                        >
                            <RefreshCw size={18} />
                            تحديث التطبيق وحل المشاكل
                        </button>
                        
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
