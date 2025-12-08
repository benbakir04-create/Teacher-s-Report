/**
 * Template Service
 * 
 * Generates Excel/CSV import templates with versioning, hints, and prefill support.
 * Phase 11.5: Export Templates Feature
 */

import * as XLSX from 'xlsx';
import { ImportType, IMPORT_SCHEMAS, EXCEL_HEADERS } from '../types/import.types';
import { getSchools, getClasses, getTeachers } from './importService';

// Current template version - increment when schema changes
export const TEMPLATE_VERSION = '1.0.0';

// --- Template Definitions ---

interface TemplateDefinition {
    headers: string[];
    headersAr: string[];
    hints: string[];
    example: (string | number)[];
}

const TEMPLATES: Record<ImportType, TemplateDefinition> = {
    schools: {
        headers: ['school_code', 'name_ar', 'level', 'region', 'principal', 'phone', 'email'],
        headersAr: ['رمز المدرسة', 'اسم المدرسة', 'المرحلة', 'المنطقة', 'مدير المدرسة', 'الهاتف', 'البريد الإلكتروني'],
        hints: [
            'مطلوب - رمز فريد (مثل: SCH001)',
            'مطلوب - الاسم بالعربية',
            'مطلوب - القيم: primary, intermediate, secondary, combined',
            'مطلوب - اسم المنطقة',
            'اختياري - اسم المدير',
            'اختياري - رقم الهاتف',
            'اختياري - البريد الإلكتروني'
        ],
        example: ['SCH001', 'مدرسة النور الابتدائية', 'primary', 'الرياض', 'أ. فاطمة محمد', '0500000000', 'school@example.com']
    },
    classes: {
        headers: ['class_code', 'school_code', 'grade', 'division', 'capacity'],
        headersAr: ['رمز الفصل', 'رمز المدرسة', 'الصف', 'الشعبة', 'السعة'],
        hints: [
            'مطلوب - رمز فريد (مثل: CLS-SCH001-1A)',
            'مطلوب - رمز المدرسة (راجع ورقة school_codes)',
            'مطلوب - اسم الصف',
            'مطلوب - اسم الشعبة (أ، ب، ج...)',
            'اختياري - عدد الطلاب الأقصى'
        ],
        example: ['CLS-SCH001-1A', 'SCH001', 'الخامس', 'أ', 30]
    },
    teachers: {
        headers: ['teacher_code', 'teacher_name', 'national_id', 'phone', 'email', 'school_code'],
        headersAr: ['رمز المعلم', 'اسم المعلم', 'رقم الهوية', 'الهاتف', 'البريد الإلكتروني', 'رمز المدرسة'],
        hints: [
            'مطلوب - رمز فريد (مثل: TCH001)',
            'مطلوب - الاسم الكامل بالعربية',
            'اختياري - رقم الهوية الوطنية',
            'اختياري - رقم الجوال',
            'اختياري - البريد الإلكتروني',
            'مطلوب - رمز المدرسة (راجع ورقة school_codes)'
        ],
        example: ['TCH001', 'أحمد بن محمد العلي', '1010101010', '0550000000', 'teacher@example.com', 'SCH001']
    },
    students: {
        headers: ['student_code', 'student_name', 'student_national_id', 'class_code', 'guardian_code', 'guardian_name', 'relationship', 'guardian_phone', 'guardian_email'],
        headersAr: ['رمز الطالب', 'اسم الطالب', 'رقم الهوية', 'رمز الفصل', 'رمز ولي الأمر', 'اسم ولي الأمر', 'صلة القرابة', 'هاتف ولي الأمر', 'بريد ولي الأمر'],
        hints: [
            'مطلوب - رمز فريد (مثل: STD001)',
            'مطلوب - اسم الطالب الثلاثي أو الرباعي',
            'اختياري - رقم الهوية',
            'مطلوب - رمز الفصل (راجع ورقة class_codes)',
            'مطلوب - رمز ولي الأمر (للربط بين الإخوة)',
            'مطلوب - اسم ولي الأمر',
            'مطلوب - القيم: father, mother, guardian, other',
            'مطلوب - رقم جوال ولي الأمر',
            'اختياري - بريد ولي الأمر'
        ],
        example: ['STD001', 'محمد بن عبدالرحمن بن سعد', '2002002000', 'CLS-SCH001-1A', 'GRD001', 'عبدالرحمن بن سعد', 'father', '0550001111', 'parent@example.com']
    },
    subjects: {
        headers: ['subject_code', 'name', 'level', 'description', 'teacher_code'],
        headersAr: ['رمز المادة', 'اسم المادة', 'المرحلة', 'الوصف', 'رمز المعلم'],
        hints: [
            'مطلوب - رمز فريد (مثل: SUB001)',
            'مطلوب - اسم المادة بالعربية',
            'اختياري - المرحلة الدراسية',
            'اختياري - وصف المادة',
            'اختياري - رمز المعلم (راجع ورقة teacher_codes)'
        ],
        example: ['SUB001', 'الرياضيات', 'الابتدائي', 'مادة الحساب والجبر', 'TCH001']
    }
};

