/**
 * Admin Service
 * 
 * Provides dashboard data for administrative views.
 * Phase 8: Enterprise Command Dashboard
 */

// --- Types ---

export type ExceptionSeverity = 'critical' | 'warning' | 'info';
export type ExceptionType = 'missed_reports' | 'low_performance' | 'sync_failure' | 'late_submission';

export interface AdminKPIs {
    totalSchools: number;
    totalTeachers: number;
    totalReports: number;
    activeToday: number;
    
    // Rates (0-100)
    commitmentRate: number;
    onTimeRate: number;
    averageQualityScore: number;
    
    // Alerts
    openAlerts: number;
    
    // Trends
    dailyTrend: { date: string; reports: number; expected: number }[];
    weeklyChange: number; // percentage change from last week
}

export interface AdminException {
    id: string;
    type: ExceptionType;
    severity: ExceptionSeverity;
    title: string;
    description: string;
    entityId: string;
    entityType: 'teacher' | 'school' | 'device';
    entityName: string;
    createdAt: number;
    resolved: boolean;
    resolvedAt?: number;
    resolvedBy?: string;
}

export interface SchoolSummary {
    id: string;
    name: string;
    teacherCount: number;
    reportCount: number;
    commitmentRate: number;
    qualityScore: number;
    alertCount: number;
    trend: 'up' | 'down' | 'stable';
    lastReportAt: number | null;
}

export interface TeacherSummary {
    id: string;
    name: string;
    schoolId: string;
    schoolName: string;
    reportCount: number;
    commitmentRate: number;
    lastReportAt: number | null;
    status: 'active' | 'delayed' | 'inactive';
    daysWithoutReport: number;
}

export interface DateRange {
    start: string;
    end: string;
}

export interface AdminFilters {
    dateRange?: DateRange;
    schoolId?: string;
    severity?: ExceptionSeverity;
    resolved?: boolean;
}

// --- Configuration ---
const API_BASE_URL = import.meta.env.VITE_ADMIN_API_URL || '';
const USE_MOCK_DATA = !API_BASE_URL; // Use mock if no API configured

// --- Mock Data Generator ---
function generateMockKPIs(): AdminKPIs {
    const today = new Date();
    const dailyTrend = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dailyTrend.push({
            date: date.toISOString().split('T')[0],
            reports: Math.floor(Math.random() * 50) + 150,
            expected: 180
        });
    }
    
    return {
        totalSchools: 45,
        totalTeachers: 892,
        totalReports: 12450,
        activeToday: 156,
        commitmentRate: 87,
        onTimeRate: 94,
        averageQualityScore: 82,
        openAlerts: 12,
        dailyTrend,
        weeklyChange: 5.2
    };
}

function generateMockExceptions(): AdminException[] {
    return [
        {
            id: '1',
            type: 'missed_reports',
            severity: 'critical',
            title: 'غياب تقارير متكرر',
            description: 'لم يسجل المعلم أي تقرير منذ 5 أيام',
            entityId: 't-001',
            entityType: 'teacher',
            entityName: 'أحمد محمد علي',
            createdAt: Date.now() - 3600000,
            resolved: false
        },
        {
            id: '2',
            type: 'low_performance',
            severity: 'warning',
            title: 'انخفاض في الأداء',
            description: 'انخفضت نسبة الالتزام بـ 25% مقارنة بالأسبوع الماضي',
            entityId: 's-003',
            entityType: 'school',
            entityName: 'مدرسة الأمل الابتدائية',
            createdAt: Date.now() - 7200000,
            resolved: false
        },
        {
            id: '3',
            type: 'sync_failure',
            severity: 'warning',
            title: 'فشل المزامنة',
            description: '3 أجهزة لم تتزامن منذ أكثر من 48 ساعة',
            entityId: 'd-batch',
            entityType: 'device',
            entityName: '3 أجهزة',
            createdAt: Date.now() - 172800000,
            resolved: false
        },
        {
            id: '4',
            type: 'missed_reports',
            severity: 'critical',
            title: 'غياب تقارير',
            description: 'لم يسجل المعلم أي تقرير منذ 3 أيام',
            entityId: 't-015',
            entityType: 'teacher',
            entityName: 'خالد السعيد',
            createdAt: Date.now() - 86400000,
            resolved: false
        },
        {
            id: '5',
            type: 'late_submission',
            severity: 'info',
            title: 'تأخر في الإرسال',
            description: '12 تقرير تم إرسالها بعد الساعة 4 مساءً',
            entityId: 's-001',
            entityType: 'school',
            entityName: 'مدرسة النور',
            createdAt: Date.now() - 43200000,
            resolved: true,
            resolvedAt: Date.now() - 3600000
        }
    ];
}

