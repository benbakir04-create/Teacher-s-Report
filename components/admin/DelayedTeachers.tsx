import React from 'react';
import { UserX, Clock, AlertCircle, ChevronLeft } from 'lucide-react';
import { TeacherSummary } from '../../services/adminService';

interface DelayedTeachersProps {
    teachers: TeacherSummary[];
    onTeacherClick: (teacherId: string) => void;
    isLoading: boolean;
}

export const DelayedTeachers: React.FC<DelayedTeachersProps> = ({ teachers, onTeacherClick, isLoading }) => {
    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-100 rounded-xl mb-2 animate-pulse" />
                ))}
            </div>
        );
    }

    const sortedTeachers = [...teachers].sort((a, b) => b.daysWithoutReport - a.daysWithoutReport);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <UserX size={20} className="text-red-500" />
                    <h3 className="font-bold text-gray-800">معلمون متأخرون</h3>
                    {teachers.length > 0 && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                            {teachers.length}
                        </span>
                    )}
                </div>
            </div>

            <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                {sortedTeachers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <span className="text-green-500 text-2xl">✓</span>
                        <p className="mt-2">جميع المعلمين نشطون</p>
                    </div>
                ) : (
                    sortedTeachers.map(teacher => (
                        <button
                            key={teacher.id}
                            onClick={() => onTeacherClick(teacher.id)}
                            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
                        >
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                teacher.status === 'inactive' ? 'bg-red-500' : 'bg-amber-500'
                            }`}>
                                {teacher.name.charAt(0)}
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 text-right">
                                <div className="font-medium text-gray-800">{teacher.name}</div>
                                <div className="text-xs text-gray-500">{teacher.schoolName}</div>
                            </div>
                            
                            {/* Status */}
                            <div className="text-left">
                                <div className={`flex items-center gap-1 text-sm font-bold ${
                                    teacher.daysWithoutReport >= 3 ? 'text-red-600' : 'text-amber-600'
                                }`}>
                                    <Clock size={14} />
                                    {teacher.daysWithoutReport} أيام
                                </div>
                                <div className="text-[10px] text-gray-500">
                                    بدون تقرير
                                </div>
                            </div>
                            
                            {teacher.daysWithoutReport >= 5 && (
                                <AlertCircle size={18} className="text-red-500 animate-pulse" />
                            )}
                            
                            <ChevronLeft size={16} className="text-gray-300 group-hover:text-gray-500 transition" />
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};
