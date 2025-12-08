/**
 * Template API Routes
 * 
 * Server-side endpoints for template generation with DB prefill.
 * These can be deployed as Supabase Edge Functions or Express routes.
 * 
 * Endpoints:
 *   GET /api/templates/:entity?prefill=1&format=xlsx
 *   POST /api/templates/bulk
 */

import * as XLSX from 'xlsx';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { ImportType, IMPORT_SCHEMAS } from '../types/import.types';
import { TEMPLATE_VERSION } from './templateService';

// --- Types ---

interface TemplateRequestParams {
    entity: ImportType;
    prefill?: boolean;
    format?: 'xlsx' | 'csv';
}

interface PrefillDataFromDB {
    school_codes: string[];
    class_codes: string[];
    teacher_codes: string[];
}

// --- Template Definitions ---

const TEMPLATES: Record<ImportType, { headers: string[]; hints: string[]; example: (string | number)[] }> = {
    schools: {
        headers: ['school_code', 'name_ar', 'level', 'region', 'principal', 'phone', 'email', '_template_version'],
        hints: ['حقل فريد - مطلوب', 'اسم المدرسة - مطلوب', 'primary/intermediate/secondary/combined', 'المنطقة - مطلوب', 'اختياري', 'اختياري', 'اختياري', TEMPLATE_VERSION],
        example: ['SCH001', 'مدرسة النور', 'primary', 'الرياض', 'أ. فاطمة', '0500000000', 'school@example.com', TEMPLATE_VERSION]
    },
    classes: {
        headers: ['class_code', 'school_code', 'grade', 'division', 'capacity', '_template_version'],
        hints: ['حقل فريد - مطلوب', 'FK → schools - مطلوب', 'الصف - مطلوب', 'الشعبة - مطلوب', 'اختياري', TEMPLATE_VERSION],
        example: ['CLS-001', 'SCH001', 'الخامس', 'أ', '30', TEMPLATE_VERSION]
    },
    teachers: {
        headers: ['teacher_code', 'teacher_name', 'national_id', 'phone', 'email', 'school_code', '_template_version'],
        hints: ['حقل فريد - مطلوب', 'الاسم - مطلوب', 'اختياري', 'اختياري', 'اختياري', 'FK → schools - مطلوب', TEMPLATE_VERSION],
        example: ['TCH001', 'أحمد محمد', '1010101010', '0550000000', 't@example.com', 'SCH001', TEMPLATE_VERSION]
    },
    students: {
        headers: ['student_code', 'student_name', 'student_national_id', 'class_code', 'guardian_code', 'guardian_name', 'relationship', 'guardian_phone', 'guardian_email', '_template_version'],
        hints: ['حقل فريد', 'الاسم الكامل', 'اختياري', 'FK → classes', 'حقل فريد', 'اسم الولي', 'father/mother/guardian/other', 'رقم الجوال', 'اختياري', TEMPLATE_VERSION],
        example: ['S001', 'محمد عبدالله سالم', '2002002000', 'CLS-001', 'G001', 'عبدالله سالم', 'father', '0550001111', 'p@example.com', TEMPLATE_VERSION]
    },
    subjects: {
        headers: ['subject_code', 'name', 'level', 'description', 'teacher_code', '_template_version'],
        hints: ['حقل فريد', 'اسم المادة', 'اختياري', 'اختياري', 'FK → teachers (اختياري)', TEMPLATE_VERSION],
        example: ['SUB001', 'الرياضيات', 'الابتدائي', 'مادة الحساب', 'TCH001', TEMPLATE_VERSION]
    }
};

// --- Prefill Data Fetching ---

async function fetchPrefillFromDB(): Promise<PrefillDataFromDB> {
    if (!isSupabaseConfigured() || !supabase) {
        return { school_codes: [], class_codes: [], teacher_codes: [] };
    }

    try {
        const [schoolsRes, classesRes, teachersRes] = await Promise.all([
            supabase.from('schools').select('school_code').limit(5000),
            supabase.from('classes').select('class_code').limit(5000),
            supabase.from('teachers').select('teacher_code').limit(5000)
        ]);

        return {
            school_codes: (schoolsRes.data || []).map(r => r.school_code),
            class_codes: (classesRes.data || []).map(r => r.class_code),
            teacher_codes: (teachersRes.data || []).map(r => r.teacher_code)
        };
    } catch (err) {
        console.error('Failed to fetch prefill data:', err);
        return { school_codes: [], class_codes: [], teacher_codes: [] };
    }
}

// --- Template Generation ---

