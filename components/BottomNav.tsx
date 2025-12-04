import React from 'react';
import { Home, BookOpen, FileText, ChartColumn, Book, Info, Save } from 'lucide-react';
import { TabId, CompletionStatus } from '../types';

interface BottomNavProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
    onSave: () => void;
    isFormComplete: boolean;
    hasSecondClass?: boolean;
    tabStatus?: (tab: TabId) => CompletionStatus;
}

export const BottomNav: React.FC<BottomNavProps> = ({ 
    activeTab, 
    onTabChange, 
    onSave, 
    isFormComplete,
    hasSecondClass = false,
    tabStatus 
}) => {
    
    const navItems = [
        { id: 'general' as TabId, label: 'عامة', icon: Home },
        { id: 'quran' as TabId, label: 'قرآن', icon: Book },
        { id: 'class1' as TabId, label: 'حصة 1', icon: BookOpen },
        ...(hasSecondClass ? [{ id: 'class2' as TabId, label: 'حصة 2', icon: BookOpen }] : []),
        { id: 'notes' as TabId, label: 'ملاحظات', icon: FileText },
        { id: 'dashboard' as TabId, label: 'إحصائيات', icon: ChartColumn },
        { id: 'about' as TabId, label: 'عن المشروع', icon: Info },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
            {/* The Background Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)] h-[80px] rounded-t-[25px] pointer-events-auto border-t border-gray-100"></div>

            {/* Save Button (Floating) */}
            <div className="absolute bottom-[45px] left-1/2 -translate-x-1/2 pointer-events-auto z-50">
                <button
                    onClick={onSave}
                    disabled={!isFormComplete}
                    className={`
                        w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 border-[#f3f4f6] transition-all duration-300
                        ${isFormComplete 
                            ? 'bg-gradient-to-r from-green-400 to-green-600 text-white hover:scale-110 hover:shadow-green-200' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }
                    `}
                >
                    <Save size={28} />
                </button>
            </div>

            <div className="relative flex justify-between items-end h-[80px] px-2 pb-2 pointer-events-auto max-w-md mx-auto">
                {navItems.map((item, index) => {
                    const isActive = activeTab === item.id;
                    const status = tabStatus ? tabStatus(item.id) : 'incomplete';
                    const Icon = item.icon;
                    
                    // Add gap in middle for Save button
                    const isMiddle = index === Math.floor(navItems.length / 2);
                    const style = isMiddle ? { marginRight: '40px' } : {}; // Simple spacing hack

                    let StatusIndicator = null;
                    if (!isActive && tabStatus) {
                        if (status === 'complete') {
                            StatusIndicator = <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full z-30"></div>;
                        } else if (status === 'partial') {
                            StatusIndicator = <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-400 border-2 border-white rounded-full z-30"></div>;
                        }
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`relative group flex flex-col items-center justify-end pb-3 w-14 transition-all duration-300 focus:outline-none ${isActive ? '-translate-y-2' : ''}`}
                        >
                            <div 
                                className={`transition-all duration-300 rounded-xl p-2
                                    ${isActive 
                                        ? 'bg-primary/10 text-primary' 
                                        : 'text-gray-400 hover:bg-gray-50'
                                    }
                                `}
                            >
                                <div className="relative">
                                    <Icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
                                    {StatusIndicator}
                                </div>
                            </div>
                            
                            <span 
                                className={`text-[9px] font-bold mt-1 transition-all duration-300
                                    ${isActive ? 'opacity-100 text-primary' : 'opacity-0 h-0 overflow-hidden'}
                                `}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
