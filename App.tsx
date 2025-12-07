import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
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
import { DailyReportPage } from './pages/DailyReportPage';

import { MessageSquare, WifiOff, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode';
import { Toaster } from 'react-hot-toast';

// Custom Hooks
import { useAuth } from './hooks/useAuth';
import { useReportForm } from './hooks/useReportForm';
import { useOfflineSync } from './hooks/useOfflineSync';
import { useAppData } from './hooks/useAppData';

export default function App() {
    console.log('🚀 App Rendering...');
    // 1. Auth Hook
    const { 
        authSession, 
        isAuthenticating, 
        showEmailLinkModal, 
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
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [currentMenuPage, setCurrentMenuPage] = useState<MenuPage>(null);
    const [activeSubTab, setActiveSubTab] = useState<'form' | 'list'>('form');

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
            {/* Header */}
            <div className="bg-gradient-to-bl from-[#667eea] to-[#764ba2] rounded-b-[30px] shadow-lg mb-4">
                <Header 
                    teacherName={report.general.name} 
                    userImage={userImage}
                    onQrClick={() => setIsQrModalOpen(true)}
                    onAvatarClick={() => setShowUserMenu(true)}
                />
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
                        {activeTab === 'dailyReport' && (
                            <DailyReportPage 
                                report={report}
                                setReport={setReport}
                                appData={appData}
                                availableSubjects={availableSubjects}
                                loadFromHistory={loadFromHistory}
                                saveToArchive={saveToArchive}
                                online={online}
                                setPendingCount={setPendingCount}
                                dateInputType={dateInputType}
                                setDateInputType={setDateInputType}
                                handleGeneralChange={handleGeneralChange}
                                handleClassChange={handleClassChange}
                                activeSubTab={activeSubTab}
                                setActiveSubTab={setActiveSubTab}
                            />
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
                    // If switching to DailyReport, default to List view (optional, or stick to current)
                }}
                onNewReport={() => {
                    setCurrentMenuPage(null);
                    
                    // Logic for Smart FAB
                    if (activeTab === 'dailyReport') {
                        // Already in Daily Report
                        if (activeSubTab === 'list') {
                            // Switch to Form
                            setActiveSubTab('form');
                        } else {
                            // Already in Form - Check for unsaved changes
                            const isDirty = report.quranReport || report.firstClass.subject || report.notes;
                            if (isDirty) {
                                if (confirm("هل تريد حفظ البيانات كمسودة قبل فتح تقرير جديد؟")) {
                                    // User wants to save - logic is handled by UI save button mostly, 
                                    // but here we just respect their choice to STAY or we could force save.
                                    // For simplicity per spec: "shows confirmation... if unsaved"
                                    // If they say OK (Save/Stay), we do nothing (let them save).
                                    // If they Cancel (Discard), we reset.
                                } else {
                                    // Discard and Reset
                                    setReport(prev => ({
                                        ...prev,
                                        general: { ...prev.general, date: new Date().toISOString().split('T')[0] },
                                        quranReport: '',
                                        firstClass: { subject: '', lesson: '', strategies: [], tools: [], tasks: [], gender: '' },
                                        secondClass: { subject: '', lesson: '', strategies: [], tools: [], tasks: [], gender: '' },
                                        hasSecondClass: false,
                                        notes: ''
                                    }));
                                    toast.success("تم فتح تقرير جديد");
                                }
                            }
                            // If not dirty, do nothing (already ready)
                        }
                    } else {
                        // Switch from other tab
                        setActiveTab('dailyReport');
                        setActiveSubTab('form');
                    }
                }}
                isFormComplete={getTabStatus('dailyReport') === 'complete'}
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
