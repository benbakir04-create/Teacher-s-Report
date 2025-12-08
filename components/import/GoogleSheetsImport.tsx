/**
 * Google Sheets Import Component
 * 
 * UI for connecting to Google Sheets and importing data live.
 * Part of Phase 12: Google Sheets Live Integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    FileSpreadsheet, Link2, Check, X, AlertTriangle,
    Loader2, RefreshCw, Settings, ChevronDown, ChevronUp,
    Building2, Users, BookOpen, GraduationCap, School, Unlink, Clock, Play, Pause
} from 'lucide-react';
import {
    extractSpreadsheetId,
    syncFromGoogleSheets,
    testSheetConnection,
    loadSheetConfig,
    saveSheetConfig,
    clearSheetConfig,
    SheetConfig,
    SheetSyncResult,
    SHEET_NAMES,
    DEFAULT_SHEET_GIDS,
    autoSyncManager,
    AutoSyncState
} from '../../services/googleSheetsService';
import { validateRows } from '../../services/importService';
import { ImportType, IMPORT_SCHEMAS } from '../../types/import.types';
import toast from 'react-hot-toast';

const IMPORT_TYPES: { type: ImportType; label: string; icon: React.ElementType }[] = [
    { type: 'schools', label: 'المدارس', icon: Building2 },
    { type: 'classes', label: 'الفصول', icon: School },
    { type: 'teachers', label: 'المعلمين', icon: Users },
    { type: 'students', label: 'الطلاب', icon: GraduationCap },
    { type: 'subjects', label: 'المواد', icon: BookOpen }
];

interface Props {
    onDataImported?: (type: ImportType, rows: Record<string, any>[]) => void;
}

export const GoogleSheetsImport: React.FC<Props> = ({ onDataImported }) => {
    const [sheetUrl, setSheetUrl] = useState('');
    const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [syncResult, setSyncResult] = useState<SheetSyncResult | null>(null);
    const [expandedType, setExpandedType] = useState<ImportType | null>(null);
    const [sheetGids, setSheetGids] = useState<Record<ImportType, string>>(DEFAULT_SHEET_GIDS);
    const [enabledSheets, setEnabledSheets] = useState<Set<ImportType>>(new Set(['schools', 'classes', 'teachers', 'students', 'subjects']));
    const [autoSyncState, setAutoSyncState] = useState<AutoSyncState>(autoSyncManager.getState());
    const [autoSyncInterval, setAutoSyncInterval] = useState(5);

    // Load saved config on mount
    useEffect(() => {
        const config = loadSheetConfig();
        if (config) {
            setSpreadsheetId(config.spreadsheetId);
            setIsConnected(true);
            
            const gids: Record<ImportType, string> = {} as any;
            const enabled = new Set<ImportType>();
            
            Object.entries(config.sheets).forEach(([type, sheet]) => {
                gids[type as ImportType] = sheet.gid;
                if (sheet.enabled) enabled.add(type as ImportType);
            });
            
            setSheetGids({ ...DEFAULT_SHEET_GIDS, ...gids });
            setEnabledSheets(enabled);
            
            // Load auto-sync state
            setAutoSyncState(autoSyncManager.getState());
            if (config.autoSync) {
                setAutoSyncInterval(config.autoSync.intervalMinutes);
            }
        }

        // Subscribe to auto-sync updates
        const unsubscribe = autoSyncManager.onSync((result) => {
            setSyncResult(result);
            setAutoSyncState(autoSyncManager.getState());
            if (onDataImported) {
                Object.entries(result.results).forEach(([type, data]) => {
                    if (data.rows.length > 0) {
                        onDataImported(type as ImportType, data.rows);
                    }
                });
            }
        });

        return () => unsubscribe();
    }, [onDataImported]);

    const handleConnect = async () => {
        const id = extractSpreadsheetId(sheetUrl);
        if (!id) {
            toast.error('رابط Google Sheet غير صالح');
            return;
        }

        setIsConnecting(true);
        try {
            const result = await testSheetConnection(sheetUrl);
            
            if (!result.success) {
                toast.error(result.error || 'فشل الاتصال');
                return;
            }

            setSpreadsheetId(id);
            setIsConnected(true);
            
            // Save config
            const config: SheetConfig = {
                spreadsheetId: id,
                sheets: {} as any
            };
            IMPORT_TYPES.forEach(({ type }) => {
                config.sheets[type] = { gid: sheetGids[type], enabled: enabledSheets.has(type) };
            });
            saveSheetConfig(config);

            toast.success('تم الاتصال بنجاح! يمكنك الآن المزامنة.');
        } catch (err) {
            toast.error('فشل الاتصال بالورقة');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = () => {
        clearSheetConfig();
        setSpreadsheetId(null);
        setIsConnected(false);
        setSyncResult(null);
        setSheetUrl('');
        toast.success('تم قطع الاتصال');
    };

    const handleSync = useCallback(async () => {
        if (!spreadsheetId) return;

        setIsSyncing(true);
        setSyncResult(null);

        try {
            const result = await syncFromGoogleSheets(
                spreadsheetId,
                sheetGids,
                Array.from(enabledSheets)
            );

            setSyncResult(result);

            if (result.success) {
                toast.success(`تم جلب ${result.totalRows} سجل في ${result.duration}ms`);
                
                // Notify parent of imported data
                if (onDataImported) {
                    Object.entries(result.results).forEach(([type, data]) => {
                        if (data.rows.length > 0) {
                            onDataImported(type as ImportType, data.rows);
                        }
                    });
                }
            } else {
                toast.error(`${result.errors.length} أخطاء في المزامنة`);
            }
        } catch (err) {
            toast.error('فشلت المزامنة');
        } finally {
            setIsSyncing(false);
        }
    }, [spreadsheetId, sheetGids, enabledSheets, onDataImported]);

    const toggleSheet = (type: ImportType) => {
        const newEnabled = new Set(enabledSheets);
        if (newEnabled.has(type)) {
            newEnabled.delete(type);
        } else {
            newEnabled.add(type);
        }
        setEnabledSheets(newEnabled);
    };

    const updateGid = (type: ImportType, gid: string) => {
        setSheetGids(prev => ({ ...prev, [type]: gid }));
    };

    const toggleAutoSync = () => {
        if (autoSyncState.isRunning) {
            autoSyncManager.stop();
        } else {
            autoSyncManager.start(autoSyncInterval);
        }
        setAutoSyncState(autoSyncManager.getState());
    };

    const updateAutoSyncInterval = (minutes: number) => {
        setAutoSyncInterval(minutes);
        if (autoSyncState.isRunning) {
            autoSyncManager.start(minutes);
            setAutoSyncState(autoSyncManager.getState());
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileSpreadsheet size={24} />
                        <div>
                            <h3 className="font-bold">Google Sheets</h3>
                            <p className="text-sm text-white/70">استدعاء مباشر من جوجل شيت</p>
                        </div>
                    </div>
                    {isConnected && (
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                            <span className="text-sm">متصل</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Connection Form */}
                {!isConnected ? (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                رابط Google Sheet
                            </label>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Link2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={sheetUrl}
                                        onChange={(e) => setSheetUrl(e.target.value)}
                                        placeholder="https://docs.google.com/spreadsheets/d/..."
                                        className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        dir="ltr"
                                    />
                                </div>
                                <button
                                    onClick={handleConnect}
                                    disabled={isConnecting || !sheetUrl.trim()}
                                    className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isConnecting ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Check size={18} />
                                    )}
                                    اتصال
                                </button>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                            <h4 className="text-sm font-bold text-blue-800 mb-2">📋 التعليمات</h4>
                            <ol className="space-y-1 text-xs text-blue-700 list-decimal list-inside">
                                <li>افتح Google Sheet الخاص بك</li>
                                <li>اضغط "مشاركة" → "أي شخص لديه الرابط"</li>
                                <li>انسخ الرابط والصقه هنا</li>
                                <li>تأكد أن كل ورقة تحتوي على headers في الصف الأول</li>
                            </ol>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Connected State */}
                        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
                            <div className="flex items-center gap-2">
                                <Check size={18} className="text-green-600" />
                                <span className="text-sm text-green-800 font-medium">
                                    متصل بـ Sheet ID: {spreadsheetId?.slice(0, 15)}...
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                    title="الإعدادات"
                                >
                                    <Settings size={18} />
                                </button>
                                <button
                                    onClick={handleDisconnect}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                    title="قطع الاتصال"
                                >
                                    <Unlink size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Settings Panel */}
                        {showSettings && (
                            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                <h4 className="font-medium text-gray-800">إعدادات الأوراق</h4>
                                <div className="space-y-2">
                                    {IMPORT_TYPES.map(({ type, label, icon: Icon }) => (
                                        <div key={type} className="flex items-center gap-3 bg-white rounded-lg p-3">
                                            <input
                                                type="checkbox"
                                                checked={enabledSheets.has(type)}
                                                onChange={() => toggleSheet(type)}
                                                className="w-4 h-4 text-emerald-600 rounded"
                                            />
                                            <Icon size={18} className="text-gray-400" />
                                            <span className="flex-1 text-sm font-medium text-gray-700">{label}</span>
                                            <input
                                                type="text"
                                                value={sheetGids[type]}
                                                onChange={(e) => updateGid(type, e.target.value)}
                                                placeholder="GID"
                                                className="w-20 px-2 py-1 text-xs border border-gray-200 rounded text-center"
                                                dir="ltr"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500">
                                    GID = رقم الورقة (0 للأولى، 1 للثانية، إلخ)
                                </p>

                                {/* Auto-Sync Settings */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Clock size={18} className="text-gray-500" />
                                            <span className="font-medium text-gray-800">مزامنة تلقائية</span>
                                        </div>
                                        <button
                                            onClick={toggleAutoSync}
                                            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition ${
                                                autoSyncState.isRunning
                                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                            }`}
                                        >
                                            {autoSyncState.isRunning ? (
                                                <><Pause size={16} /> إيقاف</>
                                            ) : (
                                                <><Play size={16} /> تشغيل</>
                                            )}
                                        </button>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-600">كل</span>
                                        <select
                                            value={autoSyncInterval}
                                            onChange={(e) => updateAutoSyncInterval(Number(e.target.value))}
                                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                        >
                                            <option value={1}>1 دقيقة</option>
                                            <option value={5}>5 دقائق</option>
                                            <option value={10}>10 دقائق</option>
                                            <option value={15}>15 دقيقة</option>
                                            <option value={30}>30 دقيقة</option>
                                            <option value={60}>1 ساعة</option>
                                        </select>
                                    </div>

                                    {autoSyncState.isRunning && (
                                        <div className="mt-3 text-xs text-gray-500 bg-blue-50 rounded-lg p-2">
                                            <div>✓ عدد المزامنات: {autoSyncState.syncCount}</div>
                                            {autoSyncState.lastSync && (
                                                <div>آخر مزامنة: {autoSyncState.lastSync.toLocaleTimeString('ar-SA')}</div>
                                            )}
                                            {autoSyncState.nextSync && (
                                                <div>المزامنة القادمة: {autoSyncState.nextSync.toLocaleTimeString('ar-SA')}</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Sync Button */}
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-bold text-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {isSyncing ? (
                                <>
                                    <Loader2 size={24} className="animate-spin" />
                                    جاري المزامنة...
                                </>
                            ) : (
                                <>
                                    <RefreshCw size={24} />
                                    🔄 مزامنة البيانات
                                </>
                            )}
                        </button>

                        {/* Sync Results */}
                        {syncResult && (
                            <div className="space-y-3">
                                {/* Summary */}
                                <div className={`rounded-xl p-4 ${syncResult.success ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {syncResult.success ? (
                                                <Check size={18} className="text-green-600" />
                                            ) : (
                                                <AlertTriangle size={18} className="text-amber-600" />
                                            )}
                                            <span className={`font-bold ${syncResult.success ? 'text-green-800' : 'text-amber-800'}`}>
                                                {syncResult.success ? 'تمت المزامنة بنجاح' : 'مزامنة جزئية'}
                                            </span>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {syncResult.duration}ms
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        إجمالي السجلات: <strong>{syncResult.totalRows}</strong>
                                    </div>
                                </div>

                                {/* Per-sheet results */}
                                <div className="space-y-2">
                                    {IMPORT_TYPES.map(({ type, label, icon: Icon }) => {
                                        const result = syncResult.results[type];
                                        if (!result) return null;

                                        const isExpanded = expandedType === type;
                                        const hasError = !!result.error;

                                        return (
                                            <div key={type} className="border border-gray-200 rounded-xl overflow-hidden">
                                                <div 
                                                    className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 ${hasError ? 'bg-red-50' : ''}`}
                                                    onClick={() => setExpandedType(isExpanded ? null : type)}
                                                >
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                        hasError ? 'bg-red-100' : 'bg-green-100'
                                                    }`}>
                                                        <Icon size={20} className={hasError ? 'text-red-600' : 'text-green-600'} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-800">{label}</div>
                                                        <div className="text-sm text-gray-500">
                                                            {hasError ? (
                                                                <span className="text-red-600">{result.error}</span>
                                                            ) : (
                                                                <span>{result.rowCount} سجل</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {result.rows.length > 0 && (
                                                        isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />
                                                    )}
                                                </div>

                                                {/* Expanded Preview */}
                                                {isExpanded && result.rows.length > 0 && (
                                                    <div className="border-t border-gray-100 p-3 bg-gray-50 overflow-x-auto">
                                                        <table className="w-full text-xs">
                                                            <thead>
                                                                <tr className="bg-gray-100">
                                                                    {Object.keys(result.rows[0]).slice(0, 5).map(key => (
                                                                        <th key={key} className="px-2 py-1 text-right text-gray-600">
                                                                            {key}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {result.rows.slice(0, 5).map((row, i) => (
                                                                    <tr key={i} className="border-b border-gray-100">
                                                                        {Object.values(row).slice(0, 5).map((val, j) => (
                                                                            <td key={j} className="px-2 py-1 text-gray-800">
                                                                                {String(val).slice(0, 25)}
                                                                            </td>
                                                                        ))}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                        {result.rows.length > 5 && (
                                                            <p className="text-xs text-gray-500 mt-2 text-center">
                                                                و {result.rows.length - 5} سجلات أخرى...
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
