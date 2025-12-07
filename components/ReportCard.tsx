import React from 'react';
import { Calendar, BookOpen, Eye, CheckCircle, Clock } from 'lucide-react';

export interface ReportCardData {
    uid: string;
    date: string;
    level: string;
    sectionId: string;
    hasSecondClass: boolean;
    quranReport?: string;
    firstClassSubject?: string;
    secondClassSubject?: string;
}

interface ReportCardProps {
    report: ReportCardData;
    onViewDetails: (uid: string) => void;
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

export function ReportCard({ report, onViewDetails }: ReportCardProps) {
    const classCount = report.hasSecondClass ? 2 : 1;
    const hasQuran = !!report.quranReport && report.quranReport.trim() !== '';
    
    // Determine if report is complete (has at least one subject)
    const isComplete = !!report.firstClassSubject;

    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            {/* Header: Date + Status */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-gray-700">
                    <Calendar size={16} className="text-primary" />
                    <span className="font-bold text-sm">{formatDate(report.date)}</span>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                    isComplete 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                }`}>
                    {isComplete ? (
                        <>
                            <CheckCircle size={12} />
                            <span>مكتمل</span>
                        </>
                    ) : (
                        <>
                            <Clock size={12} />
                            <span>غير مكتمل</span>
                        </>
                    )}
                </div>
            </div>

            {/* Section Info */}
            <div className="flex items-center gap-2 text-gray-600 mb-2">
                <BookOpen size={14} />
                <span className="text-sm">{report.level} - القسم {report.sectionId}</span>
            </div>

            {/* Classes Info */}
            <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                    {classCount} {classCount === 1 ? 'حصة' : 'حصتين'}
                </span>
                {hasQuran && (
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium">
                        قرآن ✓
                    </span>
                )}
                {report.firstClassSubject && (
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
                        {report.firstClassSubject}
                    </span>
                )}
            </div>

            {/* View Details Button */}
            <button
                onClick={() => onViewDetails(report.uid)}
                className="w-full py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition"
            >
                <Eye size={16} />
                عرض التفاصيل
            </button>
        </div>
    );
}
