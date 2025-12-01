

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { CheckboxGrid } from './components/CheckboxGrid';
import { ProgressStepper } from './components/ProgressStepper';
import { AboutProject } from './components/AboutProject';
import { Dashboard } from './Dashboard';
import { MOCK_DATA } from './constants';
import { ReportData, TabId, ClassData, CompletionStatus, ListData } from './types';
import { ChevronDown, User, Building, BookOpen, MessageSquare, School, Save, RefreshCw, TrendingUp, Award, AlertCircle, WifiOff } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import QRCode from 'qrcode';
import { loadData, getLessonsForSubject } from './dataManager';
import { saveReport, saveBackup, logError } from './services/googleSheetsService';
import { 
    isOnline, 
    savePendingReport, 
    syncPendingReports, 
    saveUserData as saveUserDataToStorage,
    getSavedUserData,
    setupConnectionListeners,
    registerServiceWorker,
    getPendingReports
} from './services/offlineService';


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

interface ArchivedReport extends ReportData {
    savedAt: number;
    uid: string;
}

// Mock Data for Reports Chart
interface ChartData {
    subject: string;
    total: number; // Expected
    actual: number; // Executed
    percentage: string;
}

// Helper to format date as YYYY/MM/DD so it reads Day-Month-Year from Right-to-Left visually in RTL inputs
const formatDateDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}/${month}/${day}`;
};

// Custom Tick Component for wrapping text on XAxis
const CustomizedAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const words = payload.value.split(' ');
    return (
        <g transform={`translate(${x},${y})`}>
            {words.map((word: string, index: number) => (
                <text 
                    x={0} 
                    y={0} 
                    dy={10 + (index * 12)} 
                    textAnchor="middle" 
                    fill="#6b7280" 
                    fontSize={10} 
                    fontWeight={500}
                    key={index}
                >
                    {word}
                </text>
            ))}
        </g>
    );
};

export default function App() {
    const [report, setReport] = useState<ReportData>(initialReport);
    const [activeTab, setActiveTab] = useState<TabId>('general');
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [dateInputType, setDateInputType] = useState<'text' | 'date'>('text');
    const [userImage, setUserImage] = useState<string | null>(null);
    
    // Accordion State for Class Tabs
    const [openAccordion, setOpenAccordion] = useState<string | null>('strategies');

    // Archive State
    const [archive, setArchive] = useState<ArchivedReport[]>([]);

    // Reports Stats
    const [statsData, setStatsData] = useState<ChartData[]>([]);
    
    // Google Sheets Data
    const [appData, setAppData] = useState<ListData>(MOCK_DATA);
    const [isLoadingData, setIsLoadingData] = useState(true);
    
    // Connection Status
    const [online, setOnline] = useState(isOnline());
    const [pendingCount, setPendingCount] = useState(0);


    // Load data from LocalStorage on mount
    useEffect(() => {
        console.log('🚀 App Version: 1.1.1 - CORS Fix Applied'); // Version Check
        // Register Service Worker for PWA
        registerServiceWorker();
        
        // Setup connection listeners
        setupConnectionListeners(
            () => {
                setOnline(true);
                syncPendingReports().then(() => {
                    setPendingCount(getPendingReports().length);
                });
            },
            () => setOnline(false)
        );
        
        // Load Google Sheets data
        loadData()
            .then(data => {
                setAppData(data);
                setIsLoadingData(false);
            })
            .catch(error => {
                console.error('Failed to load data:', error);
                setIsLoadingData(false);
            });
        
        // Load saved user data
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
                    // لا نحفظ التاريخ
                }
            }));
        }
        
        const savedReport = localStorage.getItem('teacher_report_data');
        if (savedReport) {
            try {
                const parsed = JSON.parse(savedReport);
                setReport(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Failed to load local data", e);
            }
        }

        const savedArchive = localStorage.getItem('teacher_report_archive');
        if (savedArchive) {
            try {
                setArchive(JSON.parse(savedArchive));
            } catch (e) {
                console.error("Failed to load archive", e);
            }
        }
        
        // Check pending reports count
        setPendingCount(getPendingReports().length);
        
        // Try to sync pending reports
        if (isOnline()) {
            syncPendingReports();
        }
        if (isOnline()) {
            syncPendingReports();
        }

        // Load User Image
        const savedImage = localStorage.getItem('user_profile_image');
        if (savedImage) {
            setUserImage(savedImage);
        }
    }, []);

    // Reset accordion state when switching tabs
    useEffect(() => {
        setOpenAccordion('strategies');
    }, [activeTab]);

    // Save data to LocalStorage whenever report changes
    useEffect(() => {
        localStorage.setItem('teacher_report_data', JSON.stringify(report));
    }, [report]);

    // Save Archive to LocalStorage
    useEffect(() => {
        localStorage.setItem('teacher_report_archive', JSON.stringify(archive));
    }, [archive]);

    // Effect to update subjects and stats when level changes
    useEffect(() => {
        if (report.general.level) {
            const subjects = appData.subjects[report.general.level] || [];
            setAvailableSubjects(subjects);
            
            // Fixed curriculum list for the chart as requested
            const reportSubjects = ["القرآن", "التربية الإيمانية", "الفقه", "اللغة العربية", "أحكام التجويد", "التاريخ"];
            
            // Generate Mock Stats with fixed values for visualization if no real data
            const mockStats = reportSubjects.map(subj => {
                const total = Math.floor(Math.random() * 10) + 15; // 15-25
                const actual = Math.floor(Math.random() * total); // 0 to total
                return {
                    subject: subj,
                    total: total,
                    actual: actual,
                    percentage: Math.round((actual/total) * 100) + '%'
                };
            });
            setStatsData(mockStats);

            // Reset subject selections if they are no longer valid
            const validSubjects = appData.subjects[report.general.level] || [];
            if (report.firstClass.subject && !validSubjects.includes(report.firstClass.subject)) {
                handleClassChange('firstClass', 'subject', '');
                handleClassChange('firstClass', 'lesson', '');
            }
            if (report.secondClass.subject && !validSubjects.includes(report.secondClass.subject)) {
                handleClassChange('secondClass', 'subject', '');
                handleClassChange('secondClass', 'lesson', '');
            }
        } else {
            setAvailableSubjects([]);
            setStatsData([]);
        }

        // Save user data when level changes
        if (report.general.school && report.general.name) {
            saveUserDataToStorage({
                school: report.general.school,
                name: report.general.name,
                level: report.general.level,
                sectionId: report.general.sectionId
            });
        }
    }, [report.general.level, appData]);

    // Generate QR Code data
    useEffect(() => {
        const dataToEncode = `