export async function generateTemplateBuffer(
    entity: ImportType,
    options: { prefill?: boolean; format?: 'xlsx' | 'csv' } = {}
): Promise<{ buffer: ArrayBuffer; filename: string; contentType: string }> {
    const template = TEMPLATES[entity];
    if (!template) throw new Error(`Unknown entity: ${entity}`);

    const { prefill = false, format = 'xlsx' } = options;

    // Build workbook
    const wb = XLSX.utils.book_new();
    wb.Props = {
        Title: `${entity}_template`,
        Subject: 'Import Template',
        Author: 'Teacher Report App',
        Comments: `Version: ${TEMPLATE_VERSION}`
    };

    // Main sheet
    const data = [template.headers, template.hints, template.example, ...Array(10).fill(template.headers.map(() => ''))];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = template.headers.map(() => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(wb, ws, entity);

    // Prefill sheets
    if (prefill) {
        const prefillData = await fetchPrefillFromDB();

        if (prefillData.school_codes.length > 0) {
            const wsSchools = XLSX.utils.aoa_to_sheet([['school_code'], ...prefillData.school_codes.map(c => [c])]);
            XLSX.utils.book_append_sheet(wb, wsSchools, 'school_codes');
        }
        if (prefillData.class_codes.length > 0) {
            const wsClasses = XLSX.utils.aoa_to_sheet([['class_code'], ...prefillData.class_codes.map(c => [c])]);
            XLSX.utils.book_append_sheet(wb, wsClasses, 'class_codes');
        }
        if (prefillData.teacher_codes.length > 0) {
            const wsTeachers = XLSX.utils.aoa_to_sheet([['teacher_code'], ...prefillData.teacher_codes.map(c => [c])]);
            XLSX.utils.book_append_sheet(wb, wsTeachers, 'teacher_codes');
        }
    }

    // Generate buffer
    if (format === 'csv') {
        const BOM = '\uFEFF';
        const csvContent = BOM + XLSX.utils.sheet_to_csv(ws);
        const encoder = new TextEncoder();
        return {
            buffer: encoder.encode(csvContent).buffer,
            filename: `${entity}_template_v${TEMPLATE_VERSION}.csv`,
            contentType: 'text/csv; charset=utf-8'
        };
    }

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return {
        buffer: buffer,
        filename: `${entity}_template_v${TEMPLATE_VERSION}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
}

// --- Express/Next.js Route Handlers ---

/**
 * GET /api/templates/:entity
 * Query params: prefill=1, format=xlsx|csv
 */
export async function handleGetTemplate(req: { params: { entity: string }; query: { prefill?: string; format?: string } }): Promise<Response> {
    const { entity } = req.params;
    const prefill = req.query.prefill === '1';
    const format = (req.query.format === 'csv' ? 'csv' : 'xlsx') as 'xlsx' | 'csv';

    if (!TEMPLATES[entity as ImportType]) {
        return new Response(JSON.stringify({ error: 'Invalid entity' }), { status: 400 });
    }

    try {
        const result = await generateTemplateBuffer(entity as ImportType, { prefill, format });

        return new Response(result.buffer, {
            headers: {
                'Content-Type': result.contentType,
                'Content-Disposition': `attachment; filename="${result.filename}"`,
                'X-Template-Version': TEMPLATE_VERSION
            }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Template generation failed' }), { status: 500 });
    }
}

/**
 * POST /api/templates/bulk
 * Body: { entities: string[], prefill: boolean, format: 'xlsx' | 'csv' }
 * Returns: ZIP file with all templates
 */
export async function handleBulkTemplates(req: { body: { entities?: ImportType[]; prefill?: boolean; format?: 'xlsx' | 'csv' } }): Promise<Response> {
    const { entities = ['schools', 'classes', 'teachers', 'students', 'subjects'], prefill = false, format = 'xlsx' } = req.body;

    try {
        // Dynamic import JSZip
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        for (const entity of entities) {
            if (TEMPLATES[entity]) {
                const result = await generateTemplateBuffer(entity, { prefill, format });
                zip.file(result.filename, result.buffer);
            }
        }

        const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

        return new Response(zipBuffer, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="import_templates_v${TEMPLATE_VERSION}.zip"`,
                'X-Template-Version': TEMPLATE_VERSION
            }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Bulk generation failed' }), { status: 500 });
    }
}

// --- Client-side API Wrapper ---

export async function fetchTemplateFromServer(
    entity: ImportType,
    options: { prefill?: boolean; format?: 'xlsx' | 'csv' } = {}
): Promise<Blob> {
    const params = new URLSearchParams();
    if (options.prefill) params.set('prefill', '1');
    if (options.format) params.set('format', options.format);

    const response = await fetch(`/api/templates/${entity}?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch template');

    return response.blob();
}

export async function fetchBulkTemplatesFromServer(
    entities: ImportType[] = ['schools', 'classes', 'teachers', 'students', 'subjects'],
    options: { prefill?: boolean; format?: 'xlsx' | 'csv' } = {}
): Promise<Blob> {
    const response = await fetch('/api/templates/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entities, ...options })
    });

    if (!response.ok) throw new Error('Failed to fetch bulk templates');
    return response.blob();
}
