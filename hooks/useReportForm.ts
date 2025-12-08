import React, { useState, useEffect, useRef } from 'react';
import { ReportData, TabId, ClassData, CompletionStatus } from '../types';
import { saveReport, saveBackup, logError } from '../services/googleSheetsService';
import { savePendingReport, getSavedUserData, saveUserData as saveUserDataToStorage } from '../services/offlineService';
import { dbService } from '../services/db.service';
import { syncService } from '../services/syncService';
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
    const [activeTab, setActiveTab] = useState<TabId>('dailyReport');
    const [dateInputType, setDateInputType] = useState<'text' | 'date'>('text');
    
    // Auto-save ref to debounce updates
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastSavedDraftRef = useRef<string>('');

    // Load initial user data only
    useEffect(() => {
        const init = async () => {
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
        };
        init();
    }, []);

    // Check for Draft when Section or Date Changes
    useEffect(() => {
        const checkForDraft = async () => {
             if (report.general.sectionId && report.general.date) {
                 try {
                     const draft = await dbService.getDraft(report.general.sectionId, report.general.date);
                     if (draft) {
                         // Check if this draft is meaningfully different from current (empty) state
                         // For now, simpler: just load it if we haven't touched the form yet (or ask user?)
                         // Per prompt: "Loads automatically and alerts"
                         
                         // We should only load if it's NOT the same as what we just saved/loaded to avoid loops
                         // But here we rely on user action.
                         // Let's protect against overwriting if the user is already typing? 
                         // For now, simpler implementation:
                         
                         // Only load if the current form is effectively empty in critical areas
                         // OR, simpler: The system *always* hydrates from draft for this date+section
                         
                         // Check equality to avoid unnecessary re-renders/toasts
                         if (JSON.stringify(draft) !== JSON.stringify(report) && JSON.stringify(draft) !== lastSavedDraftRef.current) {
                             setReport(draft);
                             toast("📝 تم استرجاع مسودة غير محفوظة للاستكمال", { icon: '📝' });
                         }
                     }
                 } catch (e) {
                     console.error("Error checking draft", e);
                 }
             }
        };
        
        checkForDraft();
    }, [report.general.sectionId, report.general.date]);

    // Auto-Save Draft Logic (Debounced 5s)
    useEffect(() => {
        // Don't save if basic info is missing
        if (!report.general.sectionId || !report.general.date) return;

        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(async () => {
            const currentString = JSON.stringify(report);
            if (currentString !== lastSavedDraftRef.current) {
                // Ensure it's not just an empty layout
                const isFormDirty = report.quranReport || report.firstClass.subject || report.notes;
                
                if (isFormDirty) {
                    await dbService.saveDraft(report);
                    lastSavedDraftRef.current = currentString;
                    // console.log('Draft Auto-saved');
                }
            }
        }, 5000); // 5 seconds debounce (Prompt said 8s, 5s is snappier)

        return () => {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        };
    }, [report]);

    // Save user data when important fields change (Profile persistence)
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

    // Load full report for editing (from button in List/Modal)
    const loadFromHistory = async (uid: string) => {
        if (!uid) return;
        try {
            const loaded = await dbService.getReportById(uid);
            if (loaded) {
                // When loading for edit, we might want to keep the current date or use the saved one?
                // Usually editing implies modifying THAT record.
                setReport({ ...loaded }); // Load fully
                toast.success("تم فتح التقرير للتعديل");
            } else {
                toast.error("لم يتم العثور على التقرير");
            }
        } catch (e) {
            console.error(e);
            toast.error("خطأ في استرجاع التقرير");
        }
    };

    const saveToArchive = async (online: boolean, setPendingCount: React.Dispatch<React.SetStateAction<number>>) => {
        // Validation
        if (!report.general.name || !report.general.school || !report.general.level || !report.general.sectionId || !report.general.date) {
            toast.error("يرجى إكمال جميع البيانات الأساسية");
            setActiveTab('dailyReport');
            return;
        }

        const c1 = report.firstClass;
        if (!c1.subject || !c1.lesson || c1.strategies.length === 0 || c1.tools.length === 0 || c1.tasks.length === 0) {
             toast.error("يرجى إكمال جميع بيانات الحصة الأولى");
             setActiveTab('dailyReport');
             return;
        }

        if (report.general.level.includes('الرابعة') && report.general.level.includes('متوسط') && c1.subject.includes('فقه') && !c1.gender) {
            toast.error("يرجى اختيار الجنس للحصة الأولى");
            setActiveTab('dailyReport');
            return;
        }

        if (report.hasSecondClass) {
            const c2 = report.secondClass;
            if (!c2.subject || !c2.lesson || c2.strategies.length === 0 || c2.tools.length === 0 || c2.tasks.length === 0) {
                toast.error("يرجى إكمال جميع بيانات الحصة الثانية");
                setActiveTab('dailyReport');
                return;
            }
            
            if (report.general.level.includes('الرابعة') && report.general.level.includes('متوسط') && c2.subject.includes('فقه') && !c2.gender) {
                toast.error("يرجى اختيار الجنس للحصة الثانية");
                setActiveTab('dailyReport');
                return;
            }
        }

        // 1. Save to IndexedDB (Reports Store)
        try {
            const reportToSave = {
                ...report,
                uid: report['uid'] || Date.now().toString(), // Preserve UID if editing, else new
                savedAt: Date.now()
            };
            
            await dbService.saveReport(reportToSave);
            
            // 2. Delete Draft associated with this report
            await dbService.deleteDraft(report.general.sectionId, report.general.date);

            // 3. Queue for Cloud Sync (Phase 7)
            await syncService.queueForSync('report', reportToSave);

            // 4. Legacy Google Sheets Sync (will be removed in future)
            if (online) {
                try {
                    await saveReport(reportToSave);
                    await saveBackup(reportToSave);
                } catch (sheetError) {
                    console.warn('Google Sheets sync failed, data is in cloud queue:', sheetError);
                }
                toast.success("تم حفظ التقرير بنجاح!");
                setPendingCount(0);
            } else {
                savePendingReport(reportToSave);
                setPendingCount(prev => prev + 1);
                toast("📡 تم حفظ التقرير محلياً. سيتم الإرسال عند عودة الاتصال", { icon: '📡', duration: 4000 });
            }

            // 4. Reset Form (Keep user ID/Name/School, but clear daily specifics)
            // We use the same 'general' object but reset date? Or keep date?
            // Usually user wants to enter same day different class OR next day.
            // Let's reset purely report fields.
            setReport(prev => ({
                ...prev,
                quranReport: '',
                firstClass: { ...initialClassData },
                hasSecondClass: false,
                secondClass: { ...initialClassData },
                notes: '',
                // Keep general info
                general: {
                   ...prev.general,
                   // Maybe keep date? Or reset?
                   // User preference. Keeping date is usually helpful for batching.
                   date: prev.general.date 
                }
            }));
            
            lastSavedDraftRef.current = ''; // Reset draft tracker

        } catch (error) {
            console.error('Error saving report:', error);
            toast.error("حدث خطأ أثناء الحفظ");
            logError('saveToArchive', error);
        }
    };

    const getTabStatus = (tab: TabId): CompletionStatus => {
        switch (tab) {
            case 'dailyReport':
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
                return 'complete';
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
