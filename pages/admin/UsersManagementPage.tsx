import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db.service';
import { User, Role } from '../../types';
import { RoleBadge } from '../../components/admin/RoleBadge';
import { Search, Shield, User as UserIcon, Calendar, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export const UsersManagementPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
    const [editingUser, setEditingUser] = useState<string | null>(null); // User ID being edited

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            // We need to implement getAllUsers in dbService or use getAll generic
            const allUsers = await dbService.getAll<User>('users');
            setUsers(allUsers);
        } catch (error) {
            toast.error('فشل تحميل المستخدمين');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: Role) => {
        try {
            const user = users.find(u => u.id === userId);
            if (!user) return;

            // Update local state first (optimistic)
            const updatedUser = { ...user, roles: [newRole], updatedAt: Date.now() };
            setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
            setEditingUser(null);

            // Update DB
            await dbService.updateUser(updatedUser);
            
            // Log Event
            await dbService.logEvent({
                id: crypto.randomUUID(),
                event: 'user.role_update',
                userId: 'current-admin-id', // TODO: Get actual admin ID
                timestamp: Date.now(),
                details: { targetUserId: userId, newRole }
            });

            toast.success('تم تحديث الصلاحيات بنجاح');
        } catch (error) {
            toast.error('حدث خطأ أثناء التحديث');
            loadUsers(); // Revert
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              user.teacher_id?.includes(searchTerm) ||
                              user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.roles.includes(roleFilter);
        return matchesSearch && matchesRole;
    });

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-bl from-primary to-secondary p-6 text-white">
                <h1 className="text-xl font-bold">إدارة المستخدمين</h1>
            </div>

            <div className="max-w-5xl mx-auto p-4 space-y-6">
                
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-gray-500 text-xs mb-1">إجمالي المستخدمين</div>
                        <div className="text-2xl font-bold text-gray-800">{users.length}</div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-gray-500 text-xs mb-1">المعلمين</div>
                        <div className="text-2xl font-bold text-blue-600">
                            {users.filter(u => u.roles.includes('teacher')).length}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-gray-500 text-xs mb-1">المشرفين</div>
                        <div className="text-2xl font-bold text-purple-600">
                            {users.filter(u => u.roles.includes('school_admin') || u.roles.includes('super_admin')).length}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-gray-500 text-xs mb-1">تم ربط البريد</div>
                        <div className="text-2xl font-bold text-green-600">
                            {users.filter(u => !!u.email).length}
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input 
                            type="text"
                            placeholder="بحث بالاسم، رقم التسجيل، أو البريد..."
                            className="w-full pr-10 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                        {(['all', 'teacher', 'school_admin', 'inspector', 'super_admin'] as const).map(role => (
                            <button
                                key={role}
                                onClick={() => setRoleFilter(role)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                                    roleFilter === role 
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {role === 'all' ? 'الكل' : <RoleBadge role={role} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Users List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <UserIcon size={32} className="text-gray-400" />
                            </div>
                            <p>لا يوجد مستخدمين مطابقين للبحث</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500">المستخدم</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500">رقم التسجيل</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500">الصلاحية</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500">حالة الربط</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500">تاريخ الانضمام</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-800">{user.name}</div>
                                                        <div className="text-xs text-gray-500">{user.email || '-'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-sm text-gray-600">
                                                {user.teacher_id}
                                            </td>
                                            <td className="px-6 py-4">
                                                {editingUser === user.id ? (
                                                    <select 
                                                        className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                                                        value={user.roles[0]}
                                                        onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                                                        autoFocus
                                                        onBlur={() => setEditingUser(null)}
                                                    >
                                                        <option value="teacher">معلم</option>
                                                        <option value="school_admin">مدير مدرسة</option>
                                                        <option value="inspector">مفتش</option>
                                                        <option value="super_admin">مسؤول نظام</option>
                                                    </select>
                                                ) : (
                                                    <div onClick={() => setEditingUser(user.id)} className="cursor-pointer hover:bg-gray-100 p-1 rounded transition select-none">
                                                        <RoleBadge role={user.roles[0]} />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.email ? (
                                                    <span className="text-green-600 text-xs bg-green-50 px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                                                        <Shield size={12} />
                                                        مربوط
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs bg-gray-100 px-2 py-1 rounded-full">
                                                        غير مربوط
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => setEditingUser(user.id)}
                                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                >
                                                    تعديل
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
