
import React from 'react';
import { Home, BookOpen, FileText, ChartColumn, Book, Info } from 'lucide-react';
import { TabId, CompletionStatus } from '../types';

interface BottomNavProps {
    activeTab: TabId;
    setActiveTab: (tab: TabId) => void;
    hasSecondClass: boolean;
    tabStatus: Record<TabId, CompletionStatus>;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, hasSecondClass, tabStatus }) => {
    
    const navItems = [
        { id: 'general' as TabId, label: 'عامة', icon: Home },
        { id: 'quran' as TabId, label: 'قرآن', icon: Book },
        { id: 'class1' as TabId, label: 'حصة 1', icon: BookOpen },
        ...(hasSecondClass ? [{ id: 'class2' as TabId, label: 'حصة 2', icon: BookOpen }] : []),
        { id: 'notes' as TabId, label: 'ملاحظات', icon: FileText },
        { id: 'reports' as TabId, label: 'تقارير', icon: ChartColumn },
        { id: 'about' as TabId, label: 'عن المشروع', icon: Info },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
            {/* The Background Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)] h-[70px] rounded-t-[20px] pointer-events-auto"></div>

            <div className="relative flex justify-around items-end h-[70px] px-2 pb-2 pointer-events-auto max-w-md mx-auto">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const status = tabStatus[item.id];
                    const Icon = item.icon;
                    
                    let StatusIndicator = null;
                    if (!isActive) {
                        if (status === 'complete') {
                            StatusIndicator = <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm z-30"></div>;
                        } else if (status === 'partial') {
                            StatusIndicator = <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 border-2 border-white rounded-full shadow-sm z-30"></div>;
                        }
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className="relative group flex flex-col items-center justify-end pb-2 w-16 transition-all duration-300 focus:outline-none"
                        >
                            <div 
                                className={`absolute transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) flex items-center justify-center rounded-full
                                    ${isActive 
                                        ? 'bottom-9 w-16 h-16 bg-gradient-to-br from-primary to-secondary text-white shadow-[0_10px_25px_rgba(102,126,234,0.6)] border-[5px] border-[#f3f4f6] scale-110 z-20' 
                                        : 'bottom-2 w-10 h-10 text-gray-400 group-hover:bg-gray-50 z-10'
                                    }
                                `}
                            >
                                <div className="relative">
                                    <Icon size={isActive ? 28 : 20} strokeWidth={isActive ? 2.5 : 2} />
                                    {StatusIndicator}
                                </div>
                            </div>
                            
                            <span 
                                className={`text-[10px] font-bold z-10 transition-all duration-300
                                    ${isActive ? 'translate-y-1 opacity-100 text-primary' : 'translate-y-1 opacity-70 text-gray-400'}
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
