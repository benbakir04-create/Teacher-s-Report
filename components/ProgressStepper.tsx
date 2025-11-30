
import React from 'react';
import { Check } from 'lucide-react';
import { TabId, CompletionStatus } from '../types';

interface Step {
    id: TabId;
    label: string;
    status: CompletionStatus;
}

interface ProgressStepperProps {
    steps: Step[];
    activeTab: TabId;
    onStepClick: (id: TabId) => void;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({ steps, activeTab, onStepClick }) => {
    return (
        <div className="w-full overflow-x-auto no-scrollbar py-3 px-2 z-30 relative">
            <div className="flex items-center justify-between min-w-[300px] px-4 relative max-w-lg mx-auto">
                {/* Connecting Line */}
                <div className="absolute top-[14px] left-6 right-6 h-0.5 bg-white/20 -z-10"></div>
                
                {steps.map((step) => {
                    const isActive = activeTab === step.id;
                    const status = step.status;
                    
                    let statusClasses = 'border-white/30 bg-white/10 text-white/50';
                    let icon = <div className="w-1.5 h-1.5 bg-white/50 rounded-full" />;
                    let textClasses = 'text-white/60 font-medium';

                    if (status === 'complete') {
                        statusClasses = 'border-white bg-white text-green-600 shadow-sm';
                        icon = <Check size={12} strokeWidth={4} />;
                        textClasses = 'text-white font-bold';
                    } else if (status === 'partial') {
                        statusClasses = 'border-orange-200 bg-orange-100 text-orange-500';
                        icon = <div className="w-2 h-2 bg-orange-500 rounded-full" />; 
                        textClasses = 'text-white/90';
                    }

                    if (isActive) {
                        statusClasses = 'border-white bg-white text-primary shadow-[0_0_0_4px_rgba(255,255,255,0.2)] scale-110';
                        icon = <div className="w-2 h-2 bg-primary rounded-full" />;
                        textClasses = 'text-white font-bold';
                    }

                    return (
                        <button 
                            key={step.id}
                            onClick={() => onStepClick(step.id)}
                            className="flex flex-col items-center group focus:outline-none min-w-[36px]"
                        >
                            <div 
                                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 mb-1.5
                                    ${statusClasses}
                                `}
                            >
                                {icon}
                            </div>
                            <span 
                                className={`text-[9px] transition-colors duration-300 ${textClasses}`}
                            >
                                {step.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
