import React from 'react';
import { Settings, Bell, Palette, Database, Info } from 'lucide-react';

export function SystemSettingsPage() {
    return (
        <div className="p-4 pb-24 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <Settings size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">إعدادات النظام</h1>
                        <p className="text-sm text-gray-500">التفضيلات والإعدادات العامة</p>
                    </div>
                </div>

                <div className="space-y-4 text-gray-500">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <Bell size={20} className="text-primary" />
                        <span>الإشعارات</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <Palette size={20} className="text-primary" />
                        <span>المظهر والألوان</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <Database size={20} className="text-primary" />
                        <span>البيانات والتخزين</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <Info size={20} className="text-primary" />
                        <span>عن التطبيق</span>
                    </div>
                </div>

                <p className="mt-6 text-center text-sm text-gray-400">
                    سيتم تفعيل هذه الصفحة في المرحلة القادمة
                </p>
            </div>
        </div>
    );
}
