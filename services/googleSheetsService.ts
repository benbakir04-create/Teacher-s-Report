/// <reference types="vite/client" />
/**
 * Google Sheets API Service
 * 
 * يوفر وظائف للتعامل مع Google Sheets API
 * - قراءة البيانات من الأوراق
 * - كتابة التقارير
 * - النسخ الاحتياطي
 * - تسجيل الأخطاء
 */

// تكوين Google Sheets
const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * قراءة البيانات من نطاق محدد في الورقة
 */
export async function readSheetRange(range: string): Promise<any[][]> {
  try {
    const url = `${BASE_URL}/${SHEET_ID}/values/${range}?key=${API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to read sheet: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error('Error reading sheet:', error);
    throw error;
  }
}

/**
 * كتابة البيانات إلى نطاق محدد في الورقة
 * ملاحظة: يتطلب OAuth token، ليس API Key
 */
export async function appendToSheet(range: string, values: any[][]): Promise<void> {
  try {
    // للكتابة، نحتاج OAuth token
    // سنستخدم طريقة بديلة عبر Google Apps Script Web App
    const webAppUrl = import.meta.env.VITE_GOOGLE_WEBAPP_URL;
    
    if (!webAppUrl) {
      // Fallback: حفظ محلياً فقط
      console.warn('No Web App URL configured, saving locally only');
      return;
    }
    
    const fetchOptions = {
      method: 'POST',
      mode: 'cors' as RequestMode,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'appendToSheet',
        range,
        values
      })
    };
    console.log('Sending request with options:', fetchOptions);

    const response = await fetch(webAppUrl, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`Failed to append to sheet: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error appending to sheet:', error);
    throw error;
  }
}

/**
 * قراءة ورقة "Config" وتحويلها إلى كائن
 */
/**
 * قراءة البيانات من نطاق محدد في الورقة
 * يحاول القراءة بالاسم العربي أولاً، ثم الإنجليزي
 */
async function readSheetRangeWithFallback(arabicRange: string, englishRange: string): Promise<any[][]> {
  try {
    // المحاولة الأولى: الاسم العربي
    return await readSheetRange(arabicRange);
  } catch (error) {
    console.warn(`Failed to read Arabic range ${arabicRange}, trying English ${englishRange}`);
    try {
      // المحاولة الثانية: الاسم الإنجليزي
      return await readSheetRange(englishRange);
    } catch (secondError) {
      console.error(`Failed to read both ranges: ${arabicRange} and ${englishRange}`);
      throw secondError;
    }
  }
}

/**
 * قراءة ورقة "Config" وتحويلها إلى كائن
 */
export async function readConfig() {
  try {
    const values = await readSheetRangeWithFallback('الإعدادات!A2:B', 'Config!A2:B');
    
    const config: { [key: string]: string[] } = {
      schools: [],
      levels: [],
      sections: [],
      strategies: [],
      tools: [],
      tasks: []
    };
    
    // خريطة لترجمة المفاتيح العربية إلى الإنجليزية
    const keyMap: { [key: string]: string } = {
      // Schools
      'المدارس': 'schools', 'مدرسة': 'schools', 'المدرسة': 'schools', 'schools': 'schools',
      // Levels
      'المراحل': 'levels', 'المستوى': 'levels', 'levels': 'levels', 'الصفوف': 'levels',
      // Sections
      'الأقسام': 'sections', 'القسم': 'sections', 'الشعب': 'sections', 'معرف القسم': 'sections', 'sections': 'sections',
      // Strategies
      'الاستراتيجيات': 'strategies', 'استراتيجية': 'strategies', 'استراتيجيات التدريس': 'strategies', 'strategies': 'strategies',
      // Tools
      'الوسائل': 'tools', 'وسيلة': 'tools', 'الوسائل التعليمية': 'tools', 'tools': 'tools',
      // Tasks
      'المهام': 'tasks', 'مهمة': 'tasks', 'المهام المنجزة': 'tasks', 'tasks': 'tasks'
    };
    
    values.forEach(row => {
      const [type, value] = row;
      if (type && value) {
        const cleanType = type.toString().trim();
        // البحث عن المفتاح المناسب (سواء كان عربياً أو إنجليزياً)
        const mappedKey = keyMap[cleanType] || keyMap[cleanType.toLowerCase()] || cleanType.toLowerCase();
        
        if (config[mappedKey]) {
          config[mappedKey].push(value.toString().trim());
        } else {
          // إذا لم نجد مفتاحاً معروفاً، نضيفه كما هو (للمرونة)
          if (!config[cleanType]) config[cleanType] = [];
          config[cleanType].push(value.toString().trim());
        }
      }
    });
    
    return config;
  } catch (error) {
    console.error('Error reading config:', error);
    return getDefaultConfig();
  }
}

/**
 * قراءة ورقة "Subjects" وتحويلها إلى كائن
 */
export async function readSubjects() {
  try {
    const values = await readSheetRangeWithFallback('المواد!A2:B', 'Subjects!A2:B');
    
    const subjects: { [level: string]: string[] } = {};
    
    values.forEach(row => {
      const [level, subject] = row;
      if (level && subject) {
        const levelKey = level.toString().trim();
        if (!subjects[levelKey]) subjects[levelKey] = [];
        subjects[levelKey].push(subject.toString().trim());
      }
    });
    
    return subjects;
  } catch (error) {
    console.error('Error reading subjects:', error);
    return {};
  }
}

