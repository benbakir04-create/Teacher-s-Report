import React from 'react';
import { ClipboardList, BarChart2, MessageSquare, Plus } from 'lucide-react';
import { TabId } from '../types';

interface BottomNavProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
    onNewReport: () => void;
    isFormComplete: boolean;
    tabStatus: (tab: TabId) => 'complete' | 'partial' | 'incomplete';
}

export function BottomNav({ activeTab, onTabChange, onNewReport, isFormComplete, tabStatus }: BottomNavProps) {
    const navItems = [
        { id: 'dailyReport' as TabId, label: 'السجل', icon: ClipboardList },
        { id: 'notes' as TabId, label: 'ملاحظات', icon: MessageSquare },
        { id: 'statistics' as TabId, label: 'إحصاءات', icon: BarChart2 },
    ];

    // Determine Status Button Color
    const getStatusColor = (status: 'complete' | 'partial' | 'incomplete') => {
        switch (status) {
            case 'complete': return 'bg-green-100 text-green-600';
            case 'partial': return 'bg-orange-100 text-orange-600';
            default: return 'text-gray-400 group-hover:bg-gray-100';
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 pb-safe pt-2 px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40">
            <div className="flex items-center justify-between max-w-md mx-auto relative h-16">
                
                {/* Left Side Items */}
                <div className="flex items-center gap-8">
                    {navItems.slice(0, 1).map((item) => {
                        const isActive = activeTab === item.id;
                        const status = tabStatus(item.id);
                        
                        return (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id)}
                                className={`group flex flex-col items-center gap-1 transition-all duration-300 relative ${
                                    isActive ? 'text-primary scale-105' : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-primary/10' : getStatusColor(status)}`}>
                                    <item.icon 
                                        size={22} 
                                        className={`transition-transform duration-300 ${isActive ? 'animate-pulse-slow' : 'group-hover:scale-110'}`} 
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />
                                </div>
                                <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
                                
                                {isActive && (
                                    <span className="absolute -bottom-2 w-1.5 h-1.5 bg-primary rounded-full animate-fade-in"></span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Central Floating Action Button (New Report) */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-6">
                    <button
                        onClick={onNewReport}
                        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl border-4 border-[#f3f4f6] transition-all duration-300 hover:scale-105 hover:rotate-90 active:scale-95 ${
                            isFormComplete 
                                ? 'bg-gradient-to-tr from-green-500 to-emerald-400 text-white shadow-green-500/30' 
                                : 'bg-gradient-to-tr from-primary to-secondary text-white shadow-primary/30'
                        }`}
                        aria-label="New Report"
                    >
                        <Plus size={28} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Right Side Items */}
                <div className="flex items-center gap-8">
                    {navItems.slice(1).map((item) => {
                        const isActive = activeTab === item.id;
                        const status = tabStatus(item.id);
                        
                        return (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id)}
                                className={`group flex flex-col items-center gap-1 transition-all duration-300 relative ${
                                    isActive ? 'text-primary scale-105' : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-primary/10' : getStatusColor(status)}`}>
                                    <item.icon 
                                        size={22} 
                                        className={`transition-transform duration-300 ${isActive ? 'animate-pulse-slow' : 'group-hover:scale-110'}`} 
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />
                                </div>
                                <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
                                
                                {isActive && (
                                    <span className="absolute -bottom-2 w-1.5 h-1.5 bg-primary rounded-full animate-fade-in"></span>
                                )}
                            </button>
                        );
                    })}
                </div>

            </div>
        </div>
    );
}
