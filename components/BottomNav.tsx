import React from 'react';
import { Edit3, MessageSquare, BarChart2, Plus } from 'lucide-react';
import { TabId, CompletionStatus } from '../types';

interface BottomNavProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
    onNewReport: () => void;
    isFormComplete: boolean;
    tabStatus?: (tab: TabId) => CompletionStatus;
}

export const BottomNav: React.FC<BottomNavProps> = ({ 
    activeTab, 
    onTabChange, 
    onNewReport,
    isFormComplete,
    tabStatus 
}) => {
    
    // Only 3 tabs now (no 'general' - it's in Avatar Menu)
    const navItems = [
        { id: 'dailyReport' as TabId, label: 'السجل', icon: Edit3 },
        { id: 'notes' as TabId, label: 'ملاحظات', icon: MessageSquare },
        { id: 'statistics' as TabId, label: 'إحصاءات', icon: BarChart2 },
    ];

    return (
        <>
            {/* Central FAB Button - + تقرير جديد */}
            <div className="fixed bottom-[85px] left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
                <button
                    onClick={onNewReport}
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl border-4 border-white transition-all duration-300 transform hover:scale-110 active:scale-95 bg-gradient-to-br from-primary to-secondary text-white"
                >
                    <Plus size={28} strokeWidth={3} />
                </button>
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-primary whitespace-nowrap">
                    تقرير جديد
                </span>
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
                {/* The Background Bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)] h-[70px] rounded-t-[25px] pointer-events-auto border-t border-gray-100"></div>

                <div className="relative flex justify-around items-end h-[70px] px-4 pb-2 pointer-events-auto max-w-md mx-auto">
                    {navItems.map((item, index) => {
                        const isActive = activeTab === item.id;
                        const status = tabStatus ? tabStatus(item.id) : 'incomplete';
                        const Icon = item.icon;
                        
                        // Add space in middle for FAB
                        const marginClass = index === 1 ? 'mx-8' : '';
                        
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
                                className={`relative group flex flex-col items-center justify-end pb-2 w-16 transition-all duration-300 focus:outline-none ${marginClass}`}
                            >
                                <div 
                                    className={`absolute transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) flex items-center justify-center rounded-full
                                        ${isActive 
                                            ? 'bottom-8 w-14 h-14 bg-gradient-to-br from-primary to-secondary text-white shadow-[0_8px_20px_rgba(102,126,234,0.5)] border-[4px] border-[#f3f4f6] scale-110 z-20' 
                                            : 'bottom-2 w-10 h-10 text-gray-400 group-hover:bg-gray-50 z-10'
                                        }
                                    `}
                                >
                                    <div className="relative">
                                        <Icon size={isActive ? 24 : 20} strokeWidth={isActive ? 2.5 : 2} />
                                        {StatusIndicator}
                                    </div>
                                </div>
                                
                                <span 
                                    className={`text-[9px] font-bold z-10 transition-all duration-300
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
        </>
    );
};
