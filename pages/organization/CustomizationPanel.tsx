import React, { useState, useEffect } from 'react';
import { Palette, Image, Check, Loader2, Upload } from 'lucide-react';
import { Tenant, TenantSettings } from '../../types/saas.types';
import { organizationService } from '../../services/organizationService';
import toast from 'react-hot-toast';

interface CustomizationPanelProps {
    tenant: Tenant;
    onUpdate?: (tenant: Tenant) => void;
}

const COLOR_PRESETS = [
    { name: 'Indigo', primary: '#4F46E5', accent: '#10B981' },
    { name: 'Blue', primary: '#2563EB', accent: '#F59E0B' },
    { name: 'Purple', primary: '#7C3AED', accent: '#EC4899' },
    { name: 'Teal', primary: '#0D9488', accent: '#6366F1' },
    { name: 'Rose', primary: '#E11D48', accent: '#8B5CF6' },
    { name: 'Emerald', primary: '#059669', accent: '#F97316' }
];

export const CustomizationPanel: React.FC<CustomizationPanelProps> = ({ tenant, onUpdate }) => {
    const [logoUrl, setLogoUrl] = useState(tenant.logoUrl || '');
    const [primaryColor, setPrimaryColor] = useState(tenant.settings.primaryColor);
    const [accentColor, setAccentColor] = useState(tenant.settings.accentColor);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        const changed = 
            logoUrl !== (tenant.logoUrl || '') ||
            primaryColor !== tenant.settings.primaryColor ||
            accentColor !== tenant.settings.accentColor;
        setHasChanges(changed);
    }, [logoUrl, primaryColor, accentColor, tenant]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updated = await organizationService.updateTenant(tenant.id, {
                logoUrl: logoUrl || undefined,
                settings: {
                    ...tenant.settings,
                    primaryColor,
                    accentColor
                }
            });
            
            onUpdate?.(updated);
            toast.success('تم حفظ التخصيصات بنجاح');
            setHasChanges(false);
        } catch (error) {
            console.error('Failed to save customization:', error);
            toast.error('فشل حفظ التخصيصات');
        } finally {
            setIsSaving(false);
        }
    };

    const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
        setPrimaryColor(preset.primary);
        setAccentColor(preset.accent);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Palette size={20} className="text-indigo-500" />
                    <h3 className="font-bold text-gray-800">تخصيص المظهر</h3>
                </div>
                {hasChanges && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                        تغييرات غير محفوظة
                    </span>
                )}
            </div>

            <div className="p-6 space-y-8">
                {/* Logo Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Image size={16} />
                        شعار المدرسة
                    </label>
                    
                    <div className="flex gap-4 items-start">
                        {/* Preview */}
                        <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
                            {logoUrl ? (
                                <img 
                                    src={logoUrl} 
                                    alt="Logo" 
                                    className="w-full h-full object-contain"
                                    onError={() => setLogoUrl('')}
                                />
                            ) : (
                                <Upload size={24} className="text-gray-300" />
                            )}
                        </div>

                        {/* URL Input */}
                        <div className="flex-1">
                            <input
                                type="url"
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                placeholder="https://example.com/logo.png"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-sm"
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                أدخل رابط الشعار (PNG أو SVG يفضل خلفية شفافة)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Colors Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                        الألوان
                    </label>

                    {/* Presets */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {COLOR_PRESETS.map((preset) => (
                            <button
                                key={preset.name}
                                onClick={() => applyPreset(preset)}
                                className={`p-3 rounded-xl border-2 transition ${
                                    primaryColor === preset.primary && accentColor === preset.accent
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex gap-2 mb-2">
                                    <div 
                                        className="w-6 h-6 rounded-full"
                                        style={{ backgroundColor: preset.primary }}
                                    />
                                    <div 
                                        className="w-6 h-6 rounded-full"
                                        style={{ backgroundColor: preset.accent }}
                                    />
                                </div>
                                <span className="text-xs text-gray-600">{preset.name}</span>
                            </button>
                        ))}
                    </div>

                    {/* Custom Colors */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-2">اللون الأساسي</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-2">اللون الثانوي</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={accentColor}
                                    onChange={(e) => setAccentColor(e.target.value)}
                                    className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={accentColor}
                                    onChange={(e) => setAccentColor(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        معاينة
                    </label>
                    <div 
                        className="rounded-2xl p-4 flex items-center gap-4"
                        style={{ backgroundColor: primaryColor }}
                    >
                        {logoUrl ? (
                            <img src={logoUrl} alt="" className="w-12 h-12 rounded-xl bg-white/20 object-contain" />
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-white/20" />
                        )}
                        <div>
                            <div className="text-white font-bold">{tenant.nameAr}</div>
                            <div className="text-white/70 text-sm">{tenant.name}</div>
                        </div>
                        <button 
                            className="mr-auto px-4 py-2 rounded-xl font-medium text-sm"
                            style={{ backgroundColor: accentColor, color: 'white' }}
                        >
                            زر تجريبي
                        </button>
                    </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-gray-100">
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                جاري الحفظ...
                            </>
                        ) : (
                            <>
                                <Check size={18} />
                                حفظ التغييرات
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
