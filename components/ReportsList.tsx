import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { ReportCard, ReportCardData } from './ReportCard';
import { dbService } from '../services/db.service';

interface ReportsListProps {
    onViewDetails: (uid: string) => void;
    refreshTrigger?: number; // Increment to trigger refresh
}

export function ReportsList({ onViewDetails, refreshTrigger }: ReportsListProps) {
    const [reports, setReports] = useState<ReportCardData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load reports from IndexedDB
    const loadReports = async () => {
        try {
            setIsLoading(true);
            const allReports = await dbService.getAllReports();
            
            // Transform to ReportCardData format
            const cardData: ReportCardData[] = allReports.map((report: any) => ({
                uid: report.uid || report.savedAt?.toString() || Date.now().toString(),
                date: report.general?.date || '',
                level: report.general?.level || '',
                sectionId: report.general?.sectionId || '',
                hasSecondClass: report.hasSecondClass || false,
                quranReport: report.quranReport || '',
                firstClassSubject: report.firstClass?.subject || '',
                secondClassSubject: report.secondClass?.subject || ''
            }));

            // Sort by date (newest first)
            cardData.sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return dateB - dateA;
            });

            setReports(cardData);
        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, [refreshTrigger]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                <p className="text-gray-500 text-sm">جاري تحميل السجلات...</p>
            </div>
        );
    }

    if (reports.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <FileText size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">لا توجد سجلات</h3>
                <p className="text-gray-500 text-sm">ابدأ بإنشاء تقريرك الأول من تبويب "تقرير جديد"</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <FileText size={18} className="text-primary" />
                    السجلات ({reports.length})
                </h3>
                <button
                    onClick={loadReports}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                    title="تحديث"
                >
                    <RefreshCw size={16} className="text-gray-600" />
                </button>
            </div>

            {/* Reports Grid */}
            <div className="space-y-3">
                {reports.map((report) => (
                    <ReportCard
                        key={report.uid}
                        report={report}
                        onViewDetails={onViewDetails}
                    />
                ))}
            </div>
        </div>
    );
}
