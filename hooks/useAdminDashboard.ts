import { useState, useEffect, useCallback } from 'react';
import { 
    adminService, 
    AdminKPIs, 
    AdminException, 
    SchoolSummary, 
    TeacherSummary,
    AdminFilters,
    DateRange
} from '../services/adminService';

export interface AdminDashboardState {
    kpis: AdminKPIs | null;
    exceptions: AdminException[];
    schools: SchoolSummary[];
    teachers: TeacherSummary[];
    
    isLoading: boolean;
    error: string | null;
    
    // Filters
    dateRange: DateRange;
    selectedSchoolId: string | null;
    showResolved: boolean;
}

export function useAdminDashboard() {
    const [state, setState] = useState<AdminDashboardState>({
        kpis: null,
        exceptions: [],
        schools: [],
        teachers: [],
        isLoading: true,
        error: null,
        dateRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
        },
        selectedSchoolId: null,
        showResolved: false
    });

    const fetchData = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        try {
            const filters: AdminFilters = {
                dateRange: state.dateRange,
                schoolId: state.selectedSchoolId || undefined,
                resolved: state.showResolved
            };

            const [kpis, exceptions, schools, teachers] = await Promise.all([
                adminService.getKPIs(filters),
                adminService.getExceptions(filters),
                adminService.getSchoolsSummary(filters),
                adminService.getTeachersSummary(filters)
            ]);

            setState(prev => ({
                ...prev,
                kpis,
                exceptions,
                schools,
                teachers,
                isLoading: false
            }));
        } catch (err) {
            console.error('Admin dashboard error:', err);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: 'فشل تحميل بيانات لوحة التحكم'
            }));
        }
    }, [state.dateRange, state.selectedSchoolId, state.showResolved]);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // --- Actions ---

    const setDateRange = useCallback((range: DateRange) => {
        setState(prev => ({ ...prev, dateRange: range }));
    }, []);

    const setSelectedSchool = useCallback((schoolId: string | null) => {
        setState(prev => ({ ...prev, selectedSchoolId: schoolId }));
    }, []);

    const toggleShowResolved = useCallback(() => {
        setState(prev => ({ ...prev, showResolved: !prev.showResolved }));
    }, []);

    const resolveException = useCallback(async (exceptionId: string) => {
        try {
            await adminService.resolveException(exceptionId);
            setState(prev => ({
                ...prev,
                exceptions: prev.exceptions.map(e => 
                    e.id === exceptionId 
                        ? { ...e, resolved: true, resolvedAt: Date.now() }
                        : e
                )
            }));
        } catch (err) {
            console.error('Failed to resolve exception:', err);
        }
    }, []);

    const refresh = useCallback(() => {
        fetchData();
    }, [fetchData]);

    // --- Computed Values ---

    const topSchools = state.schools
        .filter(s => s.commitmentRate >= 85)
        .sort((a, b) => b.commitmentRate - a.commitmentRate)
        .slice(0, 5);

    const bottomSchools = state.schools
        .filter(s => s.commitmentRate < 80)
        .sort((a, b) => a.commitmentRate - b.commitmentRate)
        .slice(0, 5);

    const criticalExceptions = state.exceptions.filter(e => !e.resolved && e.severity === 'critical');
    const warningExceptions = state.exceptions.filter(e => !e.resolved && e.severity === 'warning');

    const delayedTeachers = state.teachers.filter(t => t.status === 'inactive' || t.status === 'delayed');

    return {
        ...state,
        topSchools,
        bottomSchools,
        criticalExceptions,
        warningExceptions,
        delayedTeachers,
        
        // Actions
        setDateRange,
        setSelectedSchool,
        toggleShowResolved,
        resolveException,
        refresh
    };
}