// --- Prefill Data Fetching ---

export interface PrefillData {
    school_codes?: string[];
    class_codes?: string[];
    teacher_codes?: string[];
}

export function getPrefillData(): PrefillData {
    return {
        school_codes: getSchools().map(s => s.school_code),
        class_codes: getClasses().map(c => c.class_code),
        teacher_codes: getTeachers().map(t => t.teacher_code)
    };
}

// --- Template Generation ---

export interface TemplateOptions {
    prefill?: boolean;
    includeExample?: boolean;
    useArabicHeaders?: boolean;
    format?: 'xlsx' | 'csv';
}

export function generateTemplate(
    entityType: ImportType, 
    options: TemplateOptions = {}
): Blob {
    const { 
        prefill = false, 
        includeExample = true, 
        useArabicHeaders = true,
        format = 'xlsx'
    } = options;

    const template = TEMPLATES[entityType];
    if (!template) throw new Error(`Unknown entity type: ${entityType}`);

    const rows: (string | number)[][] = [];

    // Row 0: Version marker (hidden info)
    rows.push([`_template_version:${TEMPLATE_VERSION}`, `_entity:${entityType}`, '', '', '', '', '', '', '']);

    // Row 1: Headers (Arabic or English)
    rows.push(useArabicHeaders ? template.headersAr : template.headers);

    // Row 2: Hints/Instructions
    rows.push(template.hints);

    // Row 3: Example (optional)
    if (includeExample) {
        rows.push(template.example);
    }

    // Empty rows for user data
    for (let i = 0; i < 10; i++) {
        rows.push(template.headers.map(() => ''));
    }

    const wb = XLSX.utils.book_new();
    
    // Set workbook properties
    wb.Props = {
        Title: `${entityType}_import_template`,
        Subject: 'Import Template',
        Author: 'Teacher Report App',
        Comments: `Template Version: ${TEMPLATE_VERSION}`,
        CreatedDate: new Date()
    };

    // Main data sheet
    const ws = XLSX.utils.aoa_to_sheet(rows);
    
    // Style hint row (gray background would be nice, but xlsx doesn't support styling easily)
    // Set column widths
    ws['!cols'] = template.headers.map(() => ({ wch: 25 }));

    XLSX.utils.book_append_sheet(wb, ws, entityType);

    // Add prefill reference sheets
    if (prefill) {
        const prefillData = getPrefillData();

        // School codes sheet
        if (prefillData.school_codes && prefillData.school_codes.length > 0) {
            const schoolCodesData = [['school_code', 'الرمز المتاح'], ...prefillData.school_codes.map(c => [c, '✓'])];
            const wsSchools = XLSX.utils.aoa_to_sheet(schoolCodesData);
            XLSX.utils.book_append_sheet(wb, wsSchools, 'school_codes');
        }

        // Class codes sheet
        if (prefillData.class_codes && prefillData.class_codes.length > 0) {
            const classCodesData = [['class_code', 'الرمز المتاح'], ...prefillData.class_codes.map(c => [c, '✓'])];
            const wsClasses = XLSX.utils.aoa_to_sheet(classCodesData);
            XLSX.utils.book_append_sheet(wb, wsClasses, 'class_codes');
        }

        // Teacher codes sheet
        if (prefillData.teacher_codes && prefillData.teacher_codes.length > 0) {
            const teacherCodesData = [['teacher_code', 'الرمز المتاح'], ...prefillData.teacher_codes.map(c => [c, '✓'])];
            const wsTeachers = XLSX.utils.aoa_to_sheet(teacherCodesData);
            XLSX.utils.book_append_sheet(wb, wsTeachers, 'teacher_codes');
        }
    }

    if (format === 'csv') {
        // Generate CSV with UTF-8 BOM for Arabic support
        const csvContent = XLSX.utils.sheet_to_csv(ws);
        const BOM = '\uFEFF';
        return new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
    }

    // Generate XLSX
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function downloadTemplate(
    entityType: ImportType, 
    options: TemplateOptions = {}
): void {
    const blob = generateTemplate(entityType, options);
    const ext = options.format === 'csv' ? 'csv' : 'xlsx';
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entityType}_import_template.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function downloadAllTemplates(options: TemplateOptions = {}): void {
    const types: ImportType[] = ['schools', 'classes', 'teachers', 'students', 'subjects'];
    
    types.forEach((type, index) => {
        // Stagger downloads to avoid browser blocking
        setTimeout(() => {
            downloadTemplate(type, options);
        }, index * 500);
    });
}

// --- Bulk ZIP Download ---

export async function generateAllTemplatesAsZip(
    entities: ImportType[] = ['schools', 'classes', 'teachers', 'students', 'subjects'],
    options: TemplateOptions = {}
): Promise<Blob> {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    for (const entity of entities) {
        const blob = generateTemplate(entity, options);
        const ext = options.format === 'csv' ? 'csv' : 'xlsx';
        const fileName = `${entity}_import_template.${ext}`;
        zip.file(fileName, blob);
    }

    return zip.generateAsync({ type: 'blob' });
}

export async function downloadAllTemplatesAsZip(
    entities: ImportType[] = ['schools', 'classes', 'teachers', 'students', 'subjects'],
    options: TemplateOptions = {}
): Promise<void> {
    const zipBlob = await generateAllTemplatesAsZip(entities, options);
    
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `import_templates_v${TEMPLATE_VERSION}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// --- Template Version Validation ---

export interface TemplateValidation {
    isValid: boolean;
    detectedVersion: string | null;
    detectedEntity: string | null;
    warnings: string[];
}

export async function validateTemplateVersion(file: File): Promise<TemplateValidation> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const firstCell = firstSheet['A1']?.v?.toString() || '';
                
                let detectedVersion: string | null = null;
                let detectedEntity: string | null = null;
                const warnings: string[] = [];

                // Parse version from first cell
                if (firstCell.startsWith('_template_version:')) {
                    const parts = firstCell.split(':');
                    detectedVersion = parts[1] || null;
                }

                // Parse entity from B1
                const secondCell = firstSheet['B1']?.v?.toString() || '';
                if (secondCell.startsWith('_entity:')) {
                    detectedEntity = secondCell.split(':')[1] || null;
                }

                // Check version compatibility
                if (!detectedVersion) {
                    warnings.push('لم يتم اكتشاف إصدار القالب. قد يكون الملف غير متوافق.');
                } else if (detectedVersion !== TEMPLATE_VERSION) {
                    warnings.push(`إصدار القالب (${detectedVersion}) مختلف عن الإصدار الحالي (${TEMPLATE_VERSION}). يُنصح بتحميل قالب جديد.`);
                }

                // Check workbook properties
                if (workbook.Props?.Comments && !workbook.Props.Comments.includes(TEMPLATE_VERSION)) {
                    warnings.push('قد يكون هذا قالب قديم. يُفضل استخدام القوالب الرسمية.');
                }

                resolve({
                    isValid: warnings.length === 0,
                    detectedVersion,
                    detectedEntity,
                    warnings
                });
            } catch (err) {
                resolve({
                    isValid: false,
                    detectedVersion: null,
                    detectedEntity: null,
                    warnings: ['فشل قراءة معلومات القالب']
                });
            }
        };

        reader.onerror = () => {
            resolve({
                isValid: false,
                detectedVersion: null,
                detectedEntity: null,
                warnings: ['فشل قراءة الملف']
            });
        };

        reader.readAsArrayBuffer(file);
    });
}

// --- Export Types for UI ---

export const TEMPLATE_ENTITIES: { type: ImportType; label: string; description: string }[] = [
    { type: 'schools', label: 'المدارس', description: 'بيانات المدارس الأساسية' },
    { type: 'classes', label: 'الفصول', description: 'الفصول الدراسية وربطها بالمدارس' },
    { type: 'teachers', label: 'المعلمين', description: 'بيانات المعلمين' },
    { type: 'students', label: 'الطلاب وأولياء الأمور', description: 'الطلاب مع بيانات أولياء الأمور' },
    { type: 'subjects', label: 'المواد', description: 'المواد الدراسية' }
];
