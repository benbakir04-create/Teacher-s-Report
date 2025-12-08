import React, { useState } from 'react';
import { ExecutiveStats } from '../../components/admin/ExecutiveStats';
import { ExceptionsFeed } from '../../components/admin/ExceptionsFeed';
import { SchoolsRanking } from '../../components/admin/SchoolsRanking';
import { DelayedTeachers } from '../../components/admin/DelayedTeachers';
import { AdminAIInsights } from '../../components/ai/AdminAIInsights';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { useAdminInsights } from '../../hooks/useAI';
import { RefreshCw, Filter, Calendar, Building2 } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
    const dashboard = useAdminDashboard();
    const aiInsights = useAdminInsights(dashboard.selectedSchoolId || undefined);
    const [showFilters, setShowFilters] = useState(false);

    const handleSchoolClick = (schoolId: string) => {
        dashboard.setSelectedSchool(schoolId);
        // TODO: Navigate to school detail view
        console.log('Navigate to school:', schoolId);
    };

    const handleTeacherClick = (teacherId: string) => {
        // TODO: Navigate to teacher detail view
        console.log('Navigate to teacher:', teacherId);
    };

    const handleInsightClick = (insight: any) => {
        console.log('Navigate to insight:', insight);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-8">
            {/* Header */}
            <div className="bg-gradient-to-bl from-indigo-600 to-purple-700 px-6 py-8 text-white">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold">لوحة تحكم الإدارة</h1>
                            <p className="text-white/70 text-sm mt-1">نظرة شاملة على أداء المؤسسة</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-2 rounded-xl transition ${
                                    showFilters ? 'bg-white text-purple-700' : 'bg-white/20 hover:bg-white/30'
                                }`}
                            >
                                <Filter size={20} />
                            </button>
                            <button
                                onClick={dashboard.refresh}
                                disabled={dashboard.isLoading}
                                className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition disabled:opacity-50"
                            >
                                <RefreshCw size={20} className={dashboard.isLoading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>

                    {/* Filters Panel */}
                    {showFilters && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4 animate-fade-in">
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} />
                                    <input
                                        type="date"
                                        value={dashboard.dateRange.start}
                                        onChange={(e) => dashboard.setDateRange({
                                            ...dashboard.dateRange,
                                            start: e.target.value
                                        })}
                                        className="px-3 py-1.5 bg-white/20 rounded-lg text-white text-sm border border-white/20 focus:border-white/50 outline-none"
                                    />
                                    <span>إلى</span>
                                    <input
                                        type="date"
                                        value={dashboard.dateRange.end}
                                        onChange={(e) => dashboard.setDateRange({
                                            ...dashboard.dateRange,
                                            end: e.target.value
                                        })}
                                        className="px-3 py-1.5 bg-white/20 rounded-lg text-white text-sm border border-white/20 focus:border-white/50 outline-none"
                                    />
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <Building2 size={16} />
                                    <select
                                        value={dashboard.selectedSchoolId || ''}
                                        onChange={(e) => dashboard.setSelectedSchool(e.target.value || null)}
                                        className="px-3 py-1.5 bg-white/20 rounded-lg text-white text-sm border border-white/20 focus:border-white/50 outline-none"
                                    >
                                        <option value="" className="text-gray-800">جميع المدارس</option>
                                        {dashboard.schools.map(s => (
                                            <option key={s.id} value={s.id} className="text-gray-800">
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Executive Stats */}
                    <ExecutiveStats kpis={dashboard.kpis} isLoading={dashboard.isLoading} />
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 -mt-4 space-y-6">
                {/* Error State */}
                {dashboard.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
                        {dashboard.error}
                    </div>
                )}

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Exceptions & Rankings */}
                    <div className="lg:col-span-2 space-y-6">
                        <ExceptionsFeed
                            exceptions={dashboard.exceptions}
                            onResolve={dashboard.resolveException}
                            isLoading={dashboard.isLoading}
                        />
                        
                        <SchoolsRanking
                            topSchools={dashboard.topSchools}
                            bottomSchools={dashboard.bottomSchools}
                            onSchoolClick={handleSchoolClick}
                            isLoading={dashboard.isLoading}
                        />
                    </div>
                    
                    {/* Right Column - AI Insights & Teachers */}
                    <div className="space-y-6">
                        <AdminAIInsights
                            insights={aiInsights.insights}
                            isLoading={aiInsights.isLoading}
                            onInsightClick={handleInsightClick}
                        />
                        
                        <DelayedTeachers
                            teachers={dashboard.delayedTeachers}
                            onTeacherClick={handleTeacherClick}
                            isLoading={dashboard.isLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
