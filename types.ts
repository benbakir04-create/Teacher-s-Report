
export interface TeacherData {
    id: string;
    name: string;
    school: string;
    level: string;
    sectionId: string;
    date: string;
}

export interface ClassData {
    subject: string;
    lesson: string;
    strategies: string[];
    tools: string[];
    tasks: string[];
    gender?: string;
}

export interface ReportData {
    general: TeacherData;
    quranReport: string;
    firstClass: ClassData;
    secondClass: ClassData;
    hasSecondClass: boolean;
    notes: string;
}

export interface ArchivedReport extends ReportData {
    uid: string;
    savedAt: number;
}

// New Draft Interface
export interface Draft {
    id: string; // Composite key: classId + date (or just unique uuid)
    classId: string; // sectionId
    date: string;
    data: ReportData;
    updatedAt: number;
}

export interface ListData {
    schools: string[];
    levels: string[];
    sections: string[];
    subjects: { [level: string]: string[] };
    lessons: any;
    strategies: string[];
    tools: string[];
    tasks: string[];
}

export type TabId = 'dailyReport' | 'notes' | 'statistics';

// User Menu Pages (accessed via avatar click)
export type MenuPage = 'myAccount' | 'generalData' | 'myClasses' | 'systemSettings' | 'usersManagement' | 'adminDashboard' | 'organizationPortal' | 'ownerDashboard' | 'importCenter' | null;

export type CompletionStatus = 'complete' | 'partial' | 'incomplete';

// --- Phase 6: Users & RBAC ---
export type Role = "teacher" | "school_admin" | "inspector" | "super_admin";

export interface User {
    id: string;               // UUID (Local System ID)
    teacher_id?: string;      // Linked Teacher Registration ID (Read-only from sheets)
    name: string;             // Display Name (Read-only from sheets)
    email?: string;           // Optional link
    school_id?: string;
    roles: Role[];            // ['teacher'] default
    sections?: string[];      // Associated sections
    device_fingerprint?: string; 
    linked_at?: number | null;
    must_link_email?: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface LogEntry {
    id: string;
    event: string;
    userId: string;
    details?: any;
    timestamp: number;
}

// See db.service.ts for SyncItem


// Dashboard Statistics Types
export interface LessonWithMonth {
  level: string;
  subject: string;
  lesson: string;
  gender?: string;
  expectedMonth: number; // 1-12
}

export interface SubjectProgress {
  subject: string;
  level: string;
  completed: number;
  total: number;
  percentage: number;
  overdue: number;
  notes?: string;
}

export interface TeacherStats {
  totalCompleted: number;
  totalExpected: number;
  overallPercentage: number;
  subjectProgress: SubjectProgress[];
  totalOverdue: number;
}

export interface ChartData {
    subject: string;
    total: number;
    actual: number;
    percentage: string;
}
