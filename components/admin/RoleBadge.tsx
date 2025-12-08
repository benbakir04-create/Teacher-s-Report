import React from 'react';
import { Role } from '../../types';
import { getRoleLabel } from '../../services/permissionService';

interface RoleBadgeProps {
    role: Role;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
    const getBadgeStyle = (r: Role) => {
        switch (r) {
            case 'super_admin':
                return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'school_admin':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'inspector':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'teacher':
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyle(role)}`}>
            {getRoleLabel(role)}
        </span>
    );
};
