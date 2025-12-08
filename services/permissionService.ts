import { User, Role } from '../types';

export type Permission = 
    | 'reports.create'
    | 'reports.edit.own'
    | 'reports.edit.any'
    | 'reports.view.school'
    | 'reports.delete'
    | 'users.manage'
    | 'settings.manage';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    teacher: [
        'reports.create',
        'reports.edit.own'
    ],
    school_admin: [
        'reports.create',
        'reports.edit.own',
        'reports.edit.any',
        'reports.view.school',
        'users.manage'
    ],
    inspector: [
        'reports.create',
        'reports.edit.own',
        'reports.edit.any',
        'reports.view.school'
    ],
    super_admin: [
        'reports.create',
        'reports.edit.own',
        'reports.edit.any',
        'reports.view.school',
        'reports.delete',
        'users.manage',
        'settings.manage'
    ]
};

export function hasPermission(user: User | null, permission: Permission): boolean {
    if (!user) return false;
    
    // Super Admin has all permissions implicitly (safe guard)
    if (user.roles.includes('super_admin')) return true;

    // Check if any of the user's roles grant the permission
    return user.roles.some(role => {
        const permissions = ROLE_PERMISSIONS[role];
        return permissions && permissions.includes(permission);
    });
}

export function can(user: User | null, action: Permission): boolean {
    return hasPermission(user, action);
}

// UI Helper to get label
export function getRoleLabel(role: Role): string {
    const labels: Record<Role, string> = {
        teacher: 'معلم',
        school_admin: 'مدير مدرسة',
        inspector: 'مفتش',
        super_admin: 'مسؤول نظام'
    };
    return labels[role] || role;
}
