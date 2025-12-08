import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../hooks/useUser'; // We need to create this hook or use DB
import { Permission, can } from '../services/permissionService';
import { ShieldAlert } from 'lucide-react';

interface AdminRouteProps {
    children: React.ReactNode;
    requiredPermission?: Permission;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ 
    children, 
    requiredPermission = 'users.manage' 
}) => {
    const { currentUser, isLoading } = useUser(); // Need to implement useUser

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">جاري التحقق من الصلاحيات...</div>;
    }

    if (!currentUser || !can(currentUser, requiredPermission)) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
                    <ShieldAlert size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">غير مصرح لك</h2>
                <p className="text-gray-600 max-w-sm">
                    ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة. يرجى التواصل مع الإدارة إذا كنت تعتقد أن هذا خطأ.
                </p>
            </div>
        );
    }

    return <>{children}</>;
};
