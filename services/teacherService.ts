/**
 * Teacher Service
 * 
 * Handles teacher data management:
 * - Fetching teacher by registration ID
 * - Updating teacher data
 * - Managing email linking
 */

export interface TeacherData {
    registrationId: string;
    name: string;
    school: string;
    level: string;
    section: string;
    email?: string;
    deviceFingerprint?: string;
    emailRequired: boolean; // "نعم" = true, "لا" = false
    firstUseDate?: string;
    linkDate?: string;
}

import { getOrCreateFingerprint } from './deviceService';

const WEBAPP_URL = import.meta.env.VITE_GOOGLE_WEBAPP_URL;

/**
 * Fetch teacher data by registration ID from Google Sheets
 */
export async function fetchTeacherByRegistrationId(registrationId: string): Promise<TeacherData | null> {
    if (!WEBAPP_URL) {
        console.warn('No Web App URL configured');
        return null;
    }

    try {
        const response = await fetch(WEBAPP_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({
                action: 'getTeacherByRegistrationId',
                registrationId
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch teacher: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.success) {
            return null;
        }

        return data.teacher;
    } catch (error) {
        console.error('Error fetching teacher:', error);
        return null;
    }
}

/**
 * Update teacher data (school, level, section)
 */
export async function updateTeacherData(
    registrationId: string,
    updates: {
        school?: string;
        level?: string;
        section?: string;
    }
): Promise<boolean> {
    if (!WEBAPP_URL) {
        console.warn('No Web App URL configured');
        return false;
    }

    try {
        // Get device fingerprint using service (handles JSON parsing correctly)
        const deviceData = getOrCreateFingerprint();
        const storedFingerprint = deviceData.fingerprint;
        
        const response = await fetch(WEBAPP_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({
                action: 'updateTeacherData',
                registrationId,
                updates,
                deviceFingerprint: storedFingerprint || ''
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to update teacher: ${response.statusText}`);
        }

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error updating teacher:', error);
        return false;
    }
}

/**
 * Link teacher account with email and device fingerprint
 */
export async function linkTeacherEmail(
    registrationId: string,
    email: string,
    deviceFingerprint: string
): Promise<boolean> {
    if (!WEBAPP_URL) {
        console.warn('No Web App URL configured');
        return false;
    }

    try {
        const response = await fetch(WEBAPP_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({
                action: 'linkTeacherEmail',
                registrationId,
                email,
                deviceFingerprint
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to link email: ${response.statusText}`);
        }

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error linking email:', error);
        return false;
    }
}

/**
 * Update device fingerprint
 */
export async function updateDeviceFingerprint(
    registrationId: string,
    deviceFingerprint: string
): Promise<boolean> {
    if (!WEBAPP_URL) {
        console.warn('No Web App URL configured');
        return false;
    }

    try {
        const response = await fetch(WEBAPP_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({
                action: 'updateDeviceFingerprint',
                registrationId,
                deviceFingerprint
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to update device: ${response.statusText}`);
        }

    } catch (error) {
        console.error('Error updating device:', error);
        return false;
    }
}

/**
 * Reset device fingerprints (Kill Switch)
 * Keeps only the provided device fingerprint and removes all others
 */
export async function resetDeviceFingerprints(
    registrationId: string,
    currentFingerprint: string
): Promise<{ success: boolean; error?: string }> {
    if (!WEBAPP_URL) {
        console.warn('No Web App URL configured');
        return { success: false, error: 'خطأ في تهيئة التطبيق' };
    }

    try {
        console.log('🔄 Calling resetDeviceFingerprints with:', { registrationId, currentFingerprint: currentFingerprint?.substring(0, 8) + '...' });
        
        const response = await fetch(WEBAPP_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({
                action: 'resetDeviceFingerprints',
                registrationId,
                deviceFingerprint: currentFingerprint
            })
        });

        console.log('📡 Response status:', response.status, response.statusText);

        if (!response.ok) {
            return { success: false, error: `خطأ في الشبكة: ${response.status}` };
        }

        const data = await response.json();
        console.log('📦 Full server response:', JSON.stringify(data));
        
        // Normalize error field
        if (!data.success) {
            const errorMessage = data.error || data.message || 'خطأ غير معروف من السيرفر';
            return { success: false, error: errorMessage };
        }

        return { success: true };
    } catch (error) {
        console.error('❌ Error in resetDeviceFingerprints:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'فشل الاتصال بالسيرفر' 
        };
    }
}

/**
 * Save teacher data to localStorage
 */
export function saveTeacherToLocal(teacher: TeacherData): void {
    localStorage.setItem('teacher_data', JSON.stringify(teacher));
}

/**
 * Get teacher data from localStorage
 */
export function getTeacherFromLocal(): TeacherData | null {
    const stored = localStorage.getItem('teacher_data');
    if (!stored) return null;
    
    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
}

/**
 * Clear teacher data from localStorage
 */
export function clearTeacherData(): void {
    localStorage.removeItem('teacher_data');
}
