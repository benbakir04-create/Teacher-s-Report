import React from 'react';
import { Bell, User, QrCode } from 'lucide-react';
import { SyncStatus } from './SyncStatus';

interface HeaderProps {
    teacherName: string;
    userImage?: string | null;
    onQrClick: () => void;
    onAvatarClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ teacherName, userImage, onQrClick, onAvatarClick }) => {
    return (
        <div className="p-5 text-white">
            <div className="flex justify-between items-start mb-4">
                {/* Right Side: Avatar & Name */}
                <div className="flex items-center gap-3">
                    <div 
                        onClick={onAvatarClick}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary font-bold border-2 border-white shadow-sm overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                    >
                        {userImage ? (
                            <img src={userImage} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            teacherName ? teacherName.charAt(0) : <User size={20} />
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] opacity-90">مرحباً بعودتك،</p>
                        <p className="text-sm font-bold leading-tight">{teacherName || 'المعلم'}</p>
                    </div>
                </div>

                {/* Left Side: Actions */}
                <div className="flex gap-2 items-center">
                    <SyncStatus compact />
                    <button 
                        onClick={onQrClick}
                        className="p-2 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 transition"
                    >
                        <QrCode size={20} />
                    </button>
                    <button className="p-2 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 transition">
                        <Bell size={20} />
                    </button>
                </div>
            </div>

            {/* Title Section */}
            <div className="text-center">
                <h1 className="text-2xl font-bold tracking-wide opacity-95">تقارير الحصص</h1>
                <p className="text-xs opacity-75">نظام متابعة الأداء اليومي</p>
            </div>
        </div>
    );
};
