import React from 'react';
import { Building, GraduationCap, Users } from 'lucide-react';

export function GeneralDataPage() {
    return (
        <div className="p-4 pb-24 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <Building size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">البيانات العامة</h1>
                        <p className="text-sm text-gray-500">المدرسة والمستوى الدراسي</p>
                    </div>
                </div>

                <div className="space-y-4 text-gray-500">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <Building size={20} className="text-primary" />
                        <span>اسم المدرسة</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <GraduationCap size={20} className="text-primary" />
                        <span>المستوى الدراسي</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <Users size={20} className="text-primary" />
                        <span>القسم</span>
                    </div>
                </div>

                <p className="mt-6 text-center text-sm text-gray-400">
                    سيتم تفعيل هذه الصفحة في المرحلة القادمة
                </p>
            </div>
        </div>
    );
}
