/**
 * Import Types
 * 
 * Types for Excel bulk import system.
 * Phase 11: Bulk Import Center
 */

// --- Schema Types ---

export interface SchoolImport {
    school_code: string;
    name_ar: string;
    level: 'primary' | 'intermediate' | 'secondary' | 'combined';
    region: string;
    principal?: string;
    phone?: string;
    email?: string;
}

export interface ClassImport {
    class_code: string;
    school_code: string; // FK
    grade: string;
    division: string;
    capacity?: number;
}

export interface StudentImport {
    student_code: string;
    student_name: string;
    student_national_id?: string;
    class_code: string; // FK
    guardian_code: string;
    guardian_name: string;
    relationship: 'father' | 'mother' | 'guardian' | 'other';
    guardian_phone: string;
    guardian_email?: string;
}

export interface TeacherImport {
    teacher_code: string;
    teacher_name: string;
    national_id?: string;
    phone?: string;
    email?: string;
    school_code: string; // FK
}

export interface SubjectImport {
    subject_code: string;
    name: string;
    level?: string;
    description?: string;
    teacher_code?: string; // Optional FK
}

// --- Validation Types ---

export type ImportType = 'schools' | 'classes' | 'students' | 'teachers' | 'subjects';

export interface ValidationError {
    row: number;
    field: string;
    message: string;
    value?: any;
}

export interface ValidationWarning {
    row: number;
    field: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    validRows: number;
    totalRows: number;
}

// --- Import Result Types ---

export interface ImportStats {
    created: number;
    updated: number;
    skipped: number;
    failed: number;
}

export interface ImportResult {
    success: boolean;
    type: ImportType;
    stats: ImportStats;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    duration: number; // ms
}

export interface BulkImportResult {
    schools?: ImportResult;
    classes?: ImportResult;
    students?: ImportResult;
    teachers?: ImportResult;
    subjects?: ImportResult;
    totalDuration: number;
    summary: {
        totalCreated: number;
        totalUpdated: number;
        totalFailed: number;
    };
}

// --- Schema Definitions ---

export interface FieldSchema {
    name: string;
    required: boolean;
    type: 'string' | 'number' | 'email' | 'phone' | 'enum';
    enumValues?: string[];
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    foreignKey?: {
        table: ImportType;
        field: string;
    };
}

export const IMPORT_SCHEMAS: Record<ImportType, FieldSchema[]> = {
    schools: [
        { name: 'school_code', required: true, type: 'string', minLength: 2, maxLength: 20 },
        { name: 'name_ar', required: true, type: 'string', minLength: 2, maxLength: 100 },
        { name: 'level', required: true, type: 'enum', enumValues: ['primary', 'intermediate', 'secondary', 'combined'] },
        { name: 'region', required: true, type: 'string' },
        { name: 'principal', required: false, type: 'string' },
        { name: 'phone', required: false, type: 'phone' },
        { name: 'email', required: false, type: 'email' }
    ],
    classes: [
        { name: 'class_code', required: true, type: 'string', minLength: 2, maxLength: 20 },
        { name: 'school_code', required: true, type: 'string', foreignKey: { table: 'schools', field: 'school_code' } },
        { name: 'grade', required: true, type: 'string' },
        { name: 'division', required: true, type: 'string' },
        { name: 'capacity', required: false, type: 'number' }
    ],
    students: [
        { name: 'student_code', required: true, type: 'string', minLength: 2, maxLength: 20 },
        { name: 'student_name', required: true, type: 'string', minLength: 2, maxLength: 100 },
        { name: 'student_national_id', required: false, type: 'string' },
        { name: 'class_code', required: true, type: 'string', foreignKey: { table: 'classes', field: 'class_code' } },
        { name: 'guardian_code', required: true, type: 'string' },
        { name: 'guardian_name', required: true, type: 'string' },
        { name: 'relationship', required: true, type: 'enum', enumValues: ['father', 'mother', 'guardian', 'other'] },
        { name: 'guardian_phone', required: true, type: 'phone' },
        { name: 'guardian_email', required: false, type: 'email' }
    ],
    teachers: [
        { name: 'teacher_code', required: true, type: 'string', minLength: 2, maxLength: 20 },
        { name: 'teacher_name', required: true, type: 'string', minLength: 2, maxLength: 100 },
        { name: 'national_id', required: false, type: 'string' },
        { name: 'phone', required: false, type: 'phone' },
        { name: 'email', required: false, type: 'email' },
        { name: 'school_code', required: true, type: 'string', foreignKey: { table: 'schools', field: 'school_code' } }
    ],
    subjects: [
        { name: 'subject_code', required: true, type: 'string', minLength: 2, maxLength: 20 },
        { name: 'name', required: true, type: 'string', minLength: 2, maxLength: 100 },
        { name: 'level', required: false, type: 'string' },
        { name: 'description', required: false, type: 'string' },
        { name: 'teacher_code', required: false, type: 'string', foreignKey: { table: 'teachers', field: 'teacher_code' } }
    ]
};

// --- Excel Template Columns (Arabic Headers) ---

export const EXCEL_HEADERS: Record<ImportType, Record<string, string>> = {
    schools: {
        school_code: 'رمز المدرسة',
        name_ar: 'اسم المدرسة',
        level: 'المرحلة',
        region: 'المنطقة',
        principal: 'مدير المدرسة',
        phone: 'الهاتف',
        email: 'البريد الإلكتروني'
    },
    classes: {
        class_code: 'رمز الفصل',
        school_code: 'رمز المدرسة',
        grade: 'الصف',
        division: 'الشعبة',
        capacity: 'السعة'
    },
    students: {
        student_code: 'رمز الطالب',
        student_name: 'اسم الطالب',
        student_national_id: 'رقم الهوية',
        class_code: 'رمز الفصل',
        guardian_code: 'رمز ولي الأمر',
        guardian_name: 'اسم ولي الأمر',
        relationship: 'صلة القرابة',
        guardian_phone: 'هاتف ولي الأمر',
        guardian_email: 'بريد ولي الأمر'
    },
    teachers: {
        teacher_code: 'رمز المعلم',
        teacher_name: 'اسم المعلم',
        national_id: 'رقم الهوية',
        phone: 'الهاتف',
        email: 'البريد الإلكتروني',
        school_code: 'رمز المدرسة'
    },
    subjects: {
        subject_code: 'رمز المادة',
        name: 'اسم المادة',
        level: 'المرحلة',
        description: 'الوصف',
        teacher_code: 'رمز المعلم'
    }
};
