/**
 * Import Service
 * 
 * Handles Excel file parsing, validation, and bulk import operations.
 * Phase 11: Excel Bulk Import System
 * 
 * Note: xlsx library is optional. Install with: npm install xlsx
 */

import {
    ImportType,
    ValidationResult,
    ValidationError,
    ValidationWarning,
    ImportResult,
    BulkImportResult,
    IMPORT_SCHEMAS,
    SchoolImport,
    ClassImport,
    StudentImport,
    TeacherImport,
    SubjectImport
} from '../types/import.types';

// --- Types ---

interface ParsedSheet {
    name: string;
    headers: string[];
    rows: Record<string, any>[];
}

interface ParseResult {
    sheets: ParsedSheet[];
    errors: string[];
}

// --- Excel Parsing ---

export async function parseExcel(file: File): Promise<ParseResult> {
    try {
        const XLSX = await import('xlsx');
        
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    const sheets: ParsedSheet[] = [];
                    
                    for (const sheetName of workbook.SheetNames) {
                        const sheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
                        
                        if (jsonData.length < 2) continue;
                        
                        const headers = jsonData[0].map(h => String(h || '').trim());
                        const rows = jsonData.slice(1).map(row => {
                            const obj: Record<string, any> = {};
                            headers.forEach((header, i) => {
                                obj[header] = row[i] ?? '';
                            });
                            return obj;
                        }).filter(row => Object.values(row).some(v => v !== ''));
                        
                        sheets.push({ name: sheetName, headers, rows });
                    }
                    
                    resolve({ sheets, errors: [] });
                } catch (err) {
                    resolve({ 
                        sheets: [], 
                        errors: [`فشل قراءة الملف: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`] 
                    });
                }
            };
            
            reader.onerror = () => resolve({ sheets: [], errors: ['فشل قراءة الملف'] });
            reader.readAsArrayBuffer(file);
        });
    } catch {
        return { sheets: [], errors: ['مكتبة xlsx غير مثبتة. قم بتثبيتها: npm install xlsx'] };
    }
}

export async function generateTemplate(type: ImportType): Promise<Blob> {
    const XLSX = await import('xlsx');
    const schema = IMPORT_SCHEMAS[type];
    
    const headers = schema.map(f => f.name);
    const sampleRow = schema.map(f => {
        if (f.enumValues) return f.enumValues[0];
        if (f.type === 'number') return 0;
        if (f.type === 'email') return 'example@email.com';
        if (f.type === 'phone') return '+966500000000';
        return `sample_${f.name}`;
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type);
    
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// --- Header Mapping (Arabic → English) ---

const HEADER_MAP: Record<string, string> = {
    'رمز المدرسة': 'school_code',
    'اسم المدرسة': 'name_ar',
    'المرحلة': 'level',
    'المنطقة': 'region',
    'مدير المدرسة': 'principal',
    'الهاتف': 'phone',
    'البريد الإلكتروني': 'email',
    'رمز الفصل': 'class_code',
    'الصف': 'grade',
    'الشعبة': 'division',
    'السعة': 'capacity',
    'رمز الطالب': 'student_code',
    'اسم الطالب': 'student_name',
    'رقم الهوية': 'student_national_id',
    'رمز ولي الأمر': 'guardian_code',
    'اسم ولي الأمر': 'guardian_name',
    'صلة القرابة': 'relationship',
    'هاتف ولي الأمر': 'guardian_phone',
    'بريد ولي الأمر': 'guardian_email',
    'رمز المعلم': 'teacher_code',
    'اسم المعلم': 'teacher_name',
    'رمز المادة': 'subject_code',
    'اسم المادة': 'name',
    'الوصف': 'description'
};

export function mapRowToEnglish(row: Record<string, any>): Record<string, any> {
    const mapped: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
        mapped[HEADER_MAP[key] || key] = value;
    }
    return mapped;
}

// --- Validation ---

function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string): boolean {
    return /^[\d\s+\-()]{8,20}$/.test(phone);
}

