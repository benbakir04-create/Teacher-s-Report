import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

interface CheckboxGridProps {
    items?: string[];
    options?: string[];
    selected?: string[];
    onChange: (selected: string[]) => void;
    label?: string;
    isOpen?: boolean;
    onToggle?: () => void;
}

export const CheckboxGrid: React.FC<CheckboxGridProps> = ({ 
    items,
    options,
    selected = [], 
    onChange, 
    label,
    isOpen: externalIsOpen,
    onToggle: externalOnToggle
}) => {
    // Support both 'items' and 'options' props
    const optionsList = items || options || [];
    
    // Internal state for when component manages its own open state
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
    const onToggle = externalOnToggle || (() => setInternalIsOpen(prev => !prev));
    
    const toggleOption = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter(item => item !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    // Compact chip-style display for selected items
    const renderSelectedChips = () => {
        if (selected.length === 0) return null;
        return (
            <div className="flex flex-wrap gap-1 mt-2">
                {selected.map(item => (
                    <span 
                        key={item}
                        onClick={(e) => { e.stopPropagation(); toggleOption(item); }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-full cursor-pointer hover:bg-primary/20 transition"
                    >
                        {item}
                        <span className="text-primary/60 hover:text-red-500">×</span>
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <button 
                onClick={onToggle}
                className={`w-full flex items-center justify-between p-3 text-right transition-colors duration-200 
                    ${isOpen ? 'bg-primary/5 border-b border-gray-100' : 'hover:bg-gray-50'}
                `}
            >
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isOpen ? 'text-primary' : 'text-gray-700'}`}>
                            {label || 'اختر الخيارات'}
                        </span>
                        {selected.length > 0 && (
                            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-primary text-white text-[10px] font-bold rounded-full">
                                {selected.length}
                            </span>
                        )}
                    </div>
                    {!isOpen && renderSelectedChips()}
                </div>
                
                {isOpen ? <ChevronUp size={16} className="text-primary flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
            </button>

            {/* Body - Collapsible */}
            {isOpen && (
                <div className="p-3 bg-white max-h-[200px] overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                        {optionsList.map(option => {
                            const isSelected = selected.includes(option);
                            return (
                                <button
                                    key={option}
                                    onClick={() => toggleOption(option)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border
                                        ${isSelected 
                                            ? 'bg-primary text-white border-primary shadow-sm' 
                                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary hover:bg-primary/5'
                                        }
                                    `}
                                >
                                    {isSelected && <Check size={12} className="inline mr-1" />}
                                    {option}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};