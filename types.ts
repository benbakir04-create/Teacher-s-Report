
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

export type TabId = 'general' | 'quran' | 'class1' | 'class2' | 'notes' | 'reports' | 'about';

export type CompletionStatus = 'complete' | 'partial' | 'incomplete';
