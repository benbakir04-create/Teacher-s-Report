import { describe, it, expect } from 'vitest';
import { can } from '../services/permissionService';
import { User } from '../types';

describe('RBAC Permission Logic', () => {
    
    const mockUser = (roles: string[]): User => ({
        id: '1',
        name: 'Test',
        roles: roles as any,
        createdAt: 0,
        updatedAt: 0
    });

    it('TEACHER roles', () => {
        const user = mockUser(['teacher']);
        
        expect(can(user, 'reports.create')).toBe(true);
        expect(can(user, 'reports.edit.own')).toBe(true);
        
        expect(can(user, 'reports.edit.any')).toBe(false);
        expect(can(user, 'users.manage')).toBe(false);
    });

    it('SCHOOL ADMIN roles', () => {
        const user = mockUser(['school_admin']);

        expect(can(user, 'users.manage')).toBe(true);
        expect(can(user, 'reports.view.school')).toBe(true);
        expect(can(user, 'reports.delete')).toBe(false); 
    });

    it('SUPER ADMIN roles', () => {
        const user = mockUser(['super_admin']);
        // Super admin should have everything
        expect(can(user, 'users.manage')).toBe(true);
        expect(can(user, 'reports.delete')).toBe(true);
        expect(can(user, 'settings.manage')).toBe(true);
    });

    it('INSPECTOR roles', () => {
        const user = mockUser(['inspector']);
        expect(can(user, 'reports.view.school')).toBe(true);
        expect(can(user, 'users.manage')).toBe(false);
    });
});
