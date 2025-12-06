import { useState, useEffect } from 'react';
import { readSheetRange } from './services/googleSheetsService';
import { ChartData } from './types';

interface DashboardProps {
  stats: ChartData[];
}

export function Dashboard({ stats }: DashboardProps) {
  const [syncing, setSyncing] = useState(false);

  // Calculate overall stats from the passed data
  const totalLessons = stats.reduce((acc, curr) => acc + curr.total, 0);
  const completedLessons = stats.reduce((acc, curr) => acc + curr.actual, 0);
  const overallPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  
  // Mock overdue calculation
  const totalOverdue = 0; // TODO: Implement real overdue calculation in StatisticsEngine 

  async function syncReportsFromSheets() {
      // ... (Sync logic can remain or be moved to a hook later)
      alert('سيتم تفعيل المزامنة قريباً بشكل كامل');
  }

  if (!stats || stats.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-600">جاري تحميل الإحصائيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 animate-fade-in">
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
            <span className="text-4xl font-bold">{overallPercentage}%</span>
            <span className="text-sm opacity-90">{completedLessons}/{totalLessons} دروس</span>
          </div>
          <div className="bg-white/20 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-white h-full rounded-full transition-all duration-500"
              style={{ width: `${overallPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* الدروس المتأخرة */}
        {totalOverdue > 0 && (
          <div className="bg-white/10 rounded-lg p-3 flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <span>الدروس المتأخرة: <strong>{totalOverdue}</strong> درس</span>
          </div>
        )}
      </div>

      {/* الإحصائيات حسب المادة */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="text-xl">📚</span>
          حسب المادة
        </h3>
        
        {stats.map((subjectStat, index) => {
            const percentage = parseInt(subjectStat.percentage.replace('%', ''));
            return (
          <div key={index} className="bg-white rounded-xl p-4 shadow border border-gray-100">
            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-gray-800">{subjectStat.subject}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl font-bold" style={{
                  color: percentage >= 75 ? '#10b981' : 
                         percentage >= 50 ? '#f59e0b' : '#ef4444'
                }}>
                  {subjectStat.percentage}
                </span>
                <span className="text-sm text-gray-600">
                  {subjectStat.actual}/{subjectStat.total} دروس
                </span>
              </div>
            </div>
            
            {/* شريط التقدم */}
            <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: subjectStat.percentage,
                  backgroundColor: percentage >= 75 ? '#10b981' : 
                                 percentage >= 50 ? '#f59e0b' : '#ef4444'
                }}
              ></div>
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}
