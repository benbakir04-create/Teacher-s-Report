import React, { useState } from 'react';
import { 
    User, Building, BookOpen, ChevronDown, School, 
    RefreshCw, Save, FileText, Plus, ClipboardList 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { CheckboxGrid } from '../components/CheckboxGrid';
import { ReportsList } from '../components/ReportsList';
import { ReportDetailsModal } from '../components/ReportDetailsModal';
import { ReportCardData } from '../components/ReportCard';
import { ReportData, ClassData, ListData, ArchivedReport } from '../types';
import { getLessonsForSubject } from '../dataManager';
import { dbService } from '../services/db.service';

interface DailyReportPageProps {
    report: ReportData;
    setReport: React.Dispatch<React.SetStateAction<ReportData>>;
    appData: ListData;
    availableSubjects: string[];
    loadFromHistory: (uid: string) => void;
    saveToArchive: (online: boolean, setPendingCount: React.Dispatch<React.SetStateAction<number>>) => Promise<void>;
    online: boolean;
    setPendingCount: React.Dispatch<React.SetStateAction<number>>;
    dateInputType: 'text' | 'date';
    setDateInputType: React.Dispatch<React.SetStateAction<'text' | 'date'>>;
    handleGeneralChange: (field: keyof ReportData['general'], value: string) => void;
    handleClassChange: (classType: 'firstClass' | 'secondClass', field: keyof ClassData, value: any) => void;
    activeSubTab: 'form' | 'list';
    setActiveSubTab: (tab: 'form' | 'list') => void;
    archive: ArchivedReport[];
}

// Helper to format date
const formatDateDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}/${month}/${day}`;
};

export function DailyReportPage({
    report, setReport, appData, availableSubjects,
    loadFromHistory, saveToArchive, online, setPendingCount,
    dateInputType, setDateInputType, handleGeneralChange, handleClassChange,
    activeSubTab, setActiveSubTab, archive
}: DailyReportPageProps) {
    const [openAccordion, setOpenAccordion] = useState<string | null>('strategies');
    const [selectedReportUid, setSelectedReportUid] = useState<string | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [detailsReport, setDetailsReport] = useState<ReportData | null>(null);
    const [refreshListTrigger, setRefreshListTrigger] = useState(0);

    // View Report Details
    const handleViewDetails = async (uid: string) => {
        try {
            // Find in local archive first
            const localReport = archive.find(r => r.uid === uid);
            if (localReport) {
                const { savedAt, uid: _, ...data } = localReport;
                setDetailsReport(data);
                setIsDetailsModalOpen(true);
                return;
            }

            // Fallback to fetching from DB (if not in local archive/state)
            const allReports = await dbService.getAllReports();
            const dbReport = allReports.find((r: any) => (r.uid === uid) || (r.savedAt?.toString() === uid));
            if (dbReport) {
                setDetailsReport(dbReport);
                setIsDetailsModalOpen(true);
            } else {
                toast.error("لم يتم العثور على تفاصيل التقرير");
            }
        } catch (error) {
            console.error("Error fetching details", error);
            toast.error("حدث خطأ أثناء عرض التفاصيل");
        }
    };

    // Render Functions (Ported from App.tsx)
    const renderGeneralInfo = () => {
        const { id, name, school, level, sectionId, date } = report.general;
        const isGeneralComplete = !!(id && name && school && level && sectionId && date);

        return (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
                <h3 className="text-base font-bold text-primary mb-3 flex items-center gap-2">
                    <User size={18} /> البيانات الأساسية
                </h3>
                
                <div className="space-y-3">
                    {/* Compact Row for ID and Name */}
                    <div className="flex gap-3">
                        <div className="w-[35%]">
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">رقم التسجيل</label>
                            <input
                                type="text"
                                value={report.general.id}
                                disabled // Read-only
                                className="w-full p-2 bg-gray-100 text-gray-500 text-sm rounded-lg border border-gray-200 outline-none cursor-not-allowed"
                            />
                        </div>
                        <div className="w-[65%]">
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">اسم المعلم</label>
                            <input
                                type="text"
                                value={report.general.name}
                                disabled // Read-only
                                className="w-full p-2 bg-gray-100 text-gray-500 text-sm rounded-lg border border-gray-200 outline-none cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">اسم المدرسة</label>
                        <div className="relative">
                            <select
                                value={report.general.school}
                                onChange={(e) => handleGeneralChange('school', e.target.value)}
                                className="w-full p-2 bg-gray-50 text-gray-900 text-sm rounded-lg border border-gray-200 appearance-none focus:border-primary outline-none"
                            >
                                <option value="">اختر المدرسة...</option>
                                {appData.schools.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Grade and Section on same row */}
                    <div className="flex gap-3">
                        <div className="w-[70%]">
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">المستوى الدراسي</label>
                            <div className="relative">
                                <select
                                    value={report.general.level}
                                    onChange={(e) => handleGeneralChange('level', e.target.value)}
                                    className="w-full p-2 bg-gray-50 text-gray-900 text-sm rounded-lg border border-gray-200 appearance-none focus:border-primary outline-none"
                                >
                                    <option value="">اختر المستوى...</option>
                                    {appData.levels.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="w-[30%]">
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">القسم</label>
                            <div className="relative">
                                <select
                                    value={report.general.sectionId}
                                    onChange={(e) => handleGeneralChange('sectionId', e.target.value)}
                                    className="w-full p-2 bg-gray-50 text-gray-900 text-sm rounded-lg border border-gray-200 appearance-none focus:border-primary outline-none"
                                >
                                    <option value="">اختر...</option>
                                    {appData.sections.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <School size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Date Section */}
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 mt-2">
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">تاريخ التقرير</label>
                        <div className="relative">
                            <input
                                type={dateInputType}
                                value={dateInputType === 'date' ? report.general.date : formatDateDisplay(report.general.date)}
                                onChange={(e) => handleGeneralChange('date', e.target.value)}
                                onFocus={() => setDateInputType('date')}
                                onBlur={() => setDateInputType('text')}
                                dir="rtl"
                                className="w-full p-2 bg-white text-gray-900 text-sm font-bold rounded-lg border border-gray-300 focus:border-primary outline-none text-right"
                                placeholder="اليوم / الشهر / السنة"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderQuranInfo = () => (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
            <h3 className="text-base font-bold text-primary mb-3 flex items-center gap-2">
                <BookOpen size={18} /> تقرير القرآن
            </h3>
            <textarea
                value={report.quranReport}
                onChange={(e) => setReport(prev => ({ ...prev, quranReport: e.target.value }))}
                className="w-full h-32 p-3 bg-gray-50 text-gray-900 text-sm rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none transition leading-relaxed"
                placeholder="اكتب تقريرك عن حصة القرآن هنا..."
            ></textarea>
        </div>
    );

    const renderClassInfo = (classType: 'firstClass' | 'secondClass') => {
        const data = report[classType];
        const label = classType === 'firstClass' ? 'الحصة الأولى' : 'الحصة الثانية';

        return (
            <div className="space-y-4 animate-fade-in">
                {classType === 'firstClass' && (
                     <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-primary">
                                <BookOpen size={16} />
                            </div>
                            <span className="text-sm font-bold text-gray-700">هل توجد حصة ثانية؟</span>
                        </div>
                        <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
                            <button
                                onClick={() => setReport(prev => ({ ...prev, hasSecondClass: true }))}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-300 
                                    ${report.hasSecondClass 
                                        ? 'bg-primary text-white shadow-md transform scale-105' 
                                        : 'text-gray-400 hover:bg-gray-200'
                                    }`}
                            >
                                نعم
                            </button>
                            <button
                                onClick={() => setReport(prev => ({ ...prev, hasSecondClass: false }))}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-300 
                                    ${!report.hasSecondClass 
                                        ? 'bg-primary text-white shadow-md transform scale-105' 
                                        : 'text-gray-400 hover:bg-gray-200'
                                    }`}
                            >
                                لا
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                        <BookOpen size={18} /> {label}
                    </h3>
                    
                    <div className="space-y-4">
                        {/* Subject & Lesson */}
                        <div className="grid grid-cols-[2fr_3fr] gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1">المادة</label>
                                <div className="relative">
                                    <select
                                        value={data.subject}
                                        onChange={(e) => handleClassChange(classType, 'subject', e.target.value)}
                                        className="w-full p-2 bg-gray-50 text-gray-900 text-sm rounded-lg border border-gray-200 appearance-none focus:border-primary outline-none"
                                    >
                                        <option value="">اختر...</option>
                                        {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1">عنوان الدرس</label>
                                <div className="relative">
                                    <select
                                        value={data.lesson}
                                        onChange={(e) => handleClassChange(classType, 'lesson', e.target.value)}
                                        className="w-full p-2 bg-gray-50 text-gray-900 text-sm rounded-lg border border-gray-200 appearance-none focus:border-primary outline-none"
                                    >
                                        <option value="">اختر الدرس...</option>
                                        {getLessonsForSubject(data.subject, report.general.level, data.gender).map(lesson => (
                                            <option key={lesson} value={lesson}>{lesson}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Gender Selection for Fiqh/4th Grade */}
                        {report.general.level.includes('الرابعة') && report.general.level.includes('متوسط') && data.subject.includes('فقه') && (
                            <div className="bg-gradient-to-r from-blue-50 to-pink-50 p-3 rounded-xl border border-gray-100">
                                <label className="block text-[10px] font-bold text-gray-600 mb-2">جنس الطلاب (مطلوب للفقه - رابعة متوسط)</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleClassChange(classType, 'gender', 'بنين')}
                                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                                            data.gender === 'بنين' 
                                            ? 'bg-emerald-500 text-white shadow-md' 
                                            : 'bg-white text-gray-500 border border-emerald-200 hover:bg-emerald-50'
                                        }`}
                                    >
                                        <span>ذكور</span>
                                        <span className="text-[9px] opacity-70">فقه المعاملات</span>
                                    </button>
                                    <button
                                        onClick={() => handleClassChange(classType, 'gender', 'بنات')}
                                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                                            data.gender === 'بنات' 
                                            ? 'bg-pink-400 text-white shadow-md' 
                                            : 'bg-white text-gray-500 border border-pink-200 hover:bg-pink-50'
                                        }`}
                                    >
                                        <span>إناث</span>
                                        <span className="text-[9px] opacity-70">فقه النساء</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Strategies */}
                        <CheckboxGrid
                            items={appData.strategies}
                            selected={data.strategies}
                            onChange={(selected) => handleClassChange(classType, 'strategies', selected)}
                            label="استراتيجيات التدريس"
                        />

                        {/* Tools */}
                        <CheckboxGrid
                            items={appData.tools}
                            selected={data.tools}
                            onChange={(selected) => handleClassChange(classType, 'tools', selected)}
                            label="الوسائل التعليمية"
                        />

                        {/* Tasks */}
                        <CheckboxGrid
                            items={appData.tasks}
                            selected={data.tasks}
                            onChange={(selected) => handleClassChange(classType, 'tasks', selected)}
                            label="المهام المنجزة"
                        />
                    </div>
                </div>
            </div>
        );
    };

    const handleSave = async () => {
        await saveToArchive(online, setPendingCount);
        // Maybe refresh the list?
        setRefreshListTrigger(prev => prev + 1);
    };

    return (
        <div className="space-y-4 max-w-md mx-auto">
            {/* Top Sub-navigation Tabs */}
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                <button
                    onClick={() => setActiveSubTab('form')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                        activeSubTab === 'form'
                            ? 'bg-primary text-white shadow-md'
                            : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                    <Plus size={16} />
                    تقرير جديد
                </button>
                <div className="w-px bg-gray-100 my-2"></div>
                <button
                    onClick={() => setActiveSubTab('list')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                        activeSubTab === 'list'
                            ? 'bg-primary text-white shadow-md'
                            : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                    <ClipboardList size={16} />
                    السجلات
                </button>
            </div>

            {/* Content Area */}
            <div className="animate-fade-in">
                {activeSubTab === 'form' ? (
                    <div className="space-y-4">
                        {renderGeneralInfo()}
                        {renderQuranInfo()}
                        {renderClassInfo('firstClass')}
                        {report.hasSecondClass && renderClassInfo('secondClass')}
                        
                        {/* Save Button */}
                        <div className="sticky bottom-[80px] z-30 pb-4">
                            <button
                                onClick={handleSave}
                                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                            >
                                <Save size={20} />
                                حفظ التقرير
                            </button>
                        </div>
                    </div>
                ) : (
                    <ReportsList 
                        onViewDetails={handleViewDetails} 
                        refreshTrigger={refreshListTrigger} 
                    />
                )}
            </div>

            {/* Details Modal */}
            <ReportDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                onEdit={(uid) => {
                    loadFromHistory(uid);
                    setActiveSubTab('form');
                }}
                report={detailsReport}
            />
        </div>
    );
}
