import { useState, useEffect, useMemo, useCallback } from 'react';
import { dbService } from '../services/db.service';
import { ReportData } from '../types';

// Data Ranges
export type DateRangeType = 'week' | 'month' | 'custom' | 'all';

export interface DateRange {
    from: string; // ISO Date YYYY-MM-DD
    to: string; // ISO Date YYYY-MM-DD
    type: DateRangeType;
}

export interface AnalyticsFilters {
    school?: string;
    level?: string;
    subject?: string;
}

export interface DashboardMetrics {
    totalReports: number;
    activeSchools: number;
    completionRate: number; // For now: submitted vs drafts (if drafts were in same store), effectively 100% here.
    commitmentRate: number; // Reports / Expected
    avgRating: number; // 0-5
    ratingDistribution: { [key: string]: number };
    dailyActivity: { date: string; count: number }[];
    recentReports: ReportData[];
}

const initialMetrics: DashboardMetrics = {
    totalReports: 0,
    activeSchools: 0,
    completionRate: 0,
    commitmentRate: 0,
    avgRating: 0,
    ratingDistribution: { excellent: 0, good: 0, average: 0, needsImprovement: 0 },
    dailyActivity: [],
    recentReports: []
};

// Helper: Calculate Quality Score (0-5)
const calculateQualityScore = (report: ReportData): number => {
    let score = 1; // Base score for submission
    if (report.quranReport?.length > 20) score += 1;
    if (report.firstClass?.strategies?.length > 1) score += 1;
    if (report.firstClass?.tools?.length > 1) score += 1;
    if (report.notes?.length > 10) score += 1;
    // Cap at 5
    return Math.min(score, 5);
};

const getRatingLabel = (score: number) => {
    if (score >= 4.5) return 'excellent';
    if (score >= 3.5) return 'good';
    if (score >= 2.5) return 'average';
    return 'needsImprovement';
};

export function useAnalytics() {
    // State
    const [allReports, setAllReports] = useState<ReportData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters State
    const [dateRange, setDateRange] = useState<DateRange>({
        type: 'month',
        from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });
    const [filters, setFilters] = useState<AnalyticsFilters>({});

    // 1. Fetch ALL reports once (Single Source of Truth)
    useEffect(() => {
        const fetchReports = async () => {
            try {
                setLoading(true);
                const data = await dbService.getAllReports();
                setAllReports(data);
            } catch (err) {
                console.error("Failed to fetch reports:", err);
                setError("حدث خطأ أثناء تحميل البيانات");
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    // 2. Filter & Calculate (Memoized)
    const metrics = useMemo((): DashboardMetrics => {
        if (allReports.length === 0) return initialMetrics;

        // A. Filter by Date & Criteria
        const filtered = allReports.filter(r => {
            const rDate = r.general.date;
            // Date Check
            if (rDate < dateRange.from || rDate > dateRange.to) return false;
            // School Check
            if (filters.school && r.general.school !== filters.school) return false;
            // Level Check
            if (filters.level && r.general.level !== filters.level) return false;
            // Subject Check (First Class)
            if (filters.subject && r.firstClass.subject !== filters.subject) return false;
            
            return true;
        });

        const total = filtered.length;
        if (total === 0) return initialMetrics;

        // B. Aggregations
        const uniqueSchools = new Set(filtered.map(r => r.general.school).filter(Boolean)).size;
        const totalQualityScore = filtered.reduce((acc, r) => acc + calculateQualityScore(r), 0);
        
        const dist = { excellent: 0, good: 0, average: 0, needsImprovement: 0 };
        const activityMap = new Map<string, number>();

        filtered.forEach(r => {
            const score = calculateQualityScore(r);
            const label = getRatingLabel(score);
            dist[label as keyof typeof dist]++;

            const d = r.general.date;
            activityMap.set(d, (activityMap.get(d) || 0) + 1);
        });

        // C. Advanced KPIs
        // Commitment Rate = Reports / (Working Days * Expectation)
        // Estimate working days in range:
        const start = new Date(dateRange.from);
        const end = new Date(dateRange.to);
        const dayDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
        // Assume 5 days/week working -> ~0.71 of days are working days
        const estimatedWorkingDays = Math.max(1, Math.floor(dayDiff * 0.71)); 
        // Expect 1 report per working day (simplified rule)
        const expectedReports = estimatedWorkingDays * 1; 
        const commitment = Math.min(100, Math.round((total / expectedReports) * 100));

        // D. Sorting
        const activityArr = Array.from(activityMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const recent = [...filtered]
            .sort((a, b) => new Date(b.general.date).getTime() - new Date(a.general.date).getTime())
            .slice(0, 10);

        return {
            totalReports: total,
            activeSchools: uniqueSchools,
            completionRate: 100,
            commitmentRate: commitment,
            avgRating: parseFloat((totalQualityScore / total).toFixed(1)),
            ratingDistribution: dist,
            dailyActivity: activityArr,
            recentReports: recent
        };

    }, [allReports, dateRange, filters]);

    // Helpers to update filters
    const updateDateRange = useCallback((type: DateRangeType, customRange?: {from: string, to: string}) => {
        const today = new Date();
        const to = today.toISOString().split('T')[0];
        let from = to;

        if (type === 'week') {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            from = d.toISOString().split('T')[0];
        } else if (type === 'month') {
            const d = new Date();
            d.setDate(d.getDate() - 30);
            from = d.toISOString().split('T')[0];
        } else if (type === 'all') {
            from = '2023-01-01'; // Beginning of time approx
        } else if (type === 'custom' && customRange) {
            from = customRange.from;
            // to is already customRange.to usually, or we pass both
            if (customRange.to) return setDateRange({ type, from, to: customRange.to });
        }

        setDateRange({ type, from, to });
    }, []);

    return { 
        metrics, 
        loading, 
        error, 
        dateRange, 
        filters, 
        setFilters, 
        updateDateRange,
        refreshAnalytics: () => { /* re-fetch handled by useEffect dependency if needed, or simple force update */ } 
    };
}
