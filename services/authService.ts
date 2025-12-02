/**
 * Authentication Service
 * 
 * Handles Google Sign-In and session management
 */

import { generateDeviceFingerprint, getOrCreateFingerprint } from './deviceService';
import { 
    fetchTeacherByRegistrationId, 
    linkTeacherEmail, 
    updateDeviceFingerprint,
    saveTeacherToLocal,
    getTeacherFromLocal,
    clearTeacherData,
    TeacherData
} from './teacherService';

export interface AuthSession {
    teacher: TeacherData;
    deviceFingerprint: string;
    isLinked: boolean;
    daysSinceFirstUse: number;
    needsEmailLink: boolean;
}

/**
 * Login with registration ID
 */
export async function loginWithRegistrationId(registrationId: string): Promise<AuthSession> {
    // Fetch teacher from Google Sheets
    const teacher = await fetchTeacherByRegistrationId(registrationId);
    
    if (!teacher) {
        throw new Error('رقم التسجيل غير موجود. يرجى التأكد من الرقم أو التواصل مع الإدارة');
    }
    
    // Get or create device fingerprint
    const deviceData = getOrCreateFingerprint();
    const currentFingerprint = deviceData.fingerprint;
    
    // Check if teacher has email linked
    const isLinked = !!teacher.email;
    
    // Check device match
    const deviceMatches = teacher.deviceFingerprint === currentFingerprint;
    
    // If email linked but device doesn't match, throw error (requires Google Sign-In)
    if (isLinked && !deviceMatches) {
        throw new Error('DEVICE_MISMATCH');
    }
    
    // Calculate days since first use
    let daysSinceFirstUse = 0;
    if (teacher.firstUseDate) {
        const firstUse = new Date(teacher.firstUseDate);
        const now = new Date();
        daysSinceFirstUse = Math.floor((now.getTime() - firstUse.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    // Update device fingerprint if not set
    if (!teacher.deviceFingerprint) {
        teacher.deviceFingerprint = currentFingerprint;
        await updateDeviceFingerprint(registrationId, currentFingerprint);
    }
    
    // Set first use date if not set
    if (!teacher.firstUseDate) {
        teacher.firstUseDate = new Date().toISOString();
    }
    
    // Save to local storage
    saveTeacherToLocal(teacher);
    
    // Determine if needs email link reminder
    const needsEmailLink = !isLinked && (
        daysSinceFirstUse === 0 || // First use
        (teacher.emailRequired && daysSinceFirstUse >= 14) || // Required and past deadline
        (!teacher.emailRequired && shouldShowDailyReminder()) // Optional daily reminder
    );
    
    return {
        teacher,
        deviceFingerprint: currentFingerprint,
        isLinked,
        daysSinceFirstUse,
        needsEmailLink
    };
}

/**
 * Link teacher account with Google email
 */
export async function linkWithGoogleEmail(googleUser: any): Promise<void> {
    const teacher = getTeacherFromLocal();
    if (!teacher) {
        throw new Error('No teacher session found');
    }
    
    const email = googleUser.email;
    const deviceData = getOrCreateFingerprint();
    
    const success = await linkTeacherEmail(
        teacher.registrationId,
        email,
        deviceData.fingerprint
    );
    
    if (!success) {
        throw new Error('فشل ربط الحساب. يرجى المحاولة مرة أخرى');
    }
    
    // Update local data
    teacher.email = email;
    teacher.linkDate = new Date().toISOString();
    saveTeacherToLocal(teacher);
    
    // Save last reminder dismiss date
    localStorage.setItem('last_reminder_dismiss', new Date().toDateString());
}

/**
 * Verify Google Sign-In for device switching
 */
export async function verifyGoogleSignIn(googleUser: any, registrationId: string): Promise<void> {
    const teacher = await fetchTeacherByRegistrationId(registrationId);
    
    if (!teacher) {
        throw new Error('رقم التسجيل غير موجود');
    }
    
    if (teacher.email !== googleUser.email) {
        throw new Error('البريد الإلكتروني غير متطابق مع الحساب المسجل');
    }
    
    // Update device fingerprint
    const deviceData = getOrCreateFingerprint();
    await updateDeviceFingerprint(registrationId, deviceData.fingerprint);
    
    // Update local data
    teacher.deviceFingerprint = deviceData.fingerprint;
    saveTeacherToLocal(teacher);
}

/**
 * Get current session
 */
export function getCurrentSession(): AuthSession | null {
    const teacher = getTeacherFromLocal();
    if (!teacher) return null;
    
    const deviceData = getOrCreateFingerprint();
    const isLinked = !!teacher.email;
    
    let daysSinceFirstUse = 0;
    if (teacher.firstUseDate) {
        const firstUse = new Date(teacher.firstUseDate);
        const now = new Date();
        daysSinceFirstUse = Math.floor((now.getTime() - firstUse.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    const needsEmailLink = !isLinked && (
        (teacher.emailRequired && daysSinceFirstUse >= 14) ||
        (!teacher.emailRequired && shouldShowDailyReminder())
    );
    
    return {
        teacher,
        deviceFingerprint: deviceData.fingerprint,
        isLinked,
        daysSinceFirstUse,
        needsEmailLink
    };
}

/**
 * Logout
 */
export function logout(): void {
    clearTeacherData();
    localStorage.removeItem('device_fingerprint');
    localStorage.removeItem('last_reminder_dismiss');
}

/**
 * Check if should show daily reminder
 */
function shouldShowDailyReminder(): boolean {
    const lastDismiss = localStorage.getItem('last_reminder_dismiss');
    if (!lastDismiss) return true;
    
    const today = new Date().toDateString();
    return lastDismiss !== today;
}

/**
 * Dismiss daily reminder
 */
export function dismissDailyReminder(): void {
    localStorage.setItem('last_reminder_dismiss', new Date().toDateString());
}
