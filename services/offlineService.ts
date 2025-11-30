/**
 * Offline Sync Service
 * 
 * يدير:
 * - حالة الاتصال بالإنترنت
 * - حفظ البيانات المعلقة
 * - المزامنة التلقائية عند عودة الاتصال
 */

import { saveReport, saveBackup, logError } from './googleSheetsService';

const PENDING_REPORTS_KEY = 'pendingReports';
const USER_DATA_KEY = 'savedUserData';

/**
 * التحقق من حالة الاتصال
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * حفظ تقرير معلق محلياً
 */
export function savePendingReport(report: any): void {
  try {
    const pending = getPendingReports();
    pending.push({
      ...report,
      pendingTimestamp: Date.now()
    });
    localStorage.setItem(PENDING_REPORTS_KEY, JSON.stringify(pending));
  } catch (error) {
    console.error('Error saving pending report:', error);
  }
}

/**
 * جلب التقارير المعلقة
 */
export function getPendingReports(): any[] {
  try {
    const data = localStorage.getItem(PENDING_REPORTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting pending reports:', error);
    return [];
  }
}

/**
 * حذف تقرير معلق
 */
function removePendingReport(timestamp: number): void {
  try {
    const pending = getPendingReports();
    const filtered = pending.filter(r => r.pendingTimestamp !== timestamp);
    localStorage.setItem(PENDING_REPORTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing pending report:', error);
  }
}

/**
 * مزامنة التقارير المعلقة
 */
export async function syncPendingReports(): Promise<void> {
  if (!isOnline()) {
    console.log('Offline, skipping sync');
    return;
  }
  
  const pending = getPendingReports();
  if (pending.length === 0) {
    return;
  }
  
  console.log(`Syncing ${pending.length} pending reports...`);
  
  for (const report of pending) {
    try {
      await saveReport(report);
      await saveBackup(report);
      removePendingReport(report.pendingTimestamp);
      console.log('Synced report successfully');
    } catch (error) {
      console.error('Failed to sync report:', error);
      await logError('syncPendingReports', error);
      // نترك التقرير في قائمة الانتظار ليتم المحاولة لاحقاً
    }
  }
}

/**
 * حفظ بيانات المستخدم الأساسية
 */
export function saveUserData(userData: {
  school: string;
  name: string;
  level: string;
  sectionId: string;
}): void {
  try {
    const dataToSave = {
      ...userData,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
}

/**
 * جلب بيانات المستخدم المحفوظة
 */
export function getSavedUserData(): any | null {
  try {
    const data = localStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting saved user data:', error);
    return null;
  }
}

/**
 * تثبيت مستمعي الأحداث للاتصال
 */
export function setupConnectionListeners(
  onOnline?: () => void,
  onOffline?: () => void
): void {
  window.addEventListener('online', () => {
    console.log('Connection restored');
    syncPendingReports();
    if (onOnline) onOnline();
  });
  
  window.addEventListener('offline', () => {
    console.log('Connection lost');
    if (onOffline) onOffline();
  });
}

/**
 * تثبيت Service Worker
 */
export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('ServiceWorker registered:', registration.scope);
          
          // التحقق من التحديثات
          registration.addEventListener('updatefound', () => {
            console.log('New version available');
          });
        })
        .catch((error) => {
          console.error('ServiceWorker registration failed:', error);
        });
    });
  }
}
