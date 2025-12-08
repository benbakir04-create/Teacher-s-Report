import React from 'react';
import { User, Settings, Users, Cog, X } from 'lucide-react';
import { MenuPage } from '../types';

import { useUser } from '../hooks/useUser';
import { can } from '../services/permissionService';

interface UserMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (page: MenuPage) => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ isOpen, onClose, onNavigate }) => {
    const { currentUser } = useUser();

    if (!isOpen) return null;

    const menuItems = [
        { id: 'myAccount' as MenuPage, label: 'حسابي', icon: User, description: 'معلومات الحساب' },
        { id: 'generalData' as MenuPage, label: 'البيانات العامة', icon: Settings, description: 'المدرسة والمستوى' },
        { id: 'myClasses' as MenuPage, label: 'أقسامي', icon: Users, description: 'الأقسام الدراسية' },
        { id: 'systemSettings' as MenuPage, label: 'إعدادات النظام', icon: Cog, description: 'الإعدادات والتفضيلات' },
    ];

    if (can(currentUser, 'users.manage')) {
        menuItems.push({
            id: 'usersManagement' as MenuPage,
            label: 'إدارة المستخدمين',
            icon: Users,
            description: 'الصلاحيات والحسابات'
        });
    }

    if (can(currentUser, 'reports.view.school')) {
        menuItems.push({
            id: 'adminDashboard' as MenuPage,
            label: 'لوحة التحكم',
            icon: Cog, // We can replace with LayoutDashboard if available
            description: 'إحصائيات الإدارة'
        });
    }

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-fade-in"
                onClick={onClose}
            />
            
            {/* Menu Panel */}
            <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-[101] animate-slide-in-right">
                {/* Header */}
                <div className="bg-gradient-to-bl from-primary to-secondary p-6 text-white">
                    <div className="flex justify-between items-start mb-4">
                        <button 
                            onClick={onClose}
                            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-bold">القائمة الرئيسية</h2>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="p-4 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onNavigate(item.id);
                                    onClose();
                                }}
                                className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-primary/10 rounded-xl transition-all duration-200 group"
                            >
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                    <Icon size={24} />
                                </div>
                                <div className="text-right flex-1">
                                    <p className="font-bold text-gray-800">{item.label}</p>
                                    <p className="text-xs text-gray-500">{item.description}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );
};