/**
 * قراءة ورقة "Lessons" وتحويلها إلى كائن
 */
/**
 * قراءة ورقة "Lessons" وتحويلها إلى كائن
 * الهيكل الجديد: المستوى | المادة | الجنس | الدرس
 */
export async function readLessons() {
  try {
    // نقرأ 4 أعمدة الآن: المستوى، المادة، الجنس، الدرس
    const values = await readSheetRangeWithFallback('الدروس!A2:D', 'Lessons!A2:D');
    
    // الهيكل الجديد: { [level: string]: { [subject: string]: { title: string; gender?: string }[] } }
    const lessons: { [level: string]: { [subject: string]: { title: string; gender?: string }[] } } = {};
    
    values.forEach(row => {
      const [level, subject, gender, lesson] = row; // الترتيب الجديد: المستوى، المادة، الجنس، الدرس
      if (level && subject && lesson) {
        const levelKey = level.toString().trim();
        const subjectKey = subject.toString().trim();
        
        if (!lessons[levelKey]) lessons[levelKey] = {};
        if (!lessons[levelKey][subjectKey]) lessons[levelKey][subjectKey] = [];
        
        lessons[levelKey][subjectKey].push({
          title: lesson.toString().trim(),
          gender: gender ? gender.toString().trim() : undefined
        });
      }
    });
    
    return lessons;
  } catch (error) {
    console.error('Error reading lessons:', error);
    return {};
  }
}

/**
 * تحميل جميع البيانات من Google Sheets
 */
export async function loadAllData() {
  if (!SHEET_ID || !API_KEY) {
    console.warn('Missing Google Sheets credentials');
    throw new Error('Missing credentials');
  }

  try {
    const [config, subjects, lessons] = await Promise.all([
      readConfig(),
      readSubjects(),
      readLessons()
    ]);
    
    return {
      config,
      subjects,
      lessons
    };
  } catch (error) {
    console.error('Error loading all data:', error);
    throw error;
  }
}

/**
 * حفظ تقرير في ورقة "Reports"
 */
export async function saveReport(report: any): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    
    // الترتيب الجديد للأعمدة: الجنس يأتي بعد المادة مباشرة
    const row = [
      timestamp,
      report.general.id,
      report.general.name,
      report.general.school,
      report.general.level,
      report.general.sectionId,
      report.general.date,
      report.quranReport || '',
      // الحصة الأولى
      report.firstClass.subject || '',
      report.firstClass.gender || '', // الجنس هنا
      report.firstClass.lesson || '',
      report.firstClass.strategies.join('، ') || '',
      report.firstClass.tools.join('، ') || '',
      report.firstClass.tasks.join('، ') || '',
      // الحصة الثانية
      report.hasSecondClass ? 'نعم' : 'لا',
      report.secondClass.subject || '',
      report.secondClass.gender || '', // الجنس هنا
      report.secondClass.lesson || '',
      report.secondClass.strategies.join('، ') || '',
      report.secondClass.tools.join('، ') || '',
      report.secondClass.tasks.join('، ') || '',
      report.notes || ''
    ];
    
    await appendToSheet('التقارير!A:V', [row]);
  } catch (error) {
    console.error('Error saving report:', error);
    throw error;
  }
}

/**
 * حفظ نسخة احتياطية
 */
export async function saveBackup(data: any): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const row = [timestamp, JSON.stringify(data)];
    
    await appendToSheet('النسخ_الاحتياطي!A:B', [row]);
  } catch (error) {
    console.error('Error saving backup:', error);
    // لا نريد أن يفشل الحفظ بسبب فشل النسخة الاحتياطية
  }
}

/**
 * تسجيل خطأ
 */
export async function logError(context: string, error: any): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const row = [timestamp, context, errorMessage];
    
    await appendToSheet('الأخطاء!A:C', [row]);
  } catch (err) {
    console.error('Error logging error:', err);
  }
}

/**
 * الإعدادات الافتراضية في حالة فشل القراءة
 */
function getDefaultConfig() {
  return {
    schools: [
      "المدرسة القرآنية 1",
      "المدرسة القرآنية 2",
      "المدرسة القرآنية 3"
    ],
    levels: [
      "التحضيري",
      "الأولى ابتدائية",
      "الثانية ابتدائية",
      "الثالثة ابتدائية",
      "الرابعة ابتدائية",
      "الخامسة ابتدائية",
      "الأولى متوسطة",
      "الثانية متوسطة",
      "الثالثة متوسطة",
      "الرابعة متوسطة",
      "الأولى ثانوية",
      "الثانية ثانوية",
      "قسم القرآن"
    ],
    sections: ["أ", "ب", "ج", "د", "هـ"],
    strategies: [
      "الإلقاء ( الشرح والمناقشة)",
      "حل المشكلات",
      "التعليم التعاوني",
      "التعلّم باللعب",
      "التعلم النشط",
      "التدريس العكسي",
      "العصف الذهني",
      "التعليم الإلكتروني"
    ],
    tools: [
      "الكتاب المدرسي",
      "السبورة",
      "عرض تقديمي (باور بونت)",
      "عرض فيديو",
      "آخر"
    ],
    tasks: [
      "كتابة الدرس",
      "إنجاز تقاويم الكتاب بالقسم",
      "عمل منزلي",
      "مراجعة",
      "نشاط",
      "آخر"
    ]
  };
}
