import React from 'react';
import { Building, GraduationCap, User, Mail, Phone, BookOpen, Save, ChevronDown, AlertCircle } from 'lucide-react';
import { useGeneralData } from '../hooks/useGeneralData';

export function GeneralDataPage() {
    const {
        data,
        isLoading,
        isSaving,
        errors,
        updateField,
        saveData,
        subjects,
        fullClassName,
        levels,
        sections,
        schools
    } = useGeneralData();

    if (isLoading) {
        return (
            <div className="p-4 pb-24 animate-fade-in">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="mr-3 text-gray-500">جاري التحميل...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 pb-24 space-y-4 animate-fade-in">
            {/* Header Card */}
            <div className="bg-gradient-to-bl from-primary to-secondary rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <User size={28} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">البيانات العامة</h1>
                        <p className="text-sm opacity-80">معلومات الملف الشخصي للمعلم</p>
                    </div>
                </div>
                {fullClassName && (
                    <div className="mt-4 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                        <span className="text-sm opacity-75">القسم الحالي:</span>
                        <span className="font-bold mr-2">{fullClassName}</span>
                    </div>
                )}
            </div>

            {/* Personal Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                    <User size={18} /> المعلومات الشخصية
                </h3>
                
                <div className="space-y-4">
                    {/* Registration ID - LOCKED */}
                    <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1">
                            رقم التسجيل <span className="text-gray-400">(مقفل)</span>
                        </label>
                        <input
                            type="text"
                            value={data.registrationId}
                            readOnly
                            disabled
                            className="w-full p-3 bg-gray-100 text-gray-600 text-sm rounded-xl border border-gray-200 cursor-not-allowed"
                            placeholder="يتم جلبه من النظام"
                        />
                        <p className="text-gray-400 text-xs mt-1">لا يمكن تعديله — مصدره الإدارة</p>
                    </div>

                    {/* Full Name - LOCKED */}
                    <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1">
                            الاسم الكامل <span className="text-gray-400">(مقفل)</span>
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            readOnly
                            disabled
                            className="w-full p-3 bg-gray-100 text-gray-600 text-sm rounded-xl border border-gray-200 cursor-not-allowed"
                            placeholder="يتم جلبه من النظام"
                        />
                        <p className="text-gray-400 text-xs mt-1">لا يمكن تعديله — مصدره الإدارة</p>
                    </div>

                    {/* Email - LOCKED (from Google) */}
                    <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1">
                            <Mail size={12} className="inline ml-1" />
                            البريد الإلكتروني <span className="text-gray-400">(مقفل)</span>
                        </label>
                        <input
                            type="email"
                            value={data.email}
                            readOnly
                            disabled
                            className="w-full p-3 bg-gray-100 text-gray-600 text-sm rounded-xl border border-gray-200 cursor-not-allowed"
                            placeholder="مرتبط بحساب Google"
                            dir="ltr"
                        />
                        <p className="text-gray-400 text-xs mt-1">مرتبط بحساب Google — يُعدَّل من الإعدادات</p>
                    </div>

                    {/* Phone (Optional) */}
                    <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1">
                            <Phone size={12} className="inline ml-1" />
                            رقم الهاتف <span className="text-gray-400">(اختياري)</span>
                        </label>
                        <input
                            type="tel"
                            value={data.phone || ''}
                            onChange={(e) => updateField('phone', e.target.value)}
                            className="w-full p-3 bg-gray-50 text-gray-900 text-sm rounded-xl border border-gray-200 focus:border-primary outline-none transition"
                            placeholder="0XX XXX XXXX"
                            dir="ltr"
                        />
                    </div>
                </div>
            </div>

            {/* School & Class Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                    <Building size={18} /> المدرسة والقسم
                </h3>
                
                <div className="space-y-4">
                    {/* School */}
                    <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1">
                            اسم المدرسة <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                value={data.school}
                                onChange={(e) => updateField('school', e.target.value)}
                                className={`w-full p-3 bg-gray-50 text-gray-900 text-sm rounded-xl border appearance-none ${errors.school ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:border-primary outline-none transition`}
                            >
                                <option value="">اختر المدرسة...</option>
                                {schools.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        {errors.school && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle size={12} /> {errors.school}
                            </p>
                        )}
                    </div>

                    {/* Level & Section Row */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Level */}
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">
                                <GraduationCap size={12} className="inline ml-1" />
                                المستوى <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={data.level}
                                    onChange={(e) => updateField('level', e.target.value)}
                                    className={`w-full p-3 bg-gray-50 text-gray-900 text-sm rounded-xl border appearance-none ${errors.level ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:border-primary outline-none transition`}
                                >
                                    <option value="">اختر...</option>
                                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                            {errors.level && (
                                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                    <AlertCircle size={12} /> {errors.level}
                                </p>
                            )}
                        </div>

                        {/* Section Number */}
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">
                                القسم <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={data.sectionNumber}
                                    onChange={(e) => updateField('sectionNumber', e.target.value)}
                                    className={`w-full p-3 bg-gray-50 text-gray-900 text-sm rounded-xl border appearance-none ${errors.sectionNumber ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:border-primary outline-none transition`}
                                >
                                    <option value="">اختر...</option>
                                    {sections.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                            {errors.sectionNumber && (
                                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                    <AlertCircle size={12} /> {errors.sectionNumber}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Subjects Card (Read-only) */}
            {subjects.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-base font-bold text-primary mb-3 flex items-center gap-2">
                        <BookOpen size={18} /> المواد الخاصة بالمستوى
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">هذه المواد مستخرجة تلقائياً حسب المستوى المختار</p>
                    
                    <div className="flex flex-wrap gap-2">
                        {subjects.map(subject => (
                            <span 
                                key={subject}
                                className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-lg"
                            >
                                {subject}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Save Button */}
            <button
                onClick={saveData}
                disabled={isSaving}
                className={`w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all duration-300 ${
                    isSaving 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-primary to-secondary hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                }`}
            >
                {isSaving ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        جاري الحفظ...
                    </>
                ) : (
                    <>
                        <Save size={20} />
                        حفظ التغييرات
                    </>
                )}
            </button>
        </div>
    );
}
