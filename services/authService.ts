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
import { dbService } from './db.service';
import { User, Role } from '../types';

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
// Rate Limiting Logic
const loginAttempts: Record<string, { count: number; lastAttempt: number }> = {};

/**
 * Login with registration ID
 */
export async function loginWithRegistrationId(registrationId: string): Promise<AuthSession> {
    // Check Rate Limiting
    const attempts = loginAttempts[registrationId] || { count: 0, lastAttempt: 0 };
    const now = Date.now();
    
    // If 5 failed attempts in last 15 minutes (15 * 60 * 1000 = 900000ms)
    if (attempts.count >= 5 && (now - attempts.lastAttempt) < 15 * 60 * 1000) {
        throw new Error('تم تجاوز عدد المحاولات المسموح به (5 مرات). يرجى الانتظار 15 دقيقة قبل المحاولة مرة أخرى.');
    }

    try {
        // Fetch teacher from Google Sheets
        let teacher = await fetchTeacherByRegistrationId(registrationId);
        
        // DEMO MODE: If teacher not found and running locally, create demo teacher
        // ... (truncated for brevity, keep existing logic if needed, but here simple fetch is enough as we are inside the function)
        // Re-adding the demo/fetch logic carefully if I replace the whole block, but I am replacing from line 29
        
        // DEMO MODE CHECK (Restoring original logic here to ensure no regression)
        if (!teacher && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            console.log('🎭 Demo Mode: Creating demo teacher for development');
            teacher = {
                registrationId: registrationId,
                name: 'معلم تجريبي',
                school: 'مدرسة الاختبار',
                level: 'الخامسة ابتدائي',
                section: 'أ',
                email: '',
                deviceFingerprint: '',
                firstUseDate: new Date().toISOString(),
                linkDate: '',
                emailRequired: false
            };
        }
        
        if (!teacher) {
            throw new Error('رقم التسجيل غير موجود. يرجى التأكد من الرقم أو التواصل مع الإدارة');
        }
        
        // Get or create device fingerprint
        const deviceData = getOrCreateFingerprint();
        const currentFingerprint = deviceData.fingerprint;
        
        // Check if teacher has email linked
        const isLinked = !!teacher.email;
        
        // Check device match (Supports Multi-Device)
        const storedFingerprints = (teacher.deviceFingerprint || '').split(',').map(s => s.trim());
        const deviceMatches = storedFingerprints.includes(currentFingerprint);
        
        // If email linked but device doesn't match, throw error (requires Google Sign-In)
        if (isLinked && !deviceMatches) {
            throw new Error('DEVICE_MISMATCH');
        }
        
        // Calculate days since first use
        let daysSinceFirstUse = 0;
        if (teacher.firstUseDate) {
            const firstUse = new Date(teacher.firstUseDate);
            daysSinceFirstUse = Math.floor((new Date().getTime() - firstUse.getTime()) / (1000 * 60 * 60 * 24));
        }
        
        // Update device fingerprint if not set
        if (!teacher.deviceFingerprint) {
            teacher.deviceFingerprint = currentFingerprint;
            // Skip update to Google Sheets in demo mode
            if (!(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                await updateDeviceFingerprint(registrationId, currentFingerprint);
            }
        }
        
        // Set first use date if not set
        if (!teacher.firstUseDate) {
            teacher.firstUseDate = new Date().toISOString();
        }

        // SUCCESS: Reset attempts and Set Session Start
        delete loginAttempts[registrationId];
        localStorage.setItem('session_start_date', new Date().toISOString());
        
        // Save to local storage
        saveTeacherToLocal(teacher);

        // --- Phase 6: User Onboarding (Sync with IndexedDB) ---
        try {
            const existingUser = await dbService.getUserByTeacherId(teacher.registrationId);
            if (!existingUser) {
                // Create New User
                const newUser: User = {
                    id: crypto.randomUUID(),
                    teacher_id: teacher.registrationId,
                    name: teacher.name,
                    email: teacher.email || undefined,
                    school_id: teacher.school,
                    roles: ['teacher'] as Role[],
                    sections: teacher.section ? [teacher.section] : [],
                    device_fingerprint: currentFingerprint,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    must_link_email: false,
                    linked_at: teacher.linkDate ? new Date(teacher.linkDate).getTime() : null
                };
                
                await dbService.createUser(newUser);
                
                await dbService.logEvent({
                    id: crypto.randomUUID(),
                    event: 'user.create',
                    userId: newUser.id,
                    timestamp: Date.now(),
                    details: { method: 'registration_id' }
                });
                console.log('✅ New User onboarded:', newUser.id);
            }
        } catch (err) {
            console.error('⚠️ Failed to sync user to DB:', err);
            // We don't block login if DB fails, as we rely on Local-First principle primarily
        }
        // -----------------------------------------------------
        
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

    } catch (error) {
        // Increment failed attempts on error
        const currentAttempts = loginAttempts[registrationId] || { count: 0, lastAttempt: 0 };
        loginAttempts[registrationId] = {
            count: currentAttempts.count + 1,
            lastAttempt: Date.now()
        };
        throw error;
    }
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
    
    // --- Phase 6: Sync Link to DB ---
    try {
        const user = await dbService.getUserByTeacherId(teacher.registrationId);
        if (user) {
            user.email = email;
            user.device_fingerprint = deviceData.fingerprint;
            user.linked_at = Date.now();
            user.updatedAt = Date.now();
            await dbService.updateUser(user);
            
            await dbService.logEvent({
                id: crypto.randomUUID(),
                event: 'user.link_email',
                userId: user.id,
                timestamp: Date.now(),
                details: { email }
            });
            console.log('✅ User email linked in DB');
        }
    } catch (e) {
        console.error('Failed to sync email link to DB:', e);
    }
    // --------------------------------

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

    // Check Session Expiration (30 Days)
    const sessionStart = localStorage.getItem('session_start_date');
    if (sessionStart) {
        const startDate = new Date(sessionStart);
        const now = new Date();
        const daysActive = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysActive > 30) {
            console.warn('Session expired (30 days limit)');
            logout(); // Auto logout
            return null;
        }
    } else {
        // If no session start date found (legacy), set it now to avoid immediate logout loop, 
        // or just accept it as a fresh session start.
        localStorage.setItem('session_start_date', new Date().toISOString());
    }
    
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
    // Note: We intentionally keep 'device_fingerprint' in localStorage
    // This allows the user to login again on the same device without Google verification
    // This allows the user to login again on the same device without Google verification
    localStorage.removeItem('last_reminder_dismiss');
    localStorage.removeItem('session_start_date');
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
