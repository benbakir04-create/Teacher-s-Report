import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { CheckboxGrid } from './components/CheckboxGrid';
import { ProgressStepper } from './components/ProgressStepper';
import { AboutProject } from './components/AboutProject';
import { Dashboard } from './Dashboard';
import { LoginScreen } from './components/LoginScreen';
import { EmailLinkModal } from './components/EmailLinkModal';
import { AccountModal } from './components/AccountModal';
import { UserMenu } from './components/UserMenu';
import { TabId, MenuPage } from './types';

// Page Components
import { MyAccountPage } from './pages/MyAccountPage';
import { GeneralDataPage } from './pages/GeneralDataPage';
import { MyClassesPage } from './pages/MyClassesPage';
import { SystemSettingsPage } from './pages/SystemSettingsPage';
import { ChevronDown, User, Building, BookOpen, MessageSquare, School, Save, RefreshCw, WifiOff } from 'lucide-react';
import QRCode from 'qrcode';
import { Toaster } from 'react-hot-toast';

// Custom Hooks
import { useAuth } from './hooks/useAuth';
import { useReportForm } from './hooks/useReportForm';
import { useOfflineSync } from './hooks/useOfflineSync';
import { useAppData } from './hooks/useAppData';
import { getLessonsForSubject } from './dataManager';

