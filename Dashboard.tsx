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
  const [error, setError] = useState('');

  useEffect(() => {
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
