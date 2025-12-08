import React from 'react';
import { Trophy, AlertTriangle, TrendingUp, TrendingDown, Minus, ChevronLeft } from 'lucide-react';
import { SchoolSummary } from '../../services/adminService';

interface SchoolsRankingProps {
    topSchools: SchoolSummary[];
    bottomSchools: SchoolSummary[];
    onSchoolClick: (schoolId: string) => void;
    isLoading: boolean;
}

const TrendIcon: React.FC<{ trend: 'up' | 'down' | 'stable' }> = ({ trend }) => {
    if (trend === 'up') return <TrendingUp size={14} className="text-green-500" />;
    if (trend === 'down') return <TrendingDown size={14} className="text-red-500" />;
    return <Minus size={14} className="text-gray-400" />;
};

const SchoolRow: React.FC<{ school: SchoolSummary; rank: number; isTop: boolean; onClick: () => void }> = ({ 
    school, rank, isTop, onClick 
}) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors group"
    >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            isTop 
                ? rank === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                : 'bg-red-50 text-red-600'
        }`}>
            {rank}
        </div>
        
        <div className="flex-1 text-right min-w-0">
            <div className="font-medium text-gray-800 text-sm truncate">{school.name}</div>
            <div className="text-[10px] text-gray-500">{school.teacherCount} معلم</div>
        </div>
        
        <div className="flex items-center gap-2">
            <TrendIcon trend={school.trend} />
            <span className={`text-sm font-bold ${
                school.commitmentRate >= 90 ? 'text-green-600' :
                school.commitmentRate >= 80 ? 'text-blue-600' :
                school.commitmentRate >= 70 ? 'text-amber-600' : 'text-red-600'
            }`}>
                {school.commitmentRate}%
            </span>
        </div>
        
        <ChevronLeft size={16} className="text-gray-300 group-hover:text-gray-500 transition" />
    </button>
);

export const SchoolsRanking: React.FC<SchoolsRankingProps> = ({ 
    topSchools, bottomSchools, onSchoolClick, isLoading 
}) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(i => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
                        {[1, 2, 3].map(j => (
                            <div key={j} className="h-12 bg-gray-100 rounded-xl mb-2 animate-pulse" />
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Performers */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <Trophy size={20} className="text-yellow-500" />
                    <h3 className="font-bold text-gray-800">الأفضل أداءً</h3>
                </div>
                
                <div className="p-2">
                    {topSchools.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 text-sm">
                            لا توجد بيانات كافية
                        </div>
                    ) : (
                        topSchools.map((school, index) => (
                            <SchoolRow
                                key={school.id}
                                school={school}
                                rank={index + 1}
                                isTop={true}
                                onClick={() => onSchoolClick(school.id)}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Needs Attention */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-red-500" />
                    <h3 className="font-bold text-gray-800">تحتاج متابعة</h3>
                </div>
                
                <div className="p-2">
                    {bottomSchools.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 text-sm">
                            <span className="text-green-500">✓</span> جميع المدارس بأداء جيد
                        </div>
                    ) : (
                        bottomSchools.map((school, index) => (
                            <SchoolRow
                                key={school.id}
                                school={school}
                                rank={index + 1}
                                isTop={false}
                                onClick={() => onSchoolClick(school.id)}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
