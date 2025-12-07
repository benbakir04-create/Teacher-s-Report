import React from 'react';
import { Users, Plus, BookOpen } from 'lucide-react';

export function MyClassesPage() {
    return (
        <div className="p-4 pb-24 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <Users size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">أقسامي</h1>
                        <p className="text-sm text-gray-500">الأقسام الدراسية المسندة</p>
                    </div>
                </div>

                <div className="space-y-4 text-gray-500">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <BookOpen size={20} className="text-primary" />
                        <span>قائمة الأقسام</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <Plus size={20} className="text-gray-400" />
                        <span>إضافة قسم جديد</span>
                    </div>
                </div>

                <p className="mt-6 text-center text-sm text-gray-400">
                    سيتم تفعيل هذه الصفحة في المرحلة القادمة
                </p>
            </div>
        </div>
    );
}
