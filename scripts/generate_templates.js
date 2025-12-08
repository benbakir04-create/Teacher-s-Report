/**
 * Generate Import Templates
 * 
 * Script to generate all import template files for offline use.
 * Run with: node scripts/generate_templates.js
 */

import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_VERSION = "1";

const outputDir = path.join(__dirname, "..", "templates", "import");
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Template definitions
const templates = {
    schools: {
        headers: [
            "school_code",
            "name_ar",
            "level",
            "region",
            "principal",
            "phone",
            "email",
            "_template_version"
        ],
        hints: [
            "حقل فريد (SCH001...) - مطلوب",
            "اسم المدرسة بالعربية - مطلوب",
            "المرحلة: primary/intermediate/secondary/combined - مطلوب",
            "المنطقة - مطلوب",
            "اسم المدير - اختياري",
            "رقم الهاتف - اختياري",
            "البريد الإلكتروني - اختياري",
            TEMPLATE_VERSION
        ],
        example: [
            "SCH001",
            "مدرسة النور الابتدائية",
            "primary",
            "الرياض",
            "أ. فاطمة محمد",
            "0500000000",
            "school@example.com",
            TEMPLATE_VERSION
        ]
    },
    classes: {
        headers: [
            "class_code",
            "school_code",
            "grade",
            "division",
            "capacity",
            "_template_version"
        ],
        hints: [
            "حقل فريد (CLS-SCH001-1A) - مطلوب",
            "رمز المدرسة (راجع ورقة school_codes) - مطلوب",
            "الصف - مطلوب",
            "الشعبة (أ، ب، ج...) - مطلوب",
            "السعة القصوى - اختياري",
            TEMPLATE_VERSION
        ],
        example: [
            "CLS-SCH001-1A",
            "SCH001",
            "الخامس",
            "أ",
            "30",
            TEMPLATE_VERSION
        ]
    },
    teachers: {
        headers: [
            "teacher_code",
            "teacher_name",
            "national_id",
            "phone",
            "email",
            "school_code",
            "_template_version"
        ],
        hints: [
            "حقل فريد (TCH001...) - مطلوب",
            "الاسم الكامل بالعربية - مطلوب",
            "رقم الهوية الوطنية - اختياري",
            "رقم الجوال - اختياري",
            "البريد الإلكتروني - اختياري",
            "رمز المدرسة - مطلوب",
            TEMPLATE_VERSION
        ],
        example: [
            "TCH001",
            "أحمد بن محمد العلي",
            "1010101010",
            "0550000000",
            "teacher@example.com",
            "SCH001",
            TEMPLATE_VERSION
        ]
    },
    students_guardians: {
        headers: [
            "student_code",
            "student_name",
            "student_national_id",
            "class_code",
            "guardian_code",
            "guardian_name",
            "relationship",
            "guardian_phone",
            "guardian_email",
            "_template_version"
        ],
        hints: [
            "حقل فريد (S001...) - مطلوب",
            "الاسم الكامل: المعني + الأب + الجد - مطلوب",
            "رقم الهوية - اختياري",
            "رمز الفصل (راجع ورقة class_codes) - مطلوب",
            "رمز ولي الأمر (G001...) - مطلوب",
            "اسم ولي الأمر - مطلوب",
            "صلة القرابة: father/mother/guardian/other - مطلوب",
            "رقم جوال ولي الأمر - مطلوب",
            "بريد ولي الأمر - اختياري",
            TEMPLATE_VERSION
        ],
        example: [
            "S001",
            "محمد بن عبدالله بن سالم",
            "2002002000",
            "CLS-SCH001-1A",
            "G001",
            "عبدالله بن سالم",
            "father",
            "0550001111",
            "parent@example.com",
            TEMPLATE_VERSION
        ]
    },
    subjects: {
        headers: [
            "subject_code",
            "name",
            "level",
            "description",
            "teacher_code",
            "_template_version"
        ],
        hints: [
            "حقل فريد (SUB001...) - مطلوب",
            "اسم المادة بالعربية - مطلوب",
            "المرحلة الدراسية - اختياري",
            "وصف المادة - اختياري",
            "رمز المعلم (راجع ورقة teacher_codes) - اختياري",
            TEMPLATE_VERSION
        ],
        example: [
            "SUB001",
            "الرياضيات",
            "الابتدائي",
            "مادة الحساب والجبر",
            "TCH001",
            TEMPLATE_VERSION
        ]
    }
};

// Generate each template
Object.entries(templates).forEach(([name, template]) => {
    const wb = XLSX.utils.book_new();
    
    // Set workbook properties
    wb.Props = {
        Title: `${name}_import_template`,
        Subject: "Import Template",
        Author: "Teacher Report App",
        Comments: `Template Version: ${TEMPLATE_VERSION}`,
        CreatedDate: new Date()
    };

    // Create main sheet
    const data = [
        template.headers,
        template.hints,
        template.example,
        // Add 10 empty rows for data entry
        ...Array(10).fill(template.headers.map(() => ""))
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths
    ws["!cols"] = template.headers.map(() => ({ wch: 25 }));
    
    XLSX.utils.book_append_sheet(wb, ws, name.replace("_guardians", ""));

    // Write file
    const fileName = `${name}.template_v${TEMPLATE_VERSION}.xlsx`;
    const filePath = path.join(outputDir, fileName);
    XLSX.writeFile(wb, filePath);
    console.log(`✓ Generated: ${fileName}`);
});

// Generate CSV versions with BOM
Object.entries(templates).forEach(([name, template]) => {
    const BOM = "\uFEFF";
    const rows = [
        template.headers.join(","),
        template.hints.join(","),
        template.example.join(",")
    ];
    const csvContent = BOM + rows.join("\n");
    
    const fileName = `${name}.template_v${TEMPLATE_VERSION}.csv`;
    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(filePath, csvContent, "utf-8");
    console.log(`✓ Generated: ${fileName}`);
});

console.log(`\n✅ All templates generated in: ${outputDir}`);
