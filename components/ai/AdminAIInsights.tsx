import React from 'react';
import { Brain, TrendingDown, TrendingUp, AlertTriangle, Sparkles, ChevronLeft, Loader2 } from 'lucide-react';
import { AdminInsight } from '../../services/aiService';

interface AdminAIInsightsProps {
    insights: AdminInsight[];
    isLoading: boolean;
    onInsightClick?: (insight: AdminInsight) => void;
}

const InsightCard: React.FC<{ insight: AdminInsight; onClick?: () => void }> = ({ insight, onClick }) => {
    const getConfig = () => {
        switch (insight.type) {
            case 'prediction':
                return {
                    icon: insight.metric && insight.metric.change < 0 
                        ? <TrendingDown size={18} /> 
                        : <TrendingUp size={18} />,
                    bg: insight.severity === 'high' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200',
                    iconBg: insight.severity === 'high' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                };
            case 'alert':
                return {
                    icon: <AlertTriangle size={18} />,
                    bg: 'bg-red-50 border-red-200',
                    iconBg: 'bg-red-100 text-red-600'
                };
            case 'trend':
                return {
                    icon: <TrendingUp size={18} />,
                    bg: 'bg-blue-50 border-blue-200',
                    iconBg: 'bg-blue-100 text-blue-600'
                };
            case 'opportunity':
                return {
                    icon: <Sparkles size={18} />,
                    bg: 'bg-green-50 border-green-200',
                    iconBg: 'bg-green-100 text-green-600'
                };
        }
    };

    const config = getConfig();

    return (
        <button
            onClick={onClick}
            className={`w-full p-4 rounded-xl border ${config.bg} hover:brightness-95 transition-all text-right group`}
        >
            <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center shrink-0`}>
                    {config.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800 text-sm">{insight.title}</span>
                        {insight.severity === 'high' && (
                            <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">
                                عاجل
                            </span>
                        )}
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {insight.description}
                    </p>
                    
                    {insight.metric && (
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500">الحالي: {insight.metric.current}%</span>
                            <span className="text-gray-400">→</span>
                            <span className={insight.metric.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                                متوقع: {insight.metric.predicted}%
                            </span>
                            <span className={`font-bold ${insight.metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ({insight.metric.change >= 0 ? '+' : ''}{insight.metric.change}%)
                            </span>
                        </div>
                    )}
                    
                    <div className="text-[10px] text-gray-400 mt-2">
                        {insight.entityName}
                    </div>
                </div>
                
                <ChevronLeft size={16} className="text-gray-300 group-hover:text-gray-500 transition shrink-0" />
            </div>
        </button>
    );
};

export const AdminAIInsights: React.FC<AdminAIInsightsProps> = ({ insights, isLoading, onInsightClick }) => {
    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 text-purple-600">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="font-medium">جاري تحليل البيانات...</span>
                </div>
            </div>
        );
    }

    const highPriority = insights.filter(i => i.severity === 'high');
    const otherInsights = insights.filter(i => i.severity !== 'high');

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <Brain size={20} className="text-purple-500" />
                <h3 className="font-bold text-gray-800">تحليلات ذكية</h3>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full mr-auto">
                    AI
                </span>
            </div>

            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {insights.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        <Sparkles size={32} className="mx-auto mb-2 opacity-50" />
                        <p>لا توجد تحليلات جديدة</p>
                    </div>
                ) : (
                    <>
                        {/* High Priority First */}
                        {highPriority.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-red-600 px-1">⚠️ تحتاج اهتمام فوري</h4>
                                {highPriority.map(insight => (
                                    <InsightCard 
                                        key={insight.id} 
                                        insight={insight}
                                        onClick={() => onInsightClick?.(insight)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Other Insights */}
                        {otherInsights.length > 0 && (
                            <div className="space-y-2">
                                {highPriority.length > 0 && (
                                    <h4 className="text-xs font-bold text-gray-500 px-1 mt-4">رؤى أخرى</h4>
                                )}
                                {otherInsights.map(insight => (
                                    <InsightCard 
                                        key={insight.id} 
                                        insight={insight}
                                        onClick={() => onInsightClick?.(insight)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