// Helper to format date as YYYY/MM/DD
const formatDateDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}/${month}/${day}`;
};

export default function App() {
    console.log('🚀 App Rendering...');
    // 1. Auth Hook
    const { 
        authSession, 
        setAuthSession, 
        isAuthenticating, 
        showEmailLinkModal, 
        setShowEmailLinkModal,
        showAccountModal, 
        setShowAccountModal, 
        handleLogin, 
        handleLogout, 
        handleEmailLinkSuccess, 
        handleEmailLinkLater 
    } = useAuth();

    // 2. Report Form Hook
    const { 
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
        getTabStatus 
    } = useReportForm();

    // 3. Offline Sync Hook
    const { 
        online, 
        pendingCount, 
        setPendingCount, 
        handleClearCache,
        updateAvailable,
        handleUpdateApp
    } = useOfflineSync();

    // 4. App Data Hook
    const { 
        appData, 
        isLoadingData, 
        availableSubjects, 
        statsData 
    } = useAppData(report, handleClassChange);

    // Local State for UI
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [userImage, setUserImage] = useState<string | null>(null);
    const [openAccordion, setOpenAccordion] = useState<string | null>('strategies');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [currentMenuPage, setCurrentMenuPage] = useState<MenuPage>(null);

    // Sync Auth with Report
    useEffect(() => {
        if (authSession) {
            setReport(prev => ({
                ...prev,
                general: {
                    ...prev.general,
                    id: authSession.teacher.registrationId,
                    name: authSession.teacher.name,
                    school: authSession.teacher.school,
                    level: authSession.teacher.level,
                    sectionId: authSession.teacher.section
                }
            }));
        }
    }, [authSession]);

    // Reset accordion state when switching tabs
    useEffect(() => {
        setOpenAccordion('strategies');
    }, [activeTab]);

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

    // Load User Image
    useEffect(() => {
        const savedImage = localStorage.getItem('user_profile_image');
        if (savedImage) {
            setUserImage(savedImage);
        }
    }, []);

    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setUserImage(base64String);
            localStorage.setItem('user_profile_image', base64String);
        };
        reader.readAsDataURL(file);
    };

    const getSteps = () => {
        return [
            { id: 'general' as TabId, label: 'البيانات', status: getTabStatus('general') },
            { id: 'dailyReport' as TabId, label: 'السجل', status: getTabStatus('dailyReport') },
            { id: 'notes' as TabId, label: 'ملاحظات', status: getTabStatus('notes') },
            { id: 'statistics' as TabId, label: 'إحصاءات', status: 'complete' as const },
        ];
    };

    const renderGeneralInfo = () => {
        const isGeneralComplete = getTabStatus('general') === 'complete';
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
        // For now, we keep the function but it will be rendered inside dailyReport tab
        const isComplete = data.subject !== '' && data.lesson !== '' && data.strategies.length > 0;
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
                            <div className="bg-gradient-to-r from-blue-50 to-pink-50 p-3 rounded-xl border border-gray-100 animate-fade-in">
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

    // Show loading while checking authentication
    if (isAuthenticating) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-lg font-bold">جاري التحميل...</p>
                </div>
            </div>
        );
    }
    
    // Show login screen if not authenticated
    if (!authSession) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    console.log('✅ App Rendering Main Content');
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
            
            {/* New Version Update Banner */}
            {updateAvailable && (
                <div 
                    onClick={handleUpdateApp}
                    className="fixed top-0 left-0 right-0 bg-indigo-600 text-white text-center py-3 z-[60] flex items-center justify-center gap-2 shadow-xl cursor-pointer hover:bg-indigo-700 transition animate-bounce-in"
                >
                    <RefreshCw size={20} className="animate-spin-slow" />
                    <span className="font-bold text-sm">تحديث جديد متوفر! اضغط هنا للتحديث فوراً 🚀</span>
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

            {/* Toast Notifications */}
            <Toaster 
                position="top-center"
                reverseOrder={false}
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#fff',
                        color: '#333',
                        padding: '16px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '600',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    },
                    success: {
                        iconTheme: {
                            primary: '#10b981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />

            
            <div className="min-h-screen pb-[90px] bg-[#f3f4f6]">
            {/* Integrated Header and Stepper Wrapper */}
            <div className="bg-gradient-to-bl from-[#667eea] to-[#764ba2] rounded-b-[30px] shadow-lg mb-4">
                <Header 
                    teacherName={report.general.name} 
                    userImage={userImage}
                    onQrClick={() => setIsQrModalOpen(true)}
                    onAvatarClick={() => setShowUserMenu(true)}
                />
                
                {/* Show stepper only when no menu page is open */}
                {!currentMenuPage && (
                    <div className="px-4 pb-6">
                        <ProgressStepper 
                            steps={getSteps()} 
                            currentStep={activeTab} 
                            onStepClick={setActiveTab} 
                        />
                    </div>
                )}
            </div>
            
            {/* User Menu Sidebar */}
            <UserMenu 
                isOpen={showUserMenu}
                onClose={() => setShowUserMenu(false)}
                onNavigate={(page) => setCurrentMenuPage(page)}
            />

            <div className="max-w-md mx-auto px-4">
                {/* Menu Pages (from avatar click) */}
                {currentMenuPage === 'myAccount' && <MyAccountPage />}
                {currentMenuPage === 'generalData' && <GeneralDataPage />}
                {currentMenuPage === 'myClasses' && <MyClassesPage />}
                {currentMenuPage === 'systemSettings' && <SystemSettingsPage />}
                
                {/* Tab Content (only show if no menu page is open) */}
                {!currentMenuPage && (
                    <>
                        {activeTab === 'general' && renderGeneralInfo()}
                        
                        {activeTab === 'dailyReport' && (
                            <div className="space-y-4 animate-fade-in">
                                {/* Quran Section */}
                                {renderQuranInfo()}
                                
                                {/* Class 1 */}
                                {renderClassInfo('firstClass')}
                                
                                {/* Class 2 (if enabled) */}
                                {report.hasSecondClass && renderClassInfo('secondClass')}
                            </div>
                        )}
                        
                        {activeTab === 'notes' && (
                            <div className="animate-fade-in bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-base font-bold text-primary mb-3 flex items-center gap-2">
                                    <MessageSquare size={18} /> ملاحظات إضافية
                                </h3>
                                <textarea
                                    value={report.notes}
                                    onChange={(e) => setReport(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full h-32 p-3 bg-gray-50 text-gray-900 text-sm rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none transition leading-relaxed"
                                    placeholder="اكتب أي ملاحظات إضافية هنا..."
                                ></textarea>
                            </div>
                        )}

                        {activeTab === 'statistics' && <Dashboard stats={statsData} />}
                    </>
                )}
            </div>

            {/* Bottom Navigation */}
            <BottomNav 
                activeTab={activeTab} 
                onTabChange={(tab) => {
                    setCurrentMenuPage(null); // Close any menu page
                    setActiveTab(tab);
                }}
                onSave={() => saveToArchive(online, setPendingCount)}
                isFormComplete={getTabStatus('general') === 'complete' && getTabStatus('dailyReport') === 'complete'}
                tabStatus={getTabStatus}
            />

            {/* QR Code Modal */}
            {isQrModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setIsQrModalOpen(false)}>
                    <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center animate-scale-in" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-primary mb-4">رمز QR الخاص بك</h3>
                        <div className="bg-white p-2 rounded-xl border-2 border-dashed border-gray-200 mb-4">
                            <img src={qrDataUrl} alt="QR Code" className="w-full h-auto rounded-lg" />
                        </div>
                        <p className="text-sm text-gray-500 mb-6">امسح الرمز لمشاركة بياناتك</p>
                        <button 
                            onClick={() => setIsQrModalOpen(false)}
                            className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
                        >
                            إغلاق
                        </button>
                    </div>
                </div>
            )}
            
            {/* Email Link Modal */}
            {showEmailLinkModal && authSession && (
                <EmailLinkModal 
                    onLink={handleEmailLinkSuccess}
                    onLater={handleEmailLinkLater}
                    canDismiss={!authSession.teacher.emailRequired || authSession.daysSinceFirstUse < 14}
                />
            )}

            {/* Account Modal */}
            <AccountModal
                isOpen={showAccountModal}
                onClose={() => setShowAccountModal(false)}
                teacher={authSession?.teacher || null}
                userImage={userImage}
                googlePhotoUrl={authSession?.teacher?.email ? `https://ui-avatars.com/api/?name=${encodeURIComponent(authSession.teacher.name)}&background=667eea&color=fff&size=128` : null}
                onLogout={handleLogout}
                onClearCache={handleClearCache}
                onImageUpload={handleImageUpload}
            />
        </div>
    </>
    );
}
