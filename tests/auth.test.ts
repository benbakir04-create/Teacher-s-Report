import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dbService } from '../services/db.service';
import { loginWithRegistrationId } from '../services/authService';

// Mock dependencies
vi.mock('../services/db.service', () => ({
    dbService: {
        getUserByTeacherId: vi.fn(),
        createUser: vi.fn(),
        logEvent: vi.fn(),
        saveReport: vi.fn(), 
        add: vi.fn(),
        init: vi.fn().mockResolvedValue(undefined)
    }
}));

vi.mock('../services/teacherService', () => ({
    fetchTeacherByRegistrationId: vi.fn().mockResolvedValue({
        registrationId: '123',
        name: 'Test Teacher',
        school: 'Test School',
        section: 'A'
    }),
    saveTeacherToLocal: vi.fn(),
    // getOrCreateFingerprint: vi.fn().mockReturnValue({ fingerprint: 'device-123' }) // This is NOT where it comes from in authService imports
}));

vi.mock('../services/deviceService', () => ({
    getOrCreateFingerprint: vi.fn().mockReturnValue({ fingerprint: 'device-123' }),
    generateDeviceFingerprint: vi.fn().mockReturnValue('device-123')
}));

describe('Phase 6.1: User Onboarding', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create a new User in DB on first login', async () => {
        // Setup: User does not exist
        vi.mocked(dbService.getUserByTeacherId).mockResolvedValue(null);

        // Execute Login
        await loginWithRegistrationId('123');

        // Verify createUser was called
        expect(dbService.createUser).toHaveBeenCalledWith(expect.objectContaining({
            teacher_id: '123',
            name: 'Test Teacher',
            roles: ['teacher'],
            device_fingerprint: 'device-123'
        }));

        // Verify Log
        expect(dbService.logEvent).toHaveBeenCalled();
    });

    it('should NOT create user if already exists', async () => {
        // Setup: User exists
        vi.mocked(dbService.getUserByTeacherId).mockResolvedValue({ id: 'existing-uuid' });

        // Execute Login
        await loginWithRegistrationId('123');

        // Verify createUser was NOT called
        expect(dbService.createUser).not.toHaveBeenCalled();
    });
});
