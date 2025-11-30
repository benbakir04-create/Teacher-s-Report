/**
 * App.tsx - Updated Functions
 * 
 * استبدل الدوال المقابلة في App.tsx بهذه الإصدارات المحدثة
 */

// ========== استبدل useEffect الأول (Load data from LocalStorage) بهذا: ==========

useEffect(() => {
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
}, []);

// ========== أضف dependency لـ appData في useEffect (Effect to update subjects) ==========

// استبدل السطر:
}, [report.general.level]);

// بهذا:
}, [report.general.level, appData]);

// ========== أضف حفظ بيانات المستخدم في نفس useEffect ==========

// أضف قبل نهاية useEffect للمستوى:
// Save user data when level changes
if (report.general.school && report.general.name) {
    saveUserDataToStorage({
        school: report.general.school,
        name: report.general.name,
        level: report.general.level,
        sectionId: report.general.sectionId
    });
}

// ========== استبدل دالة saveToArchive بهذه: ==========

const saveToArchive = async () => {
    if (!report.general.name || !report.general.school) {
        alert("يرجى إكمال البيانات الأساسية قبل الحفظ");
        setActiveTab('general');
        return;
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

// ========== أضف about status في tabStatusMap ==========

// استبدل:
const tabStatusMap: Record<TabId, CompletionStatus> = {
    general: getGeneralStatus(),
    quran: getQuranStatus(),
    class1: getClassStatus(report.firstClass),
    class2: getClassStatus(report.secondClass),
    notes: getNotesStatus(),
    reports: getReportsStatus()
};

// بهذا:
const tabStatusMap: Record<TabId, CompletionStatus> = {
    general: getGeneralStatus(),
    quran: getQuranStatus(),
    class1: getClassStatus(report.firstClass),
    class2: getClassStatus(report.secondClass),
    notes: getNotesStatus(),
    reports: getReportsStatus(),
    about: 'complete'
};

// ========== استبدل MOCK_DATA بـ appData في renderGeneralInfo ==========

// ابحث عن:
{MOCK_DATA.schools.map(s => <option key={s} value={s}>{s}</option>)}
{MOCK_DATA.levels.map(l => <option key={l} value={l}>{l}</option>)}
{MOCK_DATA.sections.map(s => <option key={s} value={s}>{s}</option>)}

// استبدلها بـ:
{appData.schools.map(s => <option key={s} value={s}>{s}</option>)}
{appData.levels.map(l => <option key={l} value={l}>{l}</option>)}
{appData.sections.map(s => <option key={s} value={s}>{s}</option>)}

// ========== أضف Connection Indicator في بداية return ==========

// في بداية return قبل <div className="min-h-screen...">
// أضف:

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
