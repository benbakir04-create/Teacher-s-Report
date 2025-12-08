import React, { useState, useCallback } from 'react';
import { 
    Upload, FileSpreadsheet, Check, X, AlertTriangle, 
    Download, Loader2, ChevronDown, ChevronUp,
    Building2, Users, BookOpen, GraduationCap, School, Package, Link2
} from 'lucide-react';
import { 
    parseExcel, 
    validateRows, 
    bulkImport, 
    mapRowToEnglish
} from '../../services/importService';
import {
    downloadTemplate,
    downloadAllTemplatesAsZip,
    validateTemplateVersion,
    TEMPLATE_ENTITIES,
    TEMPLATE_VERSION,
    TemplateOptions
} from '../../services/templateService';
import { 
    ImportType, 
    ValidationResult, 
    ImportResult
} from '../../types/import.types';
import { useTenant } from '../../hooks/useTenant';
import { GoogleSheetsImport } from '../../components/import/GoogleSheetsImport';
import toast from 'react-hot-toast';

interface FileUpload {
    type: ImportType;
    file: File | null;
    rows: Record<string, any>[];
    headers: string[];
    validation: ValidationResult | null;
    result: ImportResult | null;
    status: 'idle' | 'parsing' | 'validating' | 'importing' | 'done' | 'error';
    templateWarnings?: string[];
}

const IMPORT_TYPES: { type: ImportType; label: string; icon: React.ElementType; order: number }[] = [
    { type: 'schools', label: 'المدارس', icon: Building2, order: 1 },
    { type: 'classes', label: 'الفصول', icon: School, order: 2 },
    { type: 'teachers', label: 'المعلمين', icon: Users, order: 3 },
    { type: 'students', label: 'الطلاب وأولياء الأمور', icon: GraduationCap, order: 4 },
    { type: 'subjects', label: 'المواد', icon: BookOpen, order: 5 }
];

