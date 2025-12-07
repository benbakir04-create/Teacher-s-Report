import React from 'react';
import { X, Calendar, User, Building, BookOpen, MessageSquare, CheckCircle } from 'lucide-react';
import { ReportData } from '../types';

interface ReportDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: ReportData | null;
}

// Format date as YYYY/MM/DD
const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}/${month}/${day}`;
};

export function ReportDetailsModal({ isOpen, onClose, report }: ReportDetailsModalProps) {
    if (!isOpen || !report) return null;

    const renderSection = (title: string, icon: React.ReactNode, content: React.ReactNode) => (
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                {icon}
                {title}
            </h4>
            {content}
        </div>
    );

    const renderClassDetails = (classData: typeof report.firstClass, label: string) => {
        if (!classData.subject) return null;
        
        return (
            <div className="bg-white rounded-lg p-3 border border-gray-200 mb-2">
                <h5 className="text-xs font-bold text-gray-700 mb-2">{label}</h5>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">المادة:</span>
                        <span className="font-medium">{classData.subject}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">الدرس:</span>
                        <span className="font-medium">{classData.lesson}</span>
                    </div>
                    {classData.gender && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">الجنس:</span>
                            <span className="font-medium">{classData.gender}</span>
                        </div>
                    )}
                    {classData.strategies.length > 0 && (
                        <div>
                            <span className="text-gray-500 block mb-1">الاستراتيجيات:</span>
                            <div className="flex flex-wrap gap-1">
                                {classData.strategies.map(s => (
                                    <span key={s} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {classData.tools.length > 0 && (
                        <div>
                            <span className="text-gray-500 block mb-1">الوسائل:</span>
                            <div className="flex flex-wrap gap-1">
                                {classData.tools.map(t => (
                                    <span key={t} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {classData.tasks.length > 0 && (
                        <div>
                            <span className="text-gray-500 block mb-1">المهام:</span>
                            <div className="flex flex-wrap gap-1">
                                {classData.tasks.map(t => (
                                    <span key={t} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-white w-full max-w-md max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-secondary p-4 text-white sticky top-0">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold">تفاصيل التقرير</h3>
                        <button 
                            onClick={onClose}
                            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-white/90 text-sm">
                        <Calendar size={14} />
                        <span>{formatDate(report.general.date)}</span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[calc(85vh-100px)]">
                    {/* General Info */}
                    {renderSection('البيانات الأساسية', <User size={16} />, (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-gray-500 block text-xs">الاسم</span>
                                <span className="font-medium">{report.general.name}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs">رقم التسجيل</span>
                                <span className="font-medium">{report.general.id}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs">المدرسة</span>
                                <span className="font-medium">{report.general.school}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs">المستوى</span>
                                <span className="font-medium">{report.general.level}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs">القسم</span>
                                <span className="font-medium">{report.general.sectionId}</span>
                            </div>
                        </div>
                    ))}

                    {/* Quran Report */}
                    {report.quranReport && (
                        renderSection('تقرير القرآن', <BookOpen size={16} />, (
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {report.quranReport}
                            </p>
                        ))
                    )}

                    {/* Classes */}
                    {renderSection('الحصص الدراسية', <CheckCircle size={16} />, (
                        <div>
                            {renderClassDetails(report.firstClass, 'الحصة الأولى')}
                            {report.hasSecondClass && renderClassDetails(report.secondClass, 'الحصة الثانية')}
                        </div>
                    ))}

                    {/* Notes */}
                    {report.notes && (
                        renderSection('ملاحظات', <MessageSquare size={16} />, (
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {report.notes}
                            </p>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
}
