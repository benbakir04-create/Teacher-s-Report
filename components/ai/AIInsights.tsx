import React from 'react';
import { Brain, Lightbulb, AlertCircle, TrendingUp, Smile, Meh, Frown, Loader2 } from 'lucide-react';
import { AIAnalysis, Sentiment } from '../../services/aiService';

interface AIInsightsProps {
    analysis: AIAnalysis | null;
    isAnalyzing: boolean;
    compact?: boolean;
}

const SentimentIcon: React.FC<{ sentiment: Sentiment; score: number }> = ({ sentiment, score }) => {
    const getConfig = () => {
        switch (sentiment) {
            case 'positive':
                return { icon: <Smile size={18} />, color: 'text-green-500', bg: 'bg-green-50', label: 'إيجابي' };
            case 'negative':
                return { icon: <Frown size={18} />, color: 'text-red-500', bg: 'bg-red-50', label: 'سلبي' };
            default:
                return { icon: <Meh size={18} />, color: 'text-gray-500', bg: 'bg-gray-50', label: 'محايد' };
        }
    };

    const config = getConfig();

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${config.bg} ${config.color}`}>
            {config.icon}
            <span>{config.label}</span>
            <span className="text-xs opacity-60">({Math.round(Math.abs(score) * 100)}%)</span>
        </div>
    );
};

export const AIInsights: React.FC<AIInsightsProps> = ({ analysis, isAnalyzing, compact = false }) => {
    if (isAnalyzing) {
        return (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-100">
                <div className="flex items-center gap-2 text-purple-600">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-sm font-medium">جاري التحليل الذكي...</span>
                </div>
            </div>
        );
    }

    if (!analysis || analysis.confidence === 0) {
        return null;
    }

    if (compact) {
        return (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-3 border border-purple-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-600">
                        <Brain size={16} />
                        <span className="text-xs font-medium">تحليل ذكي</span>
                    </div>
                    <SentimentIcon sentiment={analysis.sentiment} score={analysis.sentimentScore} />
                </div>
                {analysis.suggestions.length > 0 && (
                    <p className="text-xs text-gray-600 mt-2 line-clamp-1">
                        💡 {analysis.suggestions[0]}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-100 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white flex items-center gap-2">
                <Brain size={20} />
                <span className="font-bold">تحليل ذكي</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full mr-auto">
                    دقة {Math.round(analysis.confidence * 100)}%
                </span>
            </div>

            <div className="p-4 space-y-4">
                {/* Sentiment */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">المزاج العام:</span>
                    <SentimentIcon sentiment={analysis.sentiment} score={analysis.sentimentScore} />
                </div>

                {/* Topics */}
                {analysis.topics.length > 0 && (
                    <div>
                        <span className="text-sm text-gray-600 block mb-2">المواضيع:</span>
                        <div className="flex flex-wrap gap-2">
                            {analysis.topics.map((topic, i) => (
                                <span 
                                    key={i}
                                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium"
                                >
                                    {topic.name} ({topic.frequency})
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Suggestions */}
                {analysis.suggestions.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                        <div className="flex items-center gap-2 text-yellow-700 mb-2">
                            <Lightbulb size={16} />
                            <span className="text-sm font-bold">اقتراحات</span>
                        </div>
                        <ul className="space-y-1.5">
                            {analysis.suggestions.map((suggestion, i) => (
                                <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                    <span className="text-yellow-500 mt-0.5">•</span>
                                    {suggestion}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Concerns */}
                {analysis.concerns.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <div className="flex items-center gap-2 text-red-700 mb-2">
                            <AlertCircle size={16} />
                            <span className="text-sm font-bold">نقاط تحتاج انتباه</span>
                        </div>
                        <ul className="space-y-1.5">
                            {analysis.concerns.map((concern, i) => (
                                <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                    <span className="text-red-500 mt-0.5">⚠</span>
                                    {concern}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Students Mentioned */}
                {analysis.entities.filter(e => e.type === 'student').length > 0 && (
                    <div>
                        <span className="text-sm text-gray-600 block mb-2">طلاب مذكورون:</span>
                        <div className="flex flex-wrap gap-2">
                            {analysis.entities.filter(e => e.type === 'student').map((entity, i) => (
                                <span 
                                    key={i}
                                    className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                        entity.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                                        entity.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    {entity.text}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