export function validateRows(
    rows: Record<string, any>[],
    type: ImportType,
    existingCodes: Map<string, Set<string>> = new Map()
): ValidationResult {
    const schema = IMPORT_SCHEMAS[type];
    if (!schema) {
        return { isValid: false, errors: [{ row: 0, field: '', message: `نوع غير معروف: ${type}` }], warnings: [], validRows: 0, totalRows: rows.length };
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const seenCodes = new Set<string>();
    let validRows = 0;

    rows.forEach((row, index) => {
        const rowNum = index + 2;
        let rowValid = true;

        for (const field of schema) {
            const value = row[field.name];
            const isEmpty = value === undefined || value === null || value === '';

            if (field.required && isEmpty) {
                errors.push({ row: rowNum, field: field.name, message: `الحقل "${field.name}" مطلوب`, value });
                rowValid = false;
                continue;
            }

            if (isEmpty) continue;

            switch (field.type) {
                case 'email':
                    if (!validateEmail(String(value))) {
                        errors.push({ row: rowNum, field: field.name, message: `بريد إلكتروني غير صالح`, value });
                        rowValid = false;
                    }
                    break;
                case 'phone':
                    if (!validatePhone(String(value))) {
                        warnings.push({ row: rowNum, field: field.name, message: `رقم هاتف قد يكون غير صالح: ${value}` });
                    }
                    break;
                case 'number':
                    if (isNaN(Number(value))) {
                        errors.push({ row: rowNum, field: field.name, message: `يجب أن يكون رقماً`, value });
                        rowValid = false;
                    }
                    break;
                case 'enum':
                    if (field.enumValues && !field.enumValues.includes(String(value))) {
                        errors.push({ row: rowNum, field: field.name, message: `قيمة غير صالحة. القيم المتاحة: ${field.enumValues.join(', ')}`, value });
                        rowValid = false;
                    }
                    break;
            }

            if (field.type === 'string') {
                const strValue = String(value);
                if (field.minLength && strValue.length < field.minLength) {
                    errors.push({ row: rowNum, field: field.name, message: `يجب ألا يقل عن ${field.minLength} أحرف`, value });
                    rowValid = false;
                }
                if (field.maxLength && strValue.length > field.maxLength) {
                    errors.push({ row: rowNum, field: field.name, message: `يجب ألا يزيد عن ${field.maxLength} حرف`, value });
                    rowValid = false;
                }
            }

            if (field.foreignKey) {
                const fkCodes = existingCodes.get(field.foreignKey.table);
                if (fkCodes && !fkCodes.has(String(value))) {
                    errors.push({ row: rowNum, field: field.name, message: `مرجع غير موجود: ${value} غير موجود في ${field.foreignKey.table}`, value });
                    rowValid = false;
                }
            }
        }

        const codeField = schema.find(f => f.name.endsWith('_code') && f.required);
        if (codeField) {
            const codeValue = String(row[codeField.name] || '');
            if (seenCodes.has(codeValue)) {
                errors.push({ row: rowNum, field: codeField.name, message: `قيمة مكررة: ${codeValue}`, value: codeValue });
                rowValid = false;
            } else {
                seenCodes.add(codeValue);
            }
        }

        if (rowValid) validRows++;
    });

    return { isValid: errors.length === 0, errors, warnings, validRows, totalRows: rows.length };
}

// --- Mock Data Storage ---

const mockData: Record<ImportType, Map<string, any>> = {
    schools: new Map(),
    classes: new Map(),
    students: new Map(),
    teachers: new Map(),
    subjects: new Map()
};

const guardians = new Map<string, any>();

// --- Upsert Functions ---

export async function upsertSchool(data: SchoolImport): Promise<'created' | 'updated'> {
    const existing = mockData.schools.has(data.school_code);
    mockData.schools.set(data.school_code, { ...data, updatedAt: Date.now() });
    return existing ? 'updated' : 'created';
}

export async function upsertClass(data: ClassImport): Promise<'created' | 'updated'> {
    const existing = mockData.classes.has(data.class_code);
    mockData.classes.set(data.class_code, { ...data, updatedAt: Date.now() });
    return existing ? 'updated' : 'created';
}

export async function upsertTeacher(data: TeacherImport): Promise<'created' | 'updated'> {
    const existing = mockData.teachers.has(data.teacher_code);
    mockData.teachers.set(data.teacher_code, { ...data, updatedAt: Date.now() });
    return existing ? 'updated' : 'created';
}

export async function upsertStudent(data: StudentImport): Promise<'created' | 'updated'> {
    const existing = mockData.students.has(data.student_code);
    mockData.students.set(data.student_code, { student_code: data.student_code, student_name: data.student_name, class_code: data.class_code, updatedAt: Date.now() });
    guardians.set(data.guardian_code, { guardian_code: data.guardian_code, guardian_name: data.guardian_name, guardian_phone: data.guardian_phone, relationship: data.relationship });
    return existing ? 'updated' : 'created';
}

export async function upsertSubject(data: SubjectImport): Promise<'created' | 'updated'> {
    const existing = mockData.subjects.has(data.subject_code);
    mockData.subjects.set(data.subject_code, { ...data, updatedAt: Date.now() });
    return existing ? 'updated' : 'created';
}

// --- Bulk Import ---

export async function importType(
    type: ImportType,
    rows: Record<string, any>[],
    existingCodes: Map<string, Set<string>>
): Promise<ImportResult> {
    const startTime = Date.now();
    const mappedRows = rows.map(mapRowToEnglish);
    const validation = validateRows(mappedRows, type, existingCodes);
    
    if (!validation.isValid) {
        return { success: false, type, stats: { created: 0, updated: 0, skipped: 0, failed: validation.errors.length }, errors: validation.errors, warnings: validation.warnings, duration: Date.now() - startTime };
    }

    const stats = { created: 0, updated: 0, skipped: 0, failed: 0 };
    const errors: ValidationError[] = [];

    for (let i = 0; i < mappedRows.length; i++) {
        try {
            const row = mappedRows[i];
            let result: 'created' | 'updated';

            switch (type) {
                case 'schools': result = await upsertSchool(row as SchoolImport); break;
                case 'classes': result = await upsertClass(row as ClassImport); break;
                case 'students': result = await upsertStudent(row as StudentImport); break;
                case 'teachers': result = await upsertTeacher(row as TeacherImport); break;
                case 'subjects': result = await upsertSubject(row as SubjectImport); break;
                default: throw new Error(`Unsupported type: ${type}`);
            }

            stats[result]++;
        } catch (err) {
            stats.failed++;
            errors.push({ row: i + 2, field: '', message: err instanceof Error ? err.message : 'خطأ غير معروف' });
        }
    }

    const codeField = IMPORT_SCHEMAS[type].find(f => f.name.endsWith('_code') && f.required);
    if (codeField) {
        const codes = existingCodes.get(type) || new Set();
        mappedRows.forEach(row => codes.add(String(row[codeField.name])));
        existingCodes.set(type, codes);
    }

    return { success: stats.failed === 0, type, stats, errors, warnings: validation.warnings, duration: Date.now() - startTime };
}

export async function bulkImport(files: { type: ImportType; rows: Record<string, any>[] }[]): Promise<BulkImportResult> {
    const startTime = Date.now();
    const results: Partial<Record<ImportType, ImportResult>> = {};
    const existingCodes = new Map<string, Set<string>>();

    for (const [type, dataMap] of Object.entries(mockData)) {
        existingCodes.set(type as ImportType, new Set(dataMap.keys()));
    }

    const order: ImportType[] = ['schools', 'classes', 'teachers', 'students', 'subjects'];
    
    for (const type of order) {
        const file = files.find(f => f.type === type);
        if (file) results[type] = await importType(type, file.rows, existingCodes);
    }

    let totalCreated = 0, totalUpdated = 0, totalFailed = 0;
    for (const result of Object.values(results)) {
        if (result) {
            totalCreated += result.stats.created;
            totalUpdated += result.stats.updated;
            totalFailed += result.stats.failed;
        }
    }

    return { ...results, totalDuration: Date.now() - startTime, summary: { totalCreated, totalUpdated, totalFailed } };
}

// --- Getters ---

export function getSchools(): SchoolImport[] { return Array.from(mockData.schools.values()); }
export function getClasses(): ClassImport[] { return Array.from(mockData.classes.values()); }
export function getTeachers(): TeacherImport[] { return Array.from(mockData.teachers.values()); }
export function getStudents(): any[] { return Array.from(mockData.students.values()); }
export function getSubjects(): SubjectImport[] { return Array.from(mockData.subjects.values()); }
