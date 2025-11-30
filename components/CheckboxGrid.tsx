import React from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

interface CheckboxGridProps {
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    label: string;
    isOpen: boolean;
    onToggle: () => void;
}

export const CheckboxGrid: React.FC<CheckboxGridProps> = ({ 
    options, 
    selected, 
    onChange, 
    label, 
    isOpen, 
    onToggle 
}) => {
    const toggleOption = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter(item => item !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    // Calculate summary text
    const summaryText = selected.length > 0 
        ? selected.join('، ') 
        : 'لم يتم تحديد خيارات';

    return (
        <div className={`bg-white border rounded-xl transition-all duration-300 overflow-hidden mb-4 ${isOpen ? 'border-primary shadow-md' : 'border-gray-200 shadow-sm'}`}>
            {/* Header - Always Visible */}
            <button 
                onClick={onToggle}
                className={`w-full flex items-center justify-between p-4 text-right transition-colors duration-200 
                    ${isOpen ? 'bg-primary/5' : 'bg-white hover:bg-gray-50'}
                `}
            >
                <div className="flex flex-col items-start gap-1">
                    <span className={`text-sm font-bold ${isOpen ? 'text-primary' : 'text-gray-700'}`}>
                        {label}
                    </span>
                    {!isOpen && (
                        <span className="text-xs text-gray-400 truncate max-w-[200px] sm:max-w-xs">
                            {selected.length > 0 ? `${selected.length} خيارات محددة` : 'اضغط للاختيار'}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {selected.length > 0 && (
                        <span className="flex items-center justify-center w-6 h-6 bg-primary text-white text-xs font-bold rounded-full">
                            {selected.length}
                        </span>
                    )}
                    {isOpen ? <ChevronUp size={18} className="text-primary" /> : <ChevronDown size={18} className="text-gray-400" />}
                </div>
            </button>

            {/* Body - Collapsible */}
            <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden
                    ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
                `}
            >
                <div className="p-4 pt-0 border-t border-gray-100 bg-white">
                    <div className="grid grid-cols-2 gap-3 mt-3">
                        {options.map(option => {
                            const isSelected = selected.includes(option);
                            return (
                                <div
                                    key={option}
                                    onClick={() => toggleOption(option)}
                                    className={`relative cursor-pointer p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group
                                        ${isSelected 
                                            ? 'border-primary bg-blue-50 text-primary shadow-sm' 
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                        }
                                    `}
                                >
                                    <span className="text-xs font-medium leading-tight">{option}</span>
                                    <div className={`w-5 h-5 rounded-full flex flex-shrink-0 items-center justify-center border transition-colors
                                        ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 group-hover:border-gray-400'}
                                    `}>
                                        {isSelected && <Check size={12} className="text-white" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Summary Footer when open */}
                    <div className="mt-4 pt-3 border-t border-dashed border-gray-200 text-xs text-gray-500 flex justify-between items-center">
                         <span>تم تحديد: {summaryText}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};