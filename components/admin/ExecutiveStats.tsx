import React from 'react';
import { Building2, Users, FileText, Activity, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { AdminKPIs } from '../../services/adminService';

interface ExecutiveStatsProps {
    kpis: AdminKPIs | null;
    isLoading: boolean;
}

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subtext?: string;
    trend?: number;
    color: string;
    isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subtext, trend, color, isLoading }) => (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-hidden`}>
        {/* Background Pattern */}
        <div className={`absolute top-0 left-0 w-24 h-24 ${color} opacity-10 rounded-full -translate-x-8 -translate-y-8`} />
        
        <div className="relative">
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${color} bg-opacity-10 flex items-center justify-center`}>
                    <span className={`${color.replace('bg-', 'text-')}`}>{icon}</span>
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            
            {isLoading ? (
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-1" />
            ) : (
                <div className="text-2xl font-bold text-gray-800 mb-1">{value}</div>
            )}
            
            <div className="text-xs text-gray-500">{label}</div>
            {subtext && <div className="text-[10px] text-gray-400 mt-1">{subtext}</div>}
        </div>
    </div>
);

export const ExecutiveStats: React.FC<ExecutiveStatsProps> = ({ kpis, isLoading }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard
                icon={<Building2 size={20} />}
                label="المدارس"
                value={kpis?.totalSchools || 0}
                color="bg-blue-500"
                isLoading={isLoading}
            />
            <StatCard
                icon={<Users size={20} />}
                label="المعلمين"
                value={kpis?.totalTeachers || 0}
                subtext={`${kpis?.activeToday || 0} نشط اليوم`}
                color="bg-indigo-500"
                isLoading={isLoading}
            />
            <StatCard
                icon={<FileText size={20} />}
                label="نسبة الالتزام"
                value={`${kpis?.commitmentRate || 0}%`}
                trend={kpis?.weeklyChange}
                color="bg-green-500"
                isLoading={isLoading}
            />
            <StatCard
                icon={<Activity size={20} />}
                label="جودة الأداء"
                value={`${kpis?.averageQualityScore || 0}%`}
                subtext={`${kpis?.onTimeRate || 0}% في الوقت`}
                color="bg-purple-500"
                isLoading={isLoading}
            />
            <StatCard
                icon={<AlertTriangle size={20} />}
                label="تنبيهات مفتوحة"
                value={kpis?.openAlerts || 0}
                color="bg-amber-500"
                isLoading={isLoading}
            />
        </div>
    );
};