function generateMockSchools(): SchoolSummary[] {
    const schools = [
        { name: 'مدرسة النور الابتدائية', teachers: 32, rate: 95 },
        { name: 'مدرسة الأمل المتوسطة', teachers: 28, rate: 72 },
        { name: 'مدرسة الفجر الثانوية', teachers: 45, rate: 88 },
        { name: 'مدرسة الرياض النموذجية', teachers: 38, rate: 91 },
        { name: 'مدرسة المستقبل', teachers: 22, rate: 68 },
        { name: 'مدرسة الإبداع', teachers: 18, rate: 97 },
        { name: 'مدرسة العلوم', teachers: 25, rate: 84 },
        { name: 'مدرسة التميز', teachers: 30, rate: 79 }
    ];
    
    return schools.map((s, i) => ({
        id: `s-${i + 1}`,
        name: s.name,
        teacherCount: s.teachers,
        reportCount: Math.floor(s.teachers * 22 * (s.rate / 100)),
        commitmentRate: s.rate,
        qualityScore: Math.floor(s.rate * 0.9 + Math.random() * 10),
        alertCount: s.rate < 80 ? Math.floor(Math.random() * 5) + 1 : 0,
        trend: s.rate > 85 ? 'up' : s.rate < 75 ? 'down' : 'stable',
        lastReportAt: Date.now() - Math.floor(Math.random() * 86400000)
    }));
}

function generateMockTeachers(): TeacherSummary[] {
    const names = [
        'أحمد محمد علي', 'خالد السعيد', 'محمد العمري', 'عبدالله الحربي',
        'سعد الغامدي', 'فهد القحطاني', 'ناصر الدوسري', 'عمر الشهري'
    ];
    
    return names.map((name, i) => {
        const daysWithout = Math.floor(Math.random() * 7);
        return {
            id: `t-${i + 1}`,
            name,
            schoolId: `s-${(i % 4) + 1}`,
            schoolName: ['مدرسة النور', 'مدرسة الأمل', 'مدرسة الفجر', 'مدرسة الرياض'][i % 4],
            reportCount: Math.floor(Math.random() * 30) + 10,
            commitmentRate: Math.floor(Math.random() * 40) + 60,
            lastReportAt: daysWithout === 0 ? Date.now() : Date.now() - (daysWithout * 86400000),
            status: daysWithout >= 3 ? 'inactive' : daysWithout >= 1 ? 'delayed' : 'active',
            daysWithoutReport: daysWithout
        };
    });
}

// --- Admin Service Class ---

class AdminService {
    private authToken: string = '';

    setAuthToken(token: string) {
        this.authToken = token;
    }

    private async fetchApi<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
        if (USE_MOCK_DATA) {
            // Return mock data for development
            await new Promise(r => setTimeout(r, 300)); // Simulate network delay
            
            if (endpoint.includes('kpis')) return generateMockKPIs() as T;
            if (endpoint.includes('exceptions')) return generateMockExceptions() as T;
            if (endpoint.includes('schools')) return generateMockSchools() as T;
            if (endpoint.includes('teachers')) return generateMockTeachers() as T;
            
            throw new Error('Unknown endpoint');
        }

        const url = new URL(`${API_BASE_URL}${endpoint}`);
        if (params) {
            Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
        }

        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        return response.json();
    }

    // --- Public API ---

    async getKPIs(filters?: AdminFilters): Promise<AdminKPIs> {
        const params: Record<string, string> = {};
        if (filters?.dateRange) {
            params.startDate = filters.dateRange.start;
            params.endDate = filters.dateRange.end;
        }
        if (filters?.schoolId) params.schoolId = filters.schoolId;

        return this.fetchApi<AdminKPIs>('/api/admin/kpis', params);
    }

    async getExceptions(filters?: AdminFilters): Promise<AdminException[]> {
        const params: Record<string, string> = {};
        if (filters?.severity) params.severity = filters.severity;
        if (filters?.resolved !== undefined) params.resolved = String(filters.resolved);
        if (filters?.schoolId) params.schoolId = filters.schoolId;

        return this.fetchApi<AdminException[]>('/api/admin/exceptions', params);
    }

    async getSchoolsSummary(filters?: AdminFilters): Promise<SchoolSummary[]> {
        const params: Record<string, string> = {};
        if (filters?.dateRange) {
            params.startDate = filters.dateRange.start;
            params.endDate = filters.dateRange.end;
        }

        return this.fetchApi<SchoolSummary[]>('/api/admin/schools-summary', params);
    }

    async getTeachersSummary(filters?: AdminFilters): Promise<TeacherSummary[]> {
        const params: Record<string, string> = {};
        if (filters?.schoolId) params.schoolId = filters.schoolId;

        return this.fetchApi<TeacherSummary[]>('/api/admin/teachers-summary', params);
    }

    async resolveException(exceptionId: string): Promise<void> {
        if (USE_MOCK_DATA) {
            await new Promise(r => setTimeout(r, 200));
            return;
        }

        await fetch(`${API_BASE_URL}/api/admin/exceptions/${exceptionId}/resolve`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });
    }
}

export const adminService = new AdminService();