رقم التسجيل: ${report.general.id}
المدرسة: ${report.general.school}
المعلم: ${report.general.name}
المستوى: ${report.general.level}
القسم: ${report.general.sectionId}
`.trim();
        
        QRCode.toDataURL(dataToEncode, { width: 400, margin: 2 })
            .then(url => setQrDataUrl(url))
            .catch(err => console.error(err));
    }, [report.general]);



    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setUserImage(base64String);
            localStorage.setItem('user_profile_image', base64String);
        };
        reader.readAsDataURL(file);
    };

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

    const saveToArchive = async () => {
        // 1. التحقق من البيانات الأساسية
        if (!report.general.name || !report.general.school || !report.general.level || !report.general.sectionId || !report.general.date) {
            alert("يرجى إكمال جميع البيانات الأساسية (الاسم، المدرسة، المستوى، القسم، التاريخ)");
            setActiveTab('general');
            return;
        }

        // 2. التحقق من الحصة الأولى (إلزامية)
        const c1 = report.firstClass;
        if (!c1.subject || !c1.lesson || c1.strategies.length === 0 || c1.tools.length === 0 || c1.tasks.length === 0) {
             alert("يرجى إكمال جميع بيانات الحصة الأولى (المادة، الدرس، الاستراتيجيات، الوسائل، المهام)");
             setActiveTab('class1');
             return;
        }

        // التحقق من الجنس للحصة الأولى إذا كان مطلوباً
        if (report.general.level.includes('الرابعة') && report.general.level.includes('متوسط') && c1.subject.includes('فقه') && !c1.gender) {
            alert("يرجى اختيار الجنس للحصة الأولى");
            setActiveTab('class1');
            return;
        }

        // 3. التحقق من الحصة الثانية (إذا وجدت)
        if (report.hasSecondClass) {
            const c2 = report.secondClass;
            if (!c2.subject || !c2.lesson || c2.strategies.length === 0 || c2.tools.length === 0 || c2.tasks.length === 0) {
                alert("يرجى إكمال جميع بيانات الحصة الثانية");
                setActiveTab('class2');
                return;
            }
            
            // التحقق من الجنس للحصة الثانية إذا كان مطلوباً
            if (report.general.level.includes('الرابعة') && report.general.level.includes('متوسط') && c2.subject.includes('فقه') && !c2.gender) {
                alert("يرجى اختيار الجنس للحصة الثانية");
                setActiveTab('class2');
                return;
            }
        }

        const newEntry: ArchivedReport = {
            ...report,
            savedAt: Date.now(),
            uid: Date.now().toString()
        };

        // حفظ في localStorage (للأرشيف المحلي)
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
        
        // محاولة الحفظ في Google Sheets
        try {
            if (online) {
                await saveReport(report);
                await saveBackup(report);
                alert("✅ تم حفظ التقرير في Google Sheets بنجاح!");
                setPendingCount(0);
            } else {
                // حفظ معلق للمزامنة لاحقاً
                savePendingReport(report);
                setPendingCount(prev => prev + 1);
                alert("📡 تم حفظ التقرير محلياً. سيتم الإرسال عند عودة الاتصال");
            }
        } catch (error) {
            console.error('Error saving to Google Sheets:', error);
            logError('saveToArchive', error);
            
            // حفظ معلق للمزامنة لاحقاً
            savePendingReport(report);
            setPendingCount(prev => prev + 1);
            alert("⚠️ تم حفظ التقرير محلياً. سيتم المحاولة لاحقاً");
        }
    };

    const loadFromHistory = (uid: string) => {
        if (!uid) return;
        const selectedReport = archive.find(item => item.uid === uid);
        if (selectedReport) {
            const { savedAt, uid, ...reportData } = selectedReport;
            setReport(reportData);
            alert("تم استرجاع البيانات بنجاح");
        }
    };

    // Validation Helpers
    const getGeneralStatus = (): CompletionStatus => {
        const { id, name, school, level, sectionId, date } = report.general;
        const isComplete = !!(id && name && school && level && sectionId && date);
        if (isComplete) return 'complete';
        const isPartial = !!(id || name || school || level || sectionId);
        return isPartial ? 'partial' : 'incomplete';
    };

    const getClassStatus = (classData: ClassData): CompletionStatus => {
        const isComplete = !!(
            classData.subject && 
            classData.lesson && 
            classData.strategies.length > 0 && 
            classData.tools.length > 0 && 
            classData.tasks.length > 0
        );
        if (isComplete) return 'complete';
        const isPartial = !!(classData.subject || classData.lesson || classData.strategies.length > 0 || classData.tools.length > 0 || classData.tasks.length > 0);
        return isPartial ? 'partial' : 'incomplete';
    };

    const getQuranStatus = (): CompletionStatus => {
        if (report.quranReport.length > 5) return 'complete';
        if (report.quranReport.length > 0) return 'partial';
        return 'incomplete';
    };

    const getNotesStatus = (): CompletionStatus => {
        if (report.notes.length > 5) return 'complete';
        if (report.notes.length > 0) return 'partial';
        return 'incomplete';
    };

    const getReportsStatus = (): CompletionStatus => 'complete';

    const tabStatusMap: Record<TabId, CompletionStatus> = {
        general: getGeneralStatus(),
        quran: getQuranStatus(),
        class1: getClassStatus(report.firstClass),
        class2: getClassStatus(report.secondClass),
        notes: getNotesStatus(),
        dashboard: 'complete',
        about: 'complete'
    };

    const getSteps = () => {
        const steps = [
            { id: 'general' as TabId, label: 'عامة', status: tabStatusMap.general },
            { id: 'quran' as TabId, label: 'قرآن', status: tabStatusMap.quran },
            { id: 'class1' as TabId, label: 'حصة 1', status: tabStatusMap.class1 },
        ];

        if (report.hasSecondClass) {
            steps.push({ id: 'class2' as TabId, label: 'حصة 2', status: tabStatusMap.class2 });
        }

        steps.push({ id: 'notes' as TabId, label: 'ملاحظات', status: tabStatusMap.notes });
        steps.push({ id: 'dashboard' as TabId, label: 'إحصائيات', status: tabStatusMap.dashboard });

        return steps;
    };

    const renderGeneralInfo = () => {
        const isGeneralComplete = tabStatusMap.general === 'complete';
        const sortedArchive = [...archive].sort((a, b) => b.savedAt - a.savedAt);

        return (
        <div className="space-y-4 animate-fade-in">
            <div className={`bg-white p-4 rounded-2xl shadow-sm border transition-colors duration-300 ${isGeneralComplete ? 'border-green-200 ring-1 ring-green-100' : 'border-gray-100'}`}>
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
                                onChange={(e) => handleGeneralChange('id', e.target.value)}
                                className="w-full p-2 bg-gray-50 text-gray-900 text-sm rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                                placeholder="10293"
                            />
                        </div>
                        <div className="w-[65%]">
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">اسم المعلم</label>
                            <input
                                type="text"
                                value={report.general.name}
                                onChange={(e) => handleGeneralChange('name', e.target.value)}
                                className="w-full p-2 bg-gray-50 text-gray-900 text-sm rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                                placeholder="الاسم الثلاثي"
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

                    {/* Grade and Section on same row: 70% / 30% */}
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
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">معرف القسم</label>
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

                    {/* Date Section with History Loader */}
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 mt-2">
                        <div className="mb-3 relative">
                            <select
                                onChange={(e) => loadFromHistory(e.target.value)}
                                className="w-full p-2 pl-8 text-xs bg-white text-primary font-bold rounded-lg border border-primary/30 outline-none focus:ring-2 focus:ring-primary/20 text-gray-900"
                                value=""
                            >
                                <option value="" disabled>📂 استرجاع تقرير سابق...</option>
                                {sortedArchive.map(item => (
                                    <option key={item.uid} value={item.uid}>
                                        {formatDateDisplay(item.general.date)} - {item.general.sectionId}
                                    </option>
                                ))}
                            </select>
                            <RefreshCw size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                        </div>

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
        </div>
    );
    }

    const renderQuranInfo = () => (
        <div className="animate-fade-in bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-base font-bold text-primary mb-3 flex items-center gap-2">
                <BookOpen size={18} /> تقرير حصة القرآن
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
        const isComplete = getClassStatus(data) === 'complete';
        const label = classType === 'firstClass' ? 'الحصة الأولى' : 'الحصة الثانية';

        const toggleAccordion = (section: string) => {
            setOpenAccordion(prev => prev === section ? null : section);
        };

        return (
            <div className="space-y-4 animate-fade-in pb-20">
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

                <div className={`bg-white p-4 rounded-2xl shadow-sm border transition-colors duration-300 ${isComplete ? 'border-green-200 ring-1 ring-green-100' : 'border-gray-100'}`}>
                    <h3 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                        <BookOpen size={18} /> {label}
                    </h3>
                    
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 mb-3">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1">المادة</label>
                                <select
                                    value={data.subject}
                                    onChange={(e) => handleClassChange(classType, 'subject', e.target.value)}
                                    className="w-full p-2 bg-gray-50 text-gray-900 text-sm rounded-xl border border-gray-200 appearance-none focus:border-primary outline-none"
                                >
                                    <option value="">اختر المادة...</option>
                                    {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            {/* Gender Selection (Conditional) */}
                            {report.general.level.includes('الرابعة') && report.general.level.includes('متوسط') && data.subject.includes('فقه') && (
                                <div className="animate-fade-in">
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">الجنس (لتحديد الدروس)</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleClassChange(classType, 'gender', 'ذكور')}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                                                data.gender === 'ذكور' 
                                                ? 'bg-blue-50 border-blue-200 text-blue-600 ring-1 ring-blue-100' 
                                                : 'bg-gray-50 border-gray-200 text-gray-500'
                                            }`}
                                        >
                                            ذكور
                                        </button>
                                        <button
                                            onClick={() => handleClassChange(classType, 'gender', 'إناث')}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                                                data.gender === 'إناث' 
                                                ? 'bg-pink-50 border-pink-200 text-pink-600 ring-1 ring-pink-100' 
                                                : 'bg-gray-50 border-gray-200 text-gray-500'
                                            }`}
                                        >
                                            إناث
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1">الدرس</label>
                                <select
                                    value={data.lesson}
                                    onChange={(e) => handleClassChange(classType, 'lesson', e.target.value)}
                                    className="w-full p-2 bg-gray-50 text-gray-900 text-sm rounded-xl border border-gray-200 appearance-none focus:border-primary outline-none"
                                    disabled={!data.subject || (report.general.level.includes('الرابعة') && report.general.level.includes('متوسط') && data.subject.includes('فقه') && !data.gender)}
                                >
                                    <option value="">
                                        {report.general.level.includes('الرابعة') && report.general.level.includes('متوسط') && data.subject.includes('فقه') && !data.gender ? "يرجى اختيار الجنس أولاً..." : "اختر الدرس..."}
                                    </option>
                                    {getLessonsForSubject(data.subject, report.general.level, data.gender).map(l => (
                                        <option key={l} value={l}>{l}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100 my-2"></div>

                        <CheckboxGrid
                            label="استراتيجيات التدريس"
                            options={appData.strategies}
                            selected={data.strategies}
                            onChange={(vals) => handleClassChange(classType, 'strategies', vals)}
                            isOpen={openAccordion === 'strategies'}
                            onToggle={() => toggleAccordion('strategies')}
                        />

                        <CheckboxGrid
                            label="الوسائل التعليمية"
                            options={appData.tools}
                            selected={data.tools}
                            onChange={(vals) => handleClassChange(classType, 'tools', vals)}
                            isOpen={openAccordion === 'tools'}
                            onToggle={() => toggleAccordion('tools')}
                        />

                        <CheckboxGrid
                            label="المهام المنجزة"
                            options={appData.tasks}
                            selected={data.tasks}
                            onChange={(vals) => handleClassChange(classType, 'tasks', vals)}
                            isOpen={openAccordion === 'tasks'}
                            onToggle={() => toggleAccordion('tasks')}
                        />
                    </div>
                </div>
            </div>
        );
    };

    const renderNotes = () => (
        <div className="space-y-4 animate-fade-in">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-base font-bold text-primary mb-3 flex items-center gap-2">
                    <MessageSquare size={18} /> ملاحظات عامة
                </h3>
                <textarea
                    value={report.notes}
                    onChange={(e) => setReport(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full h-32 p-3 bg-gray-50 text-gray-900 text-sm rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none leading-relaxed"
                    placeholder="أي ملاحظات إضافية..."
                ></textarea>
            </div>

            <button 
                onClick={saveToArchive}
                className="w-full py-3 bg-secondary text-white rounded-xl shadow-lg font-bold flex items-center justify-center gap-2 active:scale-95 transition text-sm"
            >
                <Save size={18} />
                حفظ في الأرشيف
            </button>
        </div>
    );

    const renderReports = () => {
        if (!report.general.level) {
            return (
                <div className="animate-fade-in flex flex-col items-center justify-center py-20 text-center text-gray-400">
                    <AlertCircle size={48} className="mb-4 opacity-50" />
                    <p>يرجى اختيار المستوى الدراسي أولاً لعرض التقارير.</p>
                </div>
            );
        }

        return (
            <div className="animate-fade-in space-y-4 pb-20">
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 text-primary mb-1">
                            <TrendingUp size={16} />
                            <span className="text-[10px] font-bold">معدل الإنجاز</span>
                        </div>
                        <div className="text-xl font-bold text-gray-800">78%</div>
                        <div className="text-[9px] text-green-500">+12% عن الأسبوع الماضي</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 text-secondary mb-1">
                            <Award size={16} />
                            <span className="text-[10px] font-bold">إجمالي الدروس</span>
                        </div>
                        <div className="text-xl font-bold text-gray-800">
                            {statsData.reduce((acc, curr) => acc + curr.actual, 0)}
                        </div>
                        <div className="text-[9px] text-gray-400">درس تم تنفيذه</div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-primary" />
                        تقدم المنهج الدراسي
                    </h3>
                    
                    <div className="h-[300px] w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statsData} margin={{ top: 20, right: 10, left: -20, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                {/* Reversed XAxis ensures Quran is on the Right */}
                                <XAxis 
                                    dataKey="subject" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={<CustomizedAxisTick />}
                                    interval={0}
                                    xAxisId="0"
                                    reversed
                                    allowDuplicatedCategory={false}
                                />
                                <XAxis 
                                    dataKey="subject" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    hide
                                    xAxisId="1"
                                    reversed
                                    allowDuplicatedCategory={false}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#9ca3af', fontSize: 10 }} 
                                />
                                <Tooltip 
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                />
                                <Bar 
                                    dataKey="total" 
                                    fill="#f3f4f6" 
                                    radius={[6, 6, 6, 6]} 
                                    barSize={24}
                                    xAxisId="0"
                                />
                                <Bar 
                                    dataKey="actual" 
                                    fill="#667eea" 
                                    radius={[6, 6, 6, 6]} 
                                    barSize={24}
                                    xAxisId="1"
                                >
                                    <LabelList dataKey="percentage" position="top" fill="#667eea" fontSize={9} fontWeight="bold" />
                                    {statsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.actual >= entry.total ? '#10b981' : '#667eea'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    
                    <div className="flex justify-center gap-6 mt-2 text-[10px] text-gray-500">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
                            <span>المخطط (المفترض)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                            <span>المنفذ (الفعلي)</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Connection Status Indicator */}
            {!online && (
                <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 z-50 flex items-center justify-center gap-2">
                    <WifiOff size={20} />
                    <span>لا يوجد اتصال بالإنترنت - يتم العمل Offline</span>
                    {pendingCount > 0 && (
                        <span className="bg-white text-red-500 px-2 py-1 rounded-full text-xs font-bold">
                            {pendingCount} تقارير معلقة
                        </span>
                    )}
                </div>
            )}

            {/* Loading Indicator */}
            {isLoadingData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl">
                        <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            <p className="text-lg font-bold text-gray-700">جاري تحميل البيانات...</p>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="min-h-screen pb-[90px] bg-[#f3f4f6]">
            {/* Integrated Header and Stepper Wrapper */}
            <div className="bg-gradient-to-bl from-[#667eea] to-[#764ba2] rounded-b-[30px] shadow-lg mb-4">
                <Header 
                    teacherName={report.general.name} 
                    userImage={userImage}
                    onQrClick={() => setIsQrModalOpen(true)}
                    onImageUpload={handleImageUpload}
                />
                <ProgressStepper 
                    steps={getSteps()} 
                    activeTab={activeTab} 
                    onStepClick={setActiveTab} 
                />
            </div>

            <main className="px-4 max-w-md mx-auto">
                {activeTab === 'general' && renderGeneralInfo()}
                {activeTab === 'quran' && renderQuranInfo()}
                {activeTab === 'class1' && renderClassInfo('firstClass')}
                {activeTab === 'class2' && renderClassInfo('secondClass')}
                {activeTab === 'notes' && renderNotes()}
                {activeTab === 'dashboard' && <Dashboard teacherName={report.general.name} />}
                {activeTab === 'about' && <AboutProject />}
            </main>

            <BottomNav 
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
                hasSecondClass={report.hasSecondClass}
                tabStatus={tabStatusMap}
            />

            {isQrModalOpen && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setIsQrModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl transform scale-100 transition-transform"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">إثبات الحضور</h3>
                            <p className="text-gray-500 text-xs mt-1">امسح الرمز لتسجيل بيانات الحصة</p>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-center mb-6">
                            {qrDataUrl ? (
                                <img src={qrDataUrl} alt="QR Code" className="w-64 h-64 object-contain mix-blend-multiply" />
                            ) : (
                                <div className="w-64 h-64 flex items-center justify-center text-gray-300">
                                    <RefreshCw className="animate-spin" />
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => setIsQrModalOpen(false)}
                            className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
                        >
                            إغلاق
                        </button>
                    </div>
                </div>
            )}
        </div>
    </>
    );
}
