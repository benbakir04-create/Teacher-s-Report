/**
 * Data Manager
 * 
 * يدير تحميل البيانات من Google Sheets أو Fallback إلى MOCK_DATA
 */

import { loadAllData } from './services/googleSheetsService';
import { MOCK_DATA } from './constants';
import type { ListData } from './types';

let cachedData: ListData | null = null;
let isLoading = false;

/**
 * تحميل البيانات من Google Sheets
 */
export async function loadData(): Promise<ListData> {
  // إرجاع البيانات المخزنة إذا كانت موجودة
  if (cachedData) {
    return cachedData;
  }
  
  // منع تحميل متعدد
  if (isLoading) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (cachedData) {
          clearInterval(checkInterval);
          resolve(cachedData);
        }
      }, 100);
    });
  }
  
  isLoading = true;
  
  try {
    const sheetsData = await loadAllData();
    
    // تحويل البيانات من Sheets إلى تنسيق ListData
    cachedData = {
      schools: sheetsData.config.schools || MOCK_DATA.schools,
      levels: sheetsData.config.levels || MOCK_DATA.levels,
      sections: sheetsData.config.sections || MOCK_DATA.sections,
      subjects: sheetsData.subjects || MOCK_DATA.subjects,
      lessons: transformLessons(sheetsData.lessons) || MOCK_DATA.lessons,
      strategies: sheetsData.config.strategies || MOCK_DATA.strategies,
      tools: sheetsData.config.tools || MOCK_DATA.tools,
      tasks: sheetsData.config.tasks || MOCK_DATA.tasks
    };
    
    console.log('Data loaded from Google Sheets successfully');
    return cachedData;
    
  } catch (error) {
    console.error('Failed to load from Google Sheets, using MOCK_DATA:', error);
    cachedData = MOCK_DATA;
    return cachedData;
  } finally {
    isLoading = false;
  }
}

/**
 * تحويل الدروس من تنسيق Sheets إلى تنسيق التطبيق
 */
/**
 * تحويل الدروس من تنسيق Sheets إلى تنسيق التطبيق
 * الهيكل الجديد: { [level: string]: { [subject: string]: { title: string; gender?: string }[] } }
 */
function transformLessons(sheetsLessons: any): any {
  // نعيد الهيكل كما هو لأنه أصبح معقداً ويحتوي على المستوى
  return sheetsLessons;
}

/**
 * الحصول على دروس مع فلترة حسب المستوى والمادة والجنس
 */
export function getLessonsForSubject(
  subject: string,
  level?: string,
  gender?: string
): string[] {
  if (!cachedData || !level) {
    // Fallback بسيط
    return MOCK_DATA.lessons[subject] || [];
  }
  
  // الوصول للدروس حسب المستوى والمادة
  const levelLessons = cachedData.lessons[level];
  if (!levelLessons) return [];
  
  const subjectLessons = levelLessons[subject];
  if (!subjectLessons) return [];
  
  // التحقق من الحاجة للفلترة حسب الجنس
  // القاعدة: الرابعة متوسط + فقه (أو يحتوي على فقه)
  const isFourthGrade = level.includes('الرابعة') && level.includes('متوسط');
  const isFiqh = subject.includes('فقه');
  const needsGenderFilter = isFourthGrade && isFiqh;
  
  if (needsGenderFilter) {
    if (!gender) return []; // إذا كان الجنس مطلوباً ولم يحدد، لا نعرض دروساً
    
    return subjectLessons
      .filter((l: any) => !l.gender || l.gender === gender)
      .map((l: any) => l.title);
  }
  
  // إذا لم يكن هناك فلترة جنس، نعرض كل الدروس
  return subjectLessons.map((l: any) => l.title);
}

/**
 * إعادة تحميل البيانات
 */
export async function reloadData(): Promise<ListData> {
  cachedData = null;
  return await loadData();
}

/**
 * الحصول على البيانات المخزنة (بدون تحميل)
 */
export function getCachedData(): ListData {
  return cachedData || MOCK_DATA;
}
