import React from 'react';
import { Brain, Calendar, TrendingUp, Star, Target, AlertTriangle, User, ChevronLeft, Loader2 } from 'lucide-react';
import { WeeklySummary, Recommendation } from '../../services/aiService';

interface WeeklySummaryCardProps {
    summary: WeeklySummary | null;
    isLoading: boolean;
    onRefresh?: () => void;
}

const RecommendationItem: React.FC<{ recommendation: Recommendation }> = ({ recommendation }) => {
    const getPriorityColor = () => {
        switch (recommendation.priority) {
            case 'high': return 'border-red-200 bg-red-50';
            case 'medium': return 'border-amber-200 bg-amber-50';
            default: return 'border-blue-200 bg-blue-50';
        }
    };

    const getTypeIcon = () => {
        switch (recommendation.type) {
            case 'teaching': return '📚';
            case 'management': return '🎯';
            case 'student': return '👤';
            case 'curriculum': return '📋';
        }
    };

    return (
        <div className={`p-3 rounded-xl border ${getPriorityColor()}`}>
            <div className="flex items-start gap-2">
                <span className="text-lg">{getTypeIcon()}</span>
                <div className="flex-1">
                    <h4 className="font-bold text-gray-800 text-sm">{recommendation.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{recommendation.description}</p>
                </div>
            </div>
        </div>
    );
};

export const WeeklySummaryCard: React.FC<WeeklySummaryCardProps> = ({ summary, isLoading, onRefresh }) => {
    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 text-purple-600">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="font-medium">جاري تحميل الملخص الأسبوعي...</span>
                </div>
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center text-gray-500">
                <Brain size={32} className="mx-auto mb-2 opacity-50" />
                <p>لا يوجد ملخص متاح حالياً</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Brain size={24} />
                        <div>
                            <h3 className="font-bold">ملخصك الأسبوعي</h3>
                            <p className="text-xs text-white/70 flex items-center gap-1">
                                <Calendar size={12} />
                                الأسبوع بدءاً من {summary.weekStart}
                            </p>
                        </div>
                    </div>
                    {onRefresh && (
                        <button onClick={onRefresh} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition">
                            <TrendingUp size={18} />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">{summary.totalReports}</div>
                        <div className="text-[10px] text-gray-500">تقارير</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">{summary.completionRate}%</div>
                        <div className="text-[10px] text-gray-500">إكمال</div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-purple-600">{summary.averageQuality}%</div>
                        <div className="text-[10px] text-gray-500">جودة</div>
                    </div>
                </div>

                {/* Top Topics */}
                {summary.topTopics.length > 0 && (
                    <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <Target size={14} />
                            المواضيع الأكثر تكراراً
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {summary.topTopics.map((topic, i) => (
                                <span 
                                    key={i}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs"
                                >
                                    {topic.name} ({topic.frequency})
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Strengths */}
                {summary.strengths.length > 0 && (
                    <div className="bg-green-50 rounded-xl p-3">
                        <h4 className="text-sm font-bold text-green-700 mb-2 flex items-center gap-2">
                            <Star size={14} />
                            نقاط القوة
                        </h4>
                        <ul className="space-y-1.5">
                            {summary.strengths.map((s, i) => (
                                <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                    <span className="text-green-500">✓</span>
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Improvements */}
                {summary.improvements.length > 0 && (
                    <div className="bg-amber-50 rounded-xl p-3">
                        <h4 className="text-sm font-bold text-amber-700 mb-2 flex items-center gap-2">
                            <TrendingUp size={14} />
                            فرص التحسين
                        </h4>
                        <ul className="space-y-1.5">
                            {summary.improvements.map((s, i) => (
                                <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                    <span className="text-amber-500">→</span>
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Student Alerts */}
                {summary.studentAlerts.length > 0 && (
                    <div className="bg-red-50 rounded-xl p-3">
                        <h4 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-2">
                            <AlertTriangle size={14} />
                            طلاب يحتاجون متابعة
                        </h4>
                        <div className="space-y-2">
                            {summary.studentAlerts.map((alert, i) => (
                                <div key={i} className="flex items-center justify-between bg-white/60 rounded-lg p-2">
                                    <div className="flex items-center gap-2">
                                        <User size={14} className="text-red-500" />
                                        <span className="text-sm font-medium text-gray-800">{alert.name}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">{alert.reason} ({alert.count})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recommendations */}
                {summary.recommendations.length > 0 && (
                    <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            💡 توصيات ذكية
                        </h4>
                        <div className="space-y-2">
                            {summary.recommendations.map(rec => (
                                <RecommendationItem key={rec.id} recommendation={rec} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
