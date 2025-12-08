import { useState, useEffect, useCallback, useRef } from 'react';
import { 
    aiService, 
    AIAnalysis, 
    WeeklySummary, 
    Recommendation,
    AdminInsight
} from '../services/aiService';

// --- useNoteAnalysis Hook ---

export function useNoteAnalysis(text: string, debounceMs = 1000) {
    const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (!text || text.trim().length < 20) {
            setAnalysis(null);
            return;
        }

        // Debounce
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(async () => {
            setIsAnalyzing(true);
            setError(null);

            try {
                const result = await aiService.analyzeNote(text);
                setAnalysis(result);
            } catch (err) {
                console.error('Note analysis error:', err);
                setError('فشل تحليل الملاحظات');
            } finally {
                setIsAnalyzing(false);
            }
        }, debounceMs);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [text, debounceMs]);

    return { analysis, isAnalyzing, error };
}

// --- useWeeklySummary Hook ---

export function useWeeklySummary(teacherId: string | null) {
    const [summary, setSummary] = useState<WeeklySummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSummary = useCallback(async () => {
        if (!teacherId) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await aiService.getWeeklySummary(teacherId);
            setSummary(result);
        } catch (err) {
            console.error('Weekly summary error:', err);
            setError('فشل تحميل الملخص الأسبوعي');
        } finally {
            setIsLoading(false);
        }
    }, [teacherId]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    return { summary, isLoading, error, refresh: fetchSummary };
}

// --- useRecommendations Hook ---

export function useRecommendations(reportData: any) {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!reportData) return;

        const fetchRecommendations = async () => {
            setIsLoading(true);
            try {
                const result = await aiService.getRecommendations(reportData);
                setRecommendations(result);
            } catch (err) {
                console.error('Recommendations error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecommendations();
    }, [reportData]);

    return { recommendations, isLoading };
}

// --- useAdminInsights Hook ---

export function useAdminInsights(schoolId?: string) {
    const [insights, setInsights] = useState<AdminInsight[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInsights = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await aiService.getAdminInsights(schoolId);
            setInsights(result);
        } catch (err) {
            console.error('Admin insights error:', err);
            setError('فشل تحميل التحليلات الذكية');
        } finally {
            setIsLoading(false);
        }
    }, [schoolId]);

    useEffect(() => {
        fetchInsights();
    }, [fetchInsights]);

    // Computed
    const predictions = insights.filter(i => i.type === 'prediction');
    const alerts = insights.filter(i => i.type === 'alert');
    const trends = insights.filter(i => i.type === 'trend');
    const opportunities = insights.filter(i => i.type === 'opportunity');

    const highSeverity = insights.filter(i => i.severity === 'high');

    return {
        insights,
        predictions,
        alerts,
        trends,
        opportunities,
        highSeverity,
        isLoading,
        error,
        refresh: fetchInsights
    };
}
