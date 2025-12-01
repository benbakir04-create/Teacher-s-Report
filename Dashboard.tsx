import { useState, useEffect } from 'react';
import { readLessonsWithMonths, readSheetRange } from './services/googleSheetsService';
import { calculateTeacherStats, getCurrentMonth } from './services/statsService';
import { TeacherStats } from './types';

interface DashboardProps {
  teacherName: string;
}

export function Dashboard({ teacherName }: DashboardProps) {
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  async function loadStats() {
    try {
      setLoading(true);
      setError('');

      // قراءة الدروس مع الأشهر المفترضة
      const allLessons = await readLessonsWithMonths();
      
      // قراءة تقارير المعلم
      const allReports = await readSheetRange('التقارير!A2:Z');
      const teacherReports = allReports.filter(row => row[2] === teacherName); // العمود الثالث هو اسم المعلم

      // حساب الإحصائيات
      const currentMonth = getCurrentMonth();
      const calculatedStats = calculateTeacherStats(allLessons, teacherReports, currentMonth);
      
      setStats(calculatedStats);
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('فشل تحميل الإحصائيات');
    } finally {
      setLoading(false);
    }
  }

  async function syncReportsFromSheets() {
    if (!teacherName) {
      alert('⚠️ يرجى إدخال اسمك أولاً في البيانات الأساسية');
      return;
    }

    try {
      setSyncing(true);
      
      // قراءة كل التقارير من الشيت
      const allReports = await readSheetRange('التقارير!A2:Z');
      
      // تصفية تقارير المعلم فقط
      const myReports = allReports.filter(row => row[2] === teacherName);
      
      if (myReports.length === 0) {
        alert('📭 لا توجد تقارير محفوظة باسمك في Google Sheets');
        return;
      }

      // حفظها في localStorage
      const existingArchive = JSON.parse(localStorage.getItem('archive') || '[]');
      
      // تحويل تقارير الشيت لنفس تنسيق Archive
      const syncedReports = myReports.map((row, index) => ({
        uid: `synced-${Date.now()}-${index}`,
        savedAt: new Date(row[0]).getTime() || Date.now(),
        general: {
          id: row[1] || '',
          name: row[2] || '',
          school: row[3] || '',
          level: row[4] || '',
          sectionId: row[5] || '',
          date: row[6] || ''
        },
        quranReport: row[7] || '',
        firstClass: {
          subject: row[8] || '',
          gender: row[9] || '',
          lesson: row[10] || '',
          strategies: (row[11] || '').split('، ').filter(Boolean),
          tools: (row[12] || '').split('، ').filter(Boolean),
          tasks: (row[13] || '').split('، ').filter(Boolean)
        },
        hasSecondClass: row[14] === 'نعم',
        secondClass: {
          subject: row[15] || '',
          gender: row[16] || '',
          lesson: row[17] || '',
          strategies: (row[18] || '').split('، ').filter(Boolean),
          tools: (row[19] || '').split('، ').filter(Boolean),
          tasks: (row[20] || '').split('، ').filter(Boolean)
        },
        notes: row[21] || ''
      }));

      // دمج مع الموجود محلياً (تجنب التكرار)
      const mergedArchive = [...existingArchive];
      syncedReports.forEach(syncedReport => {
        const exists = mergedArchive.some(r => 
          r.general.date === syncedReport.general.date && 
          r.general.name === syncedReport.general.name
        );
        if (!exists) {
          mergedArchive.push(syncedReport);
        }
      });

      localStorage.setItem('archive', JSON.stringify(mergedArchive));
      
      // إعادة تحميل الإحصائيات
      await loadStats();
      
      alert(`✅ تم تحميل ${myReports.length} تقرير بنجاح من Google Sheets!`);
    } catch (err) {
      console.error('Error syncing reports:', err);
      alert('❌ فشل تحميل التقارير من Google Sheets');
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    if (teacherName) {
      loadStats();
    }
  }, [teacherName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الإحصائيات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 m-4">
        <p className="text-red-600 text-center">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="p-4 space-y-4">
      {/* زر المزامنة */}
      <button
        onClick={syncReportsFromSheets}
        disabled={syncing}
        className="w-full py-3 bg-blue-500 text-white rounded-xl shadow-lg font-bold flex items-center justify-center gap-2 active:scale-95 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {syncing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            جاري المزامنة...
          </>
        ) : (
          <>
            <span className="text-lg">🔄</span>
            مزامنة تقاريري من الشيت
          </>
        )}
      </button>

      {/* النظرة العامة */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          نسبة الإنجاز الإجمالية
        </h2>
        
        {/* شريط التقدم الكبير */}
        <div className="mb-4">
          <div className="flex justify-between items-end mb-2">
            <span className="text-4xl font-bold">{stats.overallPercentage}%</span>
            <span className="text-sm opacity-90">{stats.totalCompleted}/{stats.totalExpected} دروس</span>
          </div>
          <div className="bg-white/20 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-white h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.overallPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* الدروس المتأخرة */}
        {stats.totalOverdue > 0 && (
          <div className="bg-white/10 rounded-lg p-3 flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <span>الدروس المتأخرة: <strong>{stats.totalOverdue}</strong> درس</span>
          </div>
        )}
      </div>

      {/* الإحصائيات حسب المادة */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="text-xl">📚</span>
          حسب المادة
        </h3>
        
        {stats.subjectProgress.map((subjectStat, index) => (
          <div key={index} className="bg-white rounded-xl p-4 shadow border border-gray-100">
            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-gray-800">{subjectStat.subject}</span>
                <span className="text-sm text-gray-500">{subjectStat.level}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl font-bold" style={{
                  color: subjectStat.percentage >= 75 ? '#10b981' : 
                         subjectStat.percentage >= 50 ? '#f59e0b' : '#ef4444'
                }}>
                  {subjectStat.percentage}%
                </span>
                <span className="text-sm text-gray-600">
                  {subjectStat.completed}/{subjectStat.total} دروس
                </span>
              </div>
            </div>
            
            {/* شريط التقدم */}
            <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${subjectStat.percentage}%`,
                  backgroundColor: subjectStat.percentage >= 75 ? '#10b981' : 
                                 subjectStat.percentage >= 50 ? '#f59e0b' : '#ef4444'
                }}
              ></div>
            </div>
            
            {/* الدروس المتأخرة للمادة */}
            {subjectStat.overdue > 0 && (
              <div className="mt-2 text-sm text-orange-600 flex items-center gap-1">
                <span>⚠️</span>
                <span>متأخر: {subjectStat.overdue} درس</span>
              </div>
            )}
          </div>
        ))}

        {stats.subjectProgress.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>لا توجد تقارير محفوظة بعد</p>
            <p className="text-sm">ابدأ بكتابة تقاريرك لترى إحصائياتك هنا!</p>
          </div>
        )}
      </div>
    </div>
  );
}
