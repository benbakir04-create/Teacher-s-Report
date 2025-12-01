
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

export type TabId = 'general' | 'quran' | 'class1' | 'class2' | 'notes' | 'dashboard' | 'about';

export type CompletionStatus = 'complete' | 'partial' | 'incomplete';

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
}

export interface TeacherStats {
  totalCompleted: number;
  totalExpected: number;
  overallPercentage: number;
  subjectProgress: SubjectProgress[];
  totalOverdue: number;
}