// --- Export Templates Modal ---
interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ExportTemplatesModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
    const [selectedTypes, setSelectedTypes] = useState<Set<ImportType>>(new Set(['schools', 'classes', 'teachers', 'students', 'subjects']));
    const [prefill, setPrefill] = useState(true);
    const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
    const [useArabicHeaders, setUseArabicHeaders] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadMode, setDownloadMode] = useState<'individual' | 'zip'>('zip');

    const toggleType = (type: ImportType) => {
        const newSet = new Set(selectedTypes);
        if (newSet.has(type)) {
            newSet.delete(type);
        } else {
            newSet.add(type);
        }
        setSelectedTypes(newSet);
    };

    const handleDownload = async () => {
        if (selectedTypes.size === 0) {
            toast.error('اختر قالباً واحداً على الأقل');
            return;
        }

        setIsDownloading(true);
        try {
            const options: TemplateOptions = { prefill, format, useArabicHeaders, includeExample: true };
            const types = Array.from(selectedTypes) as ImportType[];
            
            if (downloadMode === 'zip') {
                // Download all as single ZIP
                await downloadAllTemplatesAsZip(types, options);
                toast.success(`تم تحميل ${types.length} قوالب في ملف ZIP`);
            } else {
                // Download individually
                for (let i = 0; i < types.length; i++) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                    downloadTemplate(types[i], options);
                }
                toast.success(`تم تحميل ${types.length} قوالب`);
            }
            onClose();
        } catch (err) {
            toast.error('فشل تحميل القوالب');
        } finally {
            setIsDownloading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Package size={20} className="text-emerald-500" />
                        <h2 className="font-bold text-gray-800">تصدير القوالب</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={18} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Template Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            اختر القوالب للتحميل
                        </label>
                        <div className="space-y-2">
                            {TEMPLATE_ENTITIES.map(({ type, label, description }) => (
                                <label 
                                    key={type}
                                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                                        selectedTypes.has(type) 
                                            ? 'border-emerald-500 bg-emerald-50' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedTypes.has(type)}
                                        onChange={() => toggleType(type)}
                                        className="w-4 h-4 text-emerald-600 rounded"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-800">{label}</div>
                                        <div className="text-xs text-gray-500">{description}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={prefill}
                                onChange={(e) => setPrefill(e.target.checked)}
                                className="w-4 h-4 text-emerald-600 rounded"
                            />
                            <div>
                                <div className="font-medium text-gray-800">تضمين الرموز المرجعية</div>
                                <div className="text-xs text-gray-500">إضافة أوراق بقيم school_code و class_code الموجودة</div>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useArabicHeaders}
                                onChange={(e) => setUseArabicHeaders(e.target.checked)}
                                className="w-4 h-4 text-emerald-600 rounded"
                            />
                            <div>
                                <div className="font-medium text-gray-800">عناوين عربية</div>
                                <div className="text-xs text-gray-500">استخدام أسماء الأعمدة بالعربية</div>
                            </div>
                        </label>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setFormat('xlsx')}
                                className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                                    format === 'xlsx' 
                                        ? 'bg-emerald-500 text-white' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Excel (.xlsx)
                            </button>
                            <button
                                onClick={() => setFormat('csv')}
                                className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                                    format === 'csv' 
                                        ? 'bg-emerald-500 text-white' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                CSV (UTF-8)
                            </button>
                        </div>

                        {/* Download Mode */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">طريقة التحميل</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setDownloadMode('zip')}
                                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                                        downloadMode === 'zip' 
                                            ? 'bg-emerald-500 text-white' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    📦 ملف ZIP واحد
                                </button>
                                <button
                                    onClick={() => setDownloadMode('individual')}
                                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                                        downloadMode === 'individual' 
                                            ? 'bg-emerald-500 text-white' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    📄 ملفات منفصلة
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Version Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <div className="text-xs text-blue-700">
                            <strong>إصدار القالب:</strong> {TEMPLATE_VERSION}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                            القوالب تتضمن سطر تعليمات وأمثلة لتسهيل الإدخال
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading || selectedTypes.size === 0}
                        className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isDownloading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                جاري التحميل...
                            </>
                        ) : (
                            <>
                                <Download size={18} />
                                تحميل {selectedTypes.size} قوالب
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
export const ImportCenter: React.FC = () => {
    const { hasPermission } = useTenant();
    const [uploads, setUploads] = useState<Record<ImportType, FileUpload>>(() => {
        const initial: Record<ImportType, FileUpload> = {} as Record<ImportType, FileUpload>;
        IMPORT_TYPES.forEach(t => {
            initial[t.type] = {
                type: t.type,
                file: null,
                rows: [],
                headers: [],
                validation: null,
                result: null,
                status: 'idle'
            };
        });
        return initial;
    });
    const [isImporting, setIsImporting] = useState(false);
    const [expandedType, setExpandedType] = useState<ImportType | null>(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'excel' | 'sheets'>('excel');

    const canImport = hasPermission('tenants', 'manage');

    const handleFileSelect = useCallback(async (type: ImportType, file: File) => {
        setUploads(prev => ({
            ...prev,
            [type]: { ...prev[type], file, status: 'parsing', templateWarnings: [] }
        }));

        try {
            // Validate template version first
            const templateValidation = await validateTemplateVersion(file);
            const templateWarnings = templateValidation.warnings;

            const result = await parseExcel(file);
            
            if (result.errors.length > 0) {
                toast.error(result.errors[0]);
                setUploads(prev => ({
                    ...prev,
                    [type]: { ...prev[type], status: 'error', templateWarnings }
                }));
                return;
            }

            const sheet = result.sheets[0];
            if (!sheet) {
                toast.error('الملف فارغ');
                setUploads(prev => ({
                    ...prev,
                    [type]: { ...prev[type], status: 'error', templateWarnings }
                }));
                return;
            }

            // Filter out template metadata rows (starting with _)
            let rows = sheet.rows.filter(row => {
                const firstValue = Object.values(row)[0];
                return typeof firstValue !== 'string' || !firstValue.startsWith('_template');
            });

            // Skip hint row if present
            if (rows.length > 0) {
                const firstRowValues = Object.values(rows[0]);
                if (firstRowValues.some(v => typeof v === 'string' && v.includes('مطلوب'))) {
                    rows = rows.slice(1);
                }
            }

            setUploads(prev => ({
                ...prev,
                [type]: { ...prev[type], status: 'validating', rows: sheet.rows, headers: sheet.headers, templateWarnings }
            }));

            const mappedRows = rows.map(mapRowToEnglish);
            const validation = validateRows(mappedRows, type);

            setUploads(prev => ({
                ...prev,
                [type]: { 
                    ...prev[type], 
                    validation, 
                    status: validation.isValid ? 'idle' : 'error',
                    rows: mappedRows,
                    templateWarnings
                }
            }));

            if (templateWarnings.length > 0) {
                toast(templateWarnings[0], { icon: '⚠️' });
            }

            if (validation.isValid) {
                toast.success(`تم تحميل ${validation.validRows} سجل`);
            } else {
                toast.error(`${validation.errors.length} أخطاء في التحقق`);
            }
        } catch (err) {
            console.error('Parse error:', err);
            toast.error('فشل قراءة الملف');
            setUploads(prev => ({
                ...prev,
                [type]: { ...prev[type], status: 'error' }
            }));
        }
    }, []);

    const handleImportAll = async () => {
        setIsImporting(true);
        
        try {
            const files = IMPORT_TYPES
                .filter(t => uploads[t.type].rows.length > 0 && uploads[t.type].validation?.isValid)
                .map(t => ({ type: t.type, rows: uploads[t.type].rows }));

            if (files.length === 0) {
                toast.error('لا توجد ملفات صالحة للاستيراد');
                setIsImporting(false);
                return;
            }

            files.forEach(f => {
                setUploads(prev => ({
                    ...prev,
                    [f.type]: { ...prev[f.type], status: 'importing' }
                }));
            });

            const result = await bulkImport(files);

            for (const [type, importResult] of Object.entries(result)) {
                if (type !== 'totalDuration' && type !== 'summary' && importResult) {
                    setUploads(prev => ({
                        ...prev,
                        [type]: { 
                            ...prev[type as ImportType], 
                            result: importResult as ImportResult, 
                            status: 'done' 
                        }
                    }));
                }
            }

            toast.success(
                `تم الاستيراد: ${result.summary.totalCreated} جديد, ${result.summary.totalUpdated} تحديث`
            );
        } catch (err) {
            console.error('Import error:', err);
            toast.error('فشل الاستيراد');
        } finally {
            setIsImporting(false);
        }
    };

    const handleDownloadTemplate = async (type: ImportType) => {
        try {
            downloadTemplate(type, { prefill: true, useArabicHeaders: true });
            toast.success('تم تحميل القالب');
        } catch (err) {
            toast.error('فشل تحميل القالب');
        }
    };

    const resetUpload = (type: ImportType) => {
        setUploads(prev => ({
            ...prev,
            [type]: {
                type,
                file: null,
                rows: [],
                headers: [],
                validation: null,
                result: null,
                status: 'idle'
            }
        }));
    };

    const readyCount = IMPORT_TYPES.filter(
        t => uploads[t.type].validation?.isValid && uploads[t.type].status !== 'done'
    ).length;

    if (!canImport) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" />
                    <h2 className="text-xl font-bold text-gray-800">غير مصرح</h2>
                    <p className="text-gray-500">ليس لديك صلاحية الوصول لمركز الاستيراد</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-8">
            {/* Export Modal */}
            <ExportTemplatesModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />

            {/* Header */}
            <div className="bg-gradient-to-bl from-emerald-600 to-teal-700 px-6 py-8 text-white">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <Upload size={28} />
                            <h1 className="text-2xl font-bold">مركز الاستيراد</h1>
                        </div>
                        <button
                            onClick={() => setShowExportModal(true)}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition flex items-center gap-2"
                        >
                            <Package size={16} />
                            تصدير القوالب
                        </button>
                    </div>
                    <p className="text-white/70">استيراد البيانات من ملفات Excel أو Google Sheets</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-4">
                {/* Import Source Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-4 flex gap-2">
                    <button
                        onClick={() => setActiveTab('excel')}
                        className={`flex-1 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                            activeTab === 'excel'
                                ? 'bg-emerald-500 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <FileSpreadsheet size={18} />
                        رفع ملف Excel
                    </button>
                    <button
                        onClick={() => setActiveTab('sheets')}
                        className={`flex-1 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                            activeTab === 'sheets'
                                ? 'bg-green-500 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <Link2 size={18} />
                        Google Sheets
                    </button>
                </div>

                {/* Google Sheets Tab */}
                {activeTab === 'sheets' && (
                    <div className="mb-6">
                        <GoogleSheetsImport
                            onDataImported={(type, rows) => {
                                setUploads(prev => ({
                                    ...prev,
                                    [type]: {
                                        ...prev[type],
                                        rows,
                                        status: 'idle',
                                        validation: null
                                    }
                                }));
                            }}
                        />
                    </div>
                )}
                {/* Import Cards */}
                <div className="space-y-4">
                    {IMPORT_TYPES.map(({ type, label, icon: Icon }) => {
                        const upload = uploads[type];
                        const isExpanded = expandedType === type;

                        return (
                            <div 
                                key={type}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                            >
                                {/* Card Header */}
                                <div className="p-4 flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                        upload.status === 'done' ? 'bg-green-100' :
                                        upload.status === 'error' ? 'bg-red-100' :
                                        upload.rows.length > 0 ? 'bg-blue-100' :
                                        'bg-gray-100'
                                    }`}>
                                        <Icon size={24} className={
                                            upload.status === 'done' ? 'text-green-600' :
                                            upload.status === 'error' ? 'text-red-600' :
                                            upload.rows.length > 0 ? 'text-blue-600' :
                                            'text-gray-400'
                                        } />
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800">{label}</h3>
                                        <p className="text-sm text-gray-500">
                                            {upload.status === 'parsing' && 'جاري القراءة...'}
                                            {upload.status === 'validating' && 'جاري التحقق...'}
                                            {upload.status === 'importing' && 'جاري الاستيراد...'}
                                            {upload.status === 'done' && upload.result && (
                                                <span className="text-green-600">
                                                    ✓ {upload.result.stats.created} جديد, {upload.result.stats.updated} تحديث
                                                </span>
                                            )}
                                            {upload.status === 'error' && upload.validation && (
                                                <span className="text-red-600">
                                                    ✗ {upload.validation.errors.length} أخطاء
                                                </span>
                                            )}
                                            {upload.status === 'idle' && upload.rows.length > 0 && (
                                                <span className="text-blue-600">
                                                    {upload.rows.length} سجل جاهز
                                                </span>
                                            )}
                                            {upload.status === 'idle' && upload.rows.length === 0 && 'لم يتم تحميل ملف'}
                                        </p>
                                        {/* Template Warnings */}
                                        {upload.templateWarnings && upload.templateWarnings.length > 0 && (
                                            <p className="text-xs text-amber-600 mt-1">
                                                ⚠️ {upload.templateWarnings[0]}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleDownloadTemplate(type)}
                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                            title="تحميل قالب"
                                        >
                                            <Download size={18} />
                                        </button>

                                        <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl cursor-pointer transition flex items-center gap-2">
                                            <FileSpreadsheet size={16} />
                                            <span className="text-sm font-medium">تحميل</span>
                                            <input
                                                type="file"
                                                accept=".xlsx,.xls,.csv"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleFileSelect(type, file);
                                                }}
                                            />
                                        </label>

                                        {(upload.rows.length > 0 || upload.validation) && (
                                            <button
                                                onClick={() => setExpandedType(isExpanded ? null : type)}
                                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                                            >
                                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </button>
                                        )}

                                        {upload.rows.length > 0 && (
                                            <button
                                                onClick={() => resetUpload(type)}
                                                className="p-2 text-gray-400 hover:text-red-600 rounded-lg"
                                                title="إعادة تعيين"
                                            >
                                                <X size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 p-4 bg-gray-50">
                                        {upload.rows.length > 0 && (
                                            <div className="mb-4">
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                                    معاينة ({Math.min(10, upload.rows.length)} من {upload.rows.length})
                                                </h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-xs">
                                                        <thead className="bg-gray-100">
                                                            <tr>
                                                                {Object.keys(upload.rows[0] || {}).slice(0, 6).map(key => (
                                                                    <th key={key} className="px-2 py-1 text-right text-gray-600">
                                                                        {key}
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {upload.rows.slice(0, 10).map((row, i) => (
                                                                <tr key={i} className="border-b border-gray-100">
                                                                    {Object.values(row).slice(0, 6).map((val, j) => (
                                                                        <td key={j} className="px-2 py-1 text-gray-800">
                                                                            {String(val).slice(0, 20)}
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {upload.validation && upload.validation.errors.length > 0 && (
                                            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                                <h4 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-2">
                                                    <X size={14} />
                                                    أخطاء التحقق ({upload.validation.errors.length})
                                                </h4>
                                                <ul className="space-y-1 max-h-40 overflow-y-auto">
                                                    {upload.validation.errors.slice(0, 20).map((err, i) => (
                                                        <li key={i} className="text-xs text-red-600">
                                                            سطر {err.row}: {err.field} - {err.message}
                                                        </li>
                                                    ))}
                                                    {upload.validation.errors.length > 20 && (
                                                        <li className="text-xs text-red-500 font-medium">
                                                            و {upload.validation.errors.length - 20} خطأ آخر...
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>
                                        )}

                                        {upload.validation && upload.validation.warnings.length > 0 && (
                                            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                                                <h4 className="text-sm font-bold text-amber-700 mb-2 flex items-center gap-2">
                                                    <AlertTriangle size={14} />
                                                    تحذيرات ({upload.validation.warnings.length})
                                                </h4>
                                                <ul className="space-y-1 max-h-20 overflow-y-auto">
                                                    {upload.validation.warnings.slice(0, 10).map((warn, i) => (
                                                        <li key={i} className="text-xs text-amber-600">
                                                            سطر {warn.row}: {warn.message}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Import Button */}
                <div className="mt-6 flex justify-center">
                    <button
                        onClick={handleImportAll}
                        disabled={isImporting || readyCount === 0}
                        className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                    >
                        {isImporting ? (
                            <>
                                <Loader2 size={24} className="animate-spin" />
                                جاري الاستيراد...
                            </>
                        ) : (
                            <>
                                <Upload size={24} />
                                استيراد {readyCount} ملفات
                            </>
                        )}
                    </button>
                </div>

                {/* Summary */}
                {Object.values(uploads).some(u => u.status === 'done') && (
                    <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-6">
                        <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                            <Check size={20} />
                            ملخص الاستيراد
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {IMPORT_TYPES.map(({ type, label }) => {
                                const upload = uploads[type];
                                if (!upload.result) return null;
                                
                                return (
                                    <div key={type} className="bg-white rounded-xl p-3 text-center">
                                        <div className="text-lg font-bold text-green-600">
                                            {upload.result.stats.created + upload.result.stats.updated}
                                        </div>
                                        <div className="text-xs text-gray-500">{label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
