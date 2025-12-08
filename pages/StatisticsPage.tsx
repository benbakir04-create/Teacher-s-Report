import React from 'react';
import { 
    FileText, CheckCircle, TrendingUp, Users, Download, 
    RefreshCw, Filter, AlertTriangle, Calendar as CalendarIcon, ChevronDown
} from 'lucide-react';
import { useAnalytics, DateRangeType } from '../hooks/useAnalytics';
import { StatsCard } from '../components/analytics/StatsCard';
import { DailyActivityChart, RatingPieChart } from '../components/analytics/Charts';
import { generateTeacherReport } from '../services/pdfGenerator';
import toast from 'react-hot-toast';

export function StatisticsPage() {
    const { 
        metrics, 
        loading, 
        dateRange, 
        updateDateRange, 
        filters,
        setFilters
    } = useAnalytics();

    const handleExport = () => {
        try {
            if (metrics.totalReports === 0) {
                toast.error("لا توجد بيانات للتصدير");
                return;
            }
            generateTeacherReport(metrics.recentReports, metrics);
            toast.success("تم تحميل التقرير بنجاح");
        } catch (error) {
            console.error(error);
            toast.error("حدث خطأ أثناء تصدير التقرير");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                <p className="text-gray-500">جاري تحليل البيانات...</p>
            </div>
        );
    }

    // Pie Data
    const pieData = [
        { name: 'ممتاز', value: metrics.ratingDistribution.excellent || 0, color: '#10B981' }, 
        { name: 'جيد', value: metrics.ratingDistribution.good || 0, color: '#3B82F6' },
        { name: 'متوسط', value: metrics.ratingDistribution.average || 0, color: '#F59E0B' },
        { name: 'يحتاج تحسين', value: metrics.ratingDistribution.needsImprovement || 0, color: '#EF4444' },
    ];

    return (
        <div className="p-4 space-y-6 pb-24 animate-fade-in text-right" dir="rtl">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">لوحة الإحصاءات المتقدمة</h1>
                    <p className="text-gray-500 text-xs mt-1">
                        تقرير الفترة: {dateRange.from} إلى {dateRange.to}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    {/* Date Range Selector */}
                    <div className="relative group">
                        <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-100 transition">
                            <CalendarIcon size={16} className="text-gray-500" />
                            <span>
                                {dateRange.type === 'week' ? 'آخر 7 أيام' : 
                                 dateRange.type === 'month' ? 'آخر 30 يوم' : 
                                 dateRange.type === 'all' ? 'كل الفترات' : 'مخصص'}
                            </span>
                            <ChevronDown size={14} className="text-gray-400" />
                        </button>
                        {/* Dropdown Menu */}
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 hidden group-hover:block z-10">
                            <button onClick={() => updateDateRange('week')} className="w-full text-right px-4 py-2 hover:bg-gray-50 text-sm">آخر 7 أيام</button>
                            <button onClick={() => updateDateRange('month')} className="w-full text-right px-4 py-2 hover:bg-gray-50 text-sm">آخر 30 يوم</button>
                            <button onClick={() => updateDateRange('all')} className="w-full text-right px-4 py-2 hover:bg-gray-50 text-sm">كل الفترات</button>
                        </div>
                    </div>

                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition text-sm"
                    >
                        <Download size={16} />
                        <span className="hidden sm:inline">تصدير PDF</span>
                    </button>
                </div>
            </div>

            {/* Scorecards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard 
                    title="التقارير المكتملة" 
                    value={metrics.totalReports} 
                    icon={FileText} 
                    color="blue"
                    description="في الفترة المحددة"
                />
                <StatsCard 
                    title="نسبة الالتزام" 
                    value={`${metrics.commitmentRate}%`} 
                    icon={CheckCircle} 
                    color={metrics.commitmentRate >= 80 ? 'green' : metrics.commitmentRate >= 50 ? 'orange' : 'orange'} // Red intentionally avoided for now to be less harsh
                    description="مقابل التوقعات"
                    trend={{ value: 0, isPositive: true }} // Placeholder trend
                />
                <StatsCard 
                    title="المدارس النشطة" 
                    value={metrics.activeSchools} 
                    icon={BuildingIconWrapper} 
                    color="purple"
                    description="مدارس مسجلة"
                />
                <StatsCard 
                    title="جودة التقارير" 
                    value={metrics.avgRating} 
                    icon={TrendingUp} 
                    color="orange"
                    description="من 5.0"
                />
            </div>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Activity Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800">النشاط اليومي (Trend)</h3>
                    </div>
                    <DailyActivityChart data={metrics.dailyActivity} />
                </div>

                {/* Distribution Pie Chart */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-6">توزيع الجودة</h3>
                    <RatingPieChart data={pieData} />
                </div>
            </div>

            {/* Recent Reports Table Preview */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800">أحدث التقارير</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="p-4">التاريخ</th>
                                <th className="p-4">المدرسة</th>
                                <th className="p-4">الصف</th>
                                <th className="p-4">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {metrics.recentReports.length > 0 ? (
                                metrics.recentReports.map((r, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition">
                                        <td className="p-4 font-medium">{r.general.date}</td>
                                        <td className="p-4 text-gray-600">{r.general.school}</td>
                                        <td className="p-4 text-gray-600">{r.general.level}</td>
                                        <td className="p-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">مكتمل</span></td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-400">لا توجد بيانات للعرض</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Empty State / Encouragement */}
            {metrics.totalReports === 0 && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex items-start gap-4">
                    <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-indigo-900 mb-1">ابدأ رحلتك الآن!</h4>
                        <p className="text-sm text-indigo-700">لم يتم تسجيل أي تقارير في هذه الفترة. جرب تغيير التاريخ أو إنشاء تقرير جديد.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper icon wrapper since Lucide exports components not strings
const BuildingIconWrapper = (props: any) => <Users {...props} />; 
