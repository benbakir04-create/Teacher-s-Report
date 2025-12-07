import { useState, useEffect } from 'react';
import { ReportData, TabId, ClassData, ArchivedReport, CompletionStatus } from '../types';
import { saveReport, saveBackup, logError } from '../services/googleSheetsService';
import { savePendingReport, isOnline, saveUserData as saveUserDataToStorage, getSavedUserData } from '../services/offlineService';
import toast from 'react-hot-toast';

const initialClassData: ClassData = {
    subject: '',
    lesson: '',
    strategies: [],
    tools: [],
    tasks: [],
    gender: ''
};

const initialReport: ReportData = {
    general: {
        id: '',
        name: '',
        school: '',
        level: '',
        sectionId: '',
        date: new Date().toISOString().split('T')[0]
    },
    quranReport: '',
    firstClass: { ...initialClassData },
    secondClass: { ...initialClassData },
    hasSecondClass: false,
    notes: ''
};

export function useReportForm() {
    const [report, setReport] = useState<ReportData>(initialReport);
    const [activeTab, setActiveTab] = useState<TabId>('general');
    const [archive, setArchive] = useState<ArchivedReport[]>([]);
    const [dateInputType, setDateInputType] = useState<'text' | 'date'>('text');

    // Load saved data
    useEffect(() => {
        // Load user data
        const savedUserData = getSavedUserData();
        if (savedUserData) {
            setReport(prev => ({
                ...prev,
                general: {
                    ...prev.general,
                    id: savedUserData.id || '',
                    name: savedUserData.name || '',
                    school: savedUserData.school || '',
                    level: savedUserData.level || '',
                    sectionId: savedUserData.sectionId || ''
                }
            }));
        }

        // Load draft report
        const savedReport = localStorage.getItem('teacher_report_data');
        if (savedReport) {
            try {
                const parsed = JSON.parse(savedReport);
                setReport(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Failed to load local data", e);
            }
        }

        // Load archive
        const savedArchive = localStorage.getItem('teacher_report_archive');
        if (savedArchive) {
            try {
                setArchive(JSON.parse(savedArchive));
            } catch (e) {
                console.error("Failed to load archive", e);
            }
        }
    }, []);

    // Save draft on change
    useEffect(() => {
        localStorage.setItem('teacher_report_data', JSON.stringify(report));
    }, [report]);

    // Save archive on change
    useEffect(() => {
        localStorage.setItem('teacher_report_archive', JSON.stringify(archive));
    }, [archive]);

    // Save user data when important fields change
    useEffect(() => {
        if (report.general.school && report.general.name) {
            saveUserDataToStorage({
                school: report.general.school,
                name: report.general.name,
                level: report.general.level,
                sectionId: report.general.sectionId
            });
        }
    }, [report.general.school, report.general.name, report.general.level, report.general.sectionId]);

    const handleGeneralChange = (field: keyof typeof report.general, value: string) => {
        setReport(prev => ({
            ...prev,
            general: { ...prev.general, [field]: value }
        }));
    };

    const handleClassChange = (classType: 'firstClass' | 'secondClass', field: keyof ClassData, value: any) => {
        setReport(prev => ({
            ...prev,
            [classType]: { ...prev[classType], [field]: value }
        }));
    };

    const loadFromHistory = (uid: string) => {
        if (!uid) return;
        const selectedReport = archive.find(item => item.uid === uid);
        if (selectedReport) {
            const { savedAt, uid, ...reportData } = selectedReport;
            setReport(reportData);
            toast.success("تم استرجاع البيانات بنجاح");
        }
    };

    const saveToArchive = async (online: boolean, setPendingCount: React.Dispatch<React.SetStateAction<number>>) => {
        // Validation
        if (!report.general.name || !report.general.school || !report.general.level || !report.general.sectionId || !report.general.date) {
            toast.error("يرجى إكمال جميع البيانات الأساسية (الاسم، المدرسة، المستوى، القسم، التاريخ)");
            setActiveTab('general');
            return;
        }

        const c1 = report.firstClass;
        if (!c1.subject || !c1.lesson || c1.strategies.length === 0 || c1.tools.length === 0 || c1.tasks.length === 0) {
             toast.error("يرجى إكمال جميع بيانات الحصة الأولى (المادة، الدرس، الاستراتيجيات، الوسائل، المهام)");
             setActiveTab('class1');
             return;
        }

        if (report.general.level.includes('الرابعة') && report.general.level.includes('متوسط') && c1.subject.includes('فقه') && !c1.gender) {
            toast.error("يرجى اختيار الجنس للحصة الأولى");
            setActiveTab('class1');
            return;
        }

        if (report.hasSecondClass) {
            const c2 = report.secondClass;
            if (!c2.subject || !c2.lesson || c2.strategies.length === 0 || c2.tools.length === 0 || c2.tasks.length === 0) {
                toast.error("يرجى إكمال جميع بيانات الحصة الثانية");
                setActiveTab('class2');
                return;
            }
            
            if (report.general.level.includes('الرابعة') && report.general.level.includes('متوسط') && c2.subject.includes('فقه') && !c2.gender) {
                toast.error("يرجى اختيار الجنس للحصة الثانية");
                setActiveTab('class2');
                return;
            }
        }

        // Create Archive Entry
        const newEntry: ArchivedReport = {
            ...report,
            savedAt: Date.now(),
            uid: Date.now().toString()
        };

        const existingIndex = archive.findIndex(item => 
            item.general.date === report.general.date && 
            item.general.id === report.general.id
        );

        if (existingIndex >= 0) {
            const updatedArchive = [...archive];
            updatedArchive[existingIndex] = newEntry;
            setArchive(updatedArchive);
        } else {
            setArchive(prev => [newEntry, ...prev]);
        }
        
        // Save to Google Sheets / Pending
        try {
            if (online) {
                await saveReport(report);
                await saveBackup(report);
                toast.success("تم حفظ التقرير بنجاح!");
                setPendingCount(0);
            } else {
                savePendingReport(report);
                setPendingCount(prev => prev + 1);
                toast("📡 تم حفظ التقرير محلياً. سيتم الإرسال عند عودة الاتصال", { icon: '📡', duration: 4000 });
            }
        } catch (error) {
            console.error('Error saving to Google Sheets:', error);
            logError('saveToArchive', error);
            savePendingReport(report);
            setPendingCount(prev => prev + 1);
            toast.error("⚠️ تم حفظ التقرير محلياً. سيتم المحاولة لاحقاً");
        }

        // Reset Form Logic
        setReport(prev => ({
            ...prev,
            general: {
                ...prev.general,
                date: '' // Reset date
            },
            quranReport: '',
            firstClass: { ...initialClassData },
            hasSecondClass: false,
            secondClass: { ...initialClassData },
            notes: ''
        }));
        
        setActiveTab('general');
    };

    // Helper to get completion status
    const getTabStatus = (tab: TabId): CompletionStatus => {
        switch (tab) {
            case 'dailyReport':
                // Combined status from quran + firstClass + (secondClass if enabled)
                const quranComplete = report.quranReport.length > 5;
                const class1Status = getClassStatus(report.firstClass);
                const class2Status = report.hasSecondClass ? getClassStatus(report.secondClass) : 'complete';
                
                if (quranComplete && class1Status === 'complete' && class2Status === 'complete') return 'complete';
                if (report.quranReport.length > 0 || class1Status !== 'incomplete') return 'partial';
                return 'incomplete';
            case 'notes':
                if (report.notes.length > 5) return 'complete';
                if (report.notes.length > 0) return 'partial';
                return 'incomplete';
            case 'statistics':
                return 'complete'; // Always complete
            default:
                return 'complete';
        }
    };

    const getClassStatus = (classData: ClassData): CompletionStatus => {
        const isComplete = !!(classData.subject && classData.lesson && classData.strategies.length > 0 && classData.tools.length > 0 && classData.tasks.length > 0);
        if (isComplete) return 'complete';
        const isPartial = !!(classData.subject || classData.lesson || classData.strategies.length > 0 || classData.tools.length > 0 || classData.tasks.length > 0);
        return isPartial ? 'partial' : 'incomplete';
    };

    return {
        report,
        setReport,
        activeTab,
        setActiveTab,
        archive,
        dateInputType,
        setDateInputType,
        handleGeneralChange,
        handleClassChange,
        loadFromHistory,
        saveToArchive,
        getTabStatus,
        initialReport
    };
}
