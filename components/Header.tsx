
import React from 'react';
import { Bell, User, QrCode } from 'lucide-react';

interface HeaderProps {
    teacherName: string;
    onQrClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ teacherName, onQrClick }) => {
    return (
        <div className="text-white pt-6 px-6 pb-2 relative z-10">
            <div className="flex justify-between items-center mb-2">
                <div className="flex gap-2">
                    <button className="p-2 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 transition">
                        <Bell size={18} />
                    </button>
                    <button 
                        onClick={onQrClick}
                        className="p-2 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 transition"
                    >
                        <QrCode size={18} />
                    </button>
                </div>
                <div className="flex items-center gap-3 bg-white/20 pr-1 pl-4 py-1 rounded-full backdrop-blur-sm">
                    <div className="text-right">
                        <p className="text-[9px] opacity-90">مرحباً بعودتك،</p>
                        <p className="text-xs font-bold leading-tight">{teacherName || 'المعلم'}</p>
                    </div>
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-primary font-bold border-2 border-white shadow-sm">
                        {teacherName ? teacherName.charAt(0) : <User size={16} />}
                    </div>
                </div>
            </div>
            <div className="text-center">
                 <h1 className="text-xl font-bold tracking-wide opacity-95">تقارير الحصص</h1>
                 <p className="text-[10px] opacity-75">نظام متابعة الأداء اليومي</p>
            </div>
        </div>
    );
};
