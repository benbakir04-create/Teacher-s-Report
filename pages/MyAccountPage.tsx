import React from 'react';
import { User, Mail, Key, Shield } from 'lucide-react';

export function MyAccountPage() {
    return (
        <div className="p-4 pb-24 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <User size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">حسابي</h1>
                        <p className="text-sm text-gray-500">إدارة معلومات الحساب</p>
                    </div>
                </div>

                <div className="space-y-4 text-gray-500">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <Key size={20} className="text-primary" />
                        <span>رقم التسجيل وتفاصيل الهوية</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <Mail size={20} className="text-primary" />
                        <span>البريد الإلكتروني المرتبط</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <Shield size={20} className="text-primary" />
                        <span>الأمان والخصوصية</span>
                    </div>
                </div>

                <p className="mt-6 text-center text-sm text-gray-400">
                    سيتم تفعيل هذه الصفحة في المرحلة القادمة
                </p>
            </div>
        </div>
    );
}
