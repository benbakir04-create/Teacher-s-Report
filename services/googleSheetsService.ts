/**
 * Google Sheets Service
 * 
 * Fetches and parses data from Google Sheets using published CSV URLs.
 * No API key required - uses public/shared sheet URLs.
 * 
 * Phase 12: Google Sheets Live Integration
 */

import { ImportType, IMPORT_SCHEMAS } from '../types/import.types';
import { validateRows, mapRowToEnglish } from './importService';

// --- Legacy Stubs for offlineService compatibility ---

/**
 * Legacy stub: Save report to Google Sheets
 * TODO: Implement actual Google Sheets API write when needed
 */
export async function saveReport(_report: any): Promise<{ success: boolean; error?: string }> {
    console.log('[googleSheetsService] saveReport: stub function called');
    return { success: true };
}

/**
 * Legacy stub: Save backup to Google Sheets
 */
export async function saveBackup(_data: any): Promise<{ success: boolean; error?: string }> {
    console.log('[googleSheetsService] saveBackup: stub function called');
    return { success: true };
}

/**
 * Legacy stub: Log error to Google Sheets
 */
export async function logError(_error: any): Promise<void> {
    console.log('[googleSheetsService] logError: stub function called');
}

/**
 * Legacy stub: Process sync queue for offline sync
 */
export async function processSyncQueue(): Promise<{ success: boolean; processed: number; failed: number }> {
    console.log('[googleSheetsService] processSyncQueue: stub function called');
    return { success: true, processed: 0, failed: 0 };
}

// --- Types ---

export interface SheetConfig {
    spreadsheetId: string;
    sheets: Record<ImportType, { gid: string; enabled: boolean }>;
    // API configuration for write operations
    apiConfig?: {
        webAppUrl?: string;  // Google Apps Script Web App URL for write operations
        apiKey?: string;     // Optional API key if using direct Sheets API
    };
    // Auto-sync configuration
    autoSync?: {
        enabled: boolean;
        intervalMinutes: number;
        lastSync?: string;
    };
}

export interface WriteResult {
    success: boolean;
    rowsWritten: number;
    error?: string;
}

export interface AutoSyncState {
    isRunning: boolean;
    intervalMinutes: number;
    lastSync: Date | null;
    nextSync: Date | null;
    syncCount: number;
}

export interface SheetFetchResult {
    type: ImportType;
    rows: Record<string, any>[];
    headers: string[];
    rowCount: number;
    fetchedAt: Date;
    error?: string;
}

export interface SheetSyncResult {
    success: boolean;
    results: Record<ImportType, SheetFetchResult>;
    totalRows: number;
    errors: string[];
    duration: number;
}

// --- URL Parsing & Building ---

/**
 * Extract spreadsheet ID from a Google Sheets URL
 * Supports formats:
 *   - https://docs.google.com/spreadsheets/d/{ID}/edit
 *   - https://docs.google.com/spreadsheets/d/{ID}/export?format=csv
 */
export function extractSpreadsheetId(url: string): string | null {
    const patterns = [
        /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
        /^([a-zA-Z0-9-_]{20,})$/  // Direct ID
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

/**
 * Build CSV export URL for a specific sheet
 * @param spreadsheetId - The Google Spreadsheet ID
 * @param gid - The sheet GID (0 for first sheet)
 */
export function buildCsvUrl(spreadsheetId: string, gid: string = '0'): string {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
}

/**
 * Build published CSV URL (for sheets shared as "Anyone with link can view")
 */
export function buildPublishedCsvUrl(spreadsheetId: string, gid: string = '0'): string {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
}

// --- CSV Parsing ---

function parseCSV(csvText: string): { headers: string[]; rows: Record<string, any>[] } {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return { headers: [], rows: [] };

    // Parse header row
    const headers = parseCSVLine(lines[0]);

    // Parse data rows
    const rows: Record<string, any>[] = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.every(v => !v.trim())) continue; // Skip empty rows

        const row: Record<string, any> = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        rows.push(row);
    }

    return { headers, rows };
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());

    return result;
}

// --- Sheet Fetching ---

export async function fetchSheetAsCSV(
    spreadsheetId: string,
    gid: string = '0',
    usePublishedUrl: boolean = true
): Promise<{ headers: string[]; rows: Record<string, any>[]; error?: string }> {
    const url = usePublishedUrl
        ? buildPublishedCsvUrl(spreadsheetId, gid)
        : buildCsvUrl(spreadsheetId, gid);

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 403) {
                return { headers: [], rows: [], error: 'الورقة غير مشاركة. تأكد من مشاركتها كـ "Anyone with link can view"' };
            }
            return { headers: [], rows: [], error: `خطأ في الاتصال: ${response.status}` };
        }

        const csvText = await response.text();
        
        // Check if it's an HTML error page
        if (csvText.includes('<!DOCTYPE html>') || csvText.includes('<html>')) {
            return { headers: [], rows: [], error: 'الورقة غير متاحة. تأكد من صحة الرابط والمشاركة' };
        }

        return parseCSV(csvText);
    } catch (err) {
        return { 
            headers: [], 
            rows: [], 
            error: `فشل الاتصال: ${err instanceof Error ? err.message : 'خطأ غير معروف'}` 
        };
    }
}

// --- Multi-Sheet Sync ---

/**
 * Default GIDs for standard sheet structure
 * User can customize these in settings
 */
export const DEFAULT_SHEET_GIDS: Record<ImportType, string> = {
    schools: '0',
    classes: '1',
    teachers: '2',
    students: '3',
    subjects: '4'
};

export const SHEET_NAMES: Record<ImportType, string> = {
    schools: 'المدارس',
    classes: 'الفصول',
    teachers: 'المعلمين',
    students: 'الطلاب',
    subjects: 'المواد'
};

export async function syncFromGoogleSheets(
    spreadsheetId: string,
    sheetGids: Partial<Record<ImportType, string>> = DEFAULT_SHEET_GIDS,
    enabledSheets: ImportType[] = ['schools', 'classes', 'teachers', 'students', 'subjects']
): Promise<SheetSyncResult> {
    const startTime = Date.now();
    const results: Record<ImportType, SheetFetchResult> = {} as Record<ImportType, SheetFetchResult>;
    const errors: string[] = [];
    let totalRows = 0;

    // Fetch sheets in order (respecting FK dependencies)
    const orderedTypes: ImportType[] = ['schools', 'classes', 'teachers', 'students', 'subjects'];

    for (const type of orderedTypes) {
        if (!enabledSheets.includes(type)) continue;

        const gid = sheetGids[type] || DEFAULT_SHEET_GIDS[type];
        const result = await fetchSheetAsCSV(spreadsheetId, gid);

        if (result.error) {
            errors.push(`${SHEET_NAMES[type]}: ${result.error}`);
            results[type] = {
                type,
                rows: [],
                headers: [],
                rowCount: 0,
                fetchedAt: new Date(),
                error: result.error
            };
            continue;
        }

        // Map headers to English
        const mappedRows = result.rows.map(mapRowToEnglish);

        results[type] = {
            type,
            rows: mappedRows,
            headers: result.headers,
            rowCount: mappedRows.length,
            fetchedAt: new Date()
        };

        totalRows += mappedRows.length;
    }

    return {
        success: errors.length === 0,
        results,
        totalRows,
        errors,
        duration: Date.now() - startTime
    };
}

// --- Storage & Settings ---

const STORAGE_KEY = 'google_sheets_config';

export function saveSheetConfig(config: SheetConfig): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function loadSheetConfig(): SheetConfig | null {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
}

export function clearSheetConfig(): void {
    localStorage.removeItem(STORAGE_KEY);
}

// --- Validation Integration ---

export async function validateAndImportFromSheets(
    spreadsheetId: string,
    sheetGids?: Partial<Record<ImportType, string>>
): Promise<{
    syncResult: SheetSyncResult;
    validationResults: Record<ImportType, { isValid: boolean; errors: number; warnings: number }>;
}> {
    const syncResult = await syncFromGoogleSheets(spreadsheetId, sheetGids);
    const validationResults: Record<ImportType, { isValid: boolean; errors: number; warnings: number }> = {} as any;

    // Build existing codes map from fetched data
    const existingCodes = new Map<string, Set<string>>();

    for (const type of ['schools', 'classes', 'teachers', 'students', 'subjects'] as ImportType[]) {
        const result = syncResult.results[type];
        if (!result || result.error) continue;

        const validation = validateRows(result.rows, type, existingCodes);
        validationResults[type] = {
            isValid: validation.isValid,
            errors: validation.errors.length,
            warnings: validation.warnings.length
        };

        // Add codes to existing for FK validation
        const codeField = IMPORT_SCHEMAS[type].find(f => f.name.endsWith('_code') && f.required);
        if (codeField) {
            const codes = new Set(result.rows.map(r => String(r[codeField.name] || '')).filter(Boolean));
            existingCodes.set(type, codes);
        }
    }

    return { syncResult, validationResults };
}

// --- Quick Test Function ---

export async function testSheetConnection(url: string): Promise<{
    success: boolean;
    spreadsheetId: string | null;
    sheetsFound: string[];
    error?: string;
}> {
    const spreadsheetId = extractSpreadsheetId(url);
    if (!spreadsheetId) {
        return { success: false, spreadsheetId: null, sheetsFound: [], error: 'رابط غير صالح' };
    }

    // Try to fetch first sheet
    const result = await fetchSheetAsCSV(spreadsheetId, '0');
    
    if (result.error) {
        return { success: false, spreadsheetId, sheetsFound: [], error: result.error };
    }

    return {
        success: true,
        spreadsheetId,
        sheetsFound: result.headers,
        error: undefined
    };
}

// --- Legacy Compatibility ---

/**
 * Legacy function for backwards compatibility with dataManager.ts
 * Returns config, subjects, and lessons data from Google Sheets
 * 
 * This uses a different sheet structure than the import templates.
 * Expected sheets: config (schools, levels, sections, strategies, tools, tasks), subjects, lessons
 */
export async function loadAllData(): Promise<{
    config: {
        schools: string[];
        levels: string[];
        sections: string[];
        strategies: string[];
        tools: string[];
        tasks: string[];
    };
    subjects: string[];
    lessons: Record<string, any>;
}> {
    const config = loadSheetConfig();
    
    if (!config?.spreadsheetId) {
        // No config, return empty defaults
        return {
            config: {
                schools: [],
                levels: [],
                sections: [],
                strategies: [],
                tools: [],
                tasks: []
            },
            subjects: [],
            lessons: {}
        };
    }

    try {
        // Fetch config sheet (gid=0)
        const configResult = await fetchSheetAsCSV(config.spreadsheetId, '0');
        
        // Parse config data (assuming key-value format)
        const configData: Record<string, string[]> = {
            schools: [],
            levels: [],
            sections: [],
            strategies: [],
            tools: [],
            tasks: []
        };

        if (!configResult.error) {
            // Group by first column (key) and collect values
            configResult.rows.forEach(row => {
                const key = String(row['key'] || row['نوع'] || '').toLowerCase();
                const value = String(row['value'] || row['القيمة'] || '');
                if (key && value && configData[key]) {
                    configData[key].push(value);
                }
            });
        }

        // Fetch subjects sheet (gid=1)
        const subjectsResult = await fetchSheetAsCSV(config.spreadsheetId, '1');
        const subjects = !subjectsResult.error 
            ? subjectsResult.rows.map(r => String(r['subject'] || r['name'] || r['المادة'] || ''))
                .filter(Boolean)
            : [];

        // Fetch lessons sheet (gid=2)
        const lessonsResult = await fetchSheetAsCSV(config.spreadsheetId, '2');
        const lessons: Record<string, any> = {};

        if (!lessonsResult.error) {
            lessonsResult.rows.forEach(row => {
                const level = String(row['level'] || row['المستوى'] || '');
                const subject = String(row['subject'] || row['المادة'] || '');
                const title = String(row['title'] || row['lesson'] || row['الدرس'] || '');
                const gender = String(row['gender'] || row['الجنس'] || '');

                if (level && subject && title) {
                    if (!lessons[level]) lessons[level] = {};
                    if (!lessons[level][subject]) lessons[level][subject] = [];
                    lessons[level][subject].push({ title, gender: gender || undefined });
                }
            });
        }

        return { config: configData as { schools: string[]; levels: string[]; sections: string[]; strategies: string[]; tools: string[]; tasks: string[] }, subjects, lessons };
    } catch (error) {
        console.error('Failed to load data from Google Sheets:', error);
        return {
            config: {
                schools: [],
                levels: [],
                sections: [],
                strategies: [],
                tools: [],
                tasks: []
            },
            subjects: [],
            lessons: {}
        };
    }
}

// --- Write API (via Google Apps Script Web App) ---

/**
 * Write data to a Google Sheet via Apps Script Web App
 * 
 * To use this, deploy a Google Apps Script as Web App with this code:
 * 
 * function doPost(e) {
 *   const data = JSON.parse(e.postData.contents);
 *   const sheet = SpreadsheetApp.openById(data.spreadsheetId).getSheetByName(data.sheetName);
 *   if (data.action === 'append') {
 *     data.rows.forEach(row => sheet.appendRow(row));
 *   } else if (data.action === 'update') {
 *     sheet.getRange(data.range).setValues(data.values);
 *   }
 *   return ContentService.createTextOutput(JSON.stringify({success: true}));
 * }
 */
export async function writeToSheet(
    sheetName: string,
    rows: any[][],
    action: 'append' | 'update' = 'append',
    range?: string
): Promise<WriteResult> {
    const config = loadSheetConfig();
    
    if (!config?.apiConfig?.webAppUrl) {
        return { 
            success: false, 
            rowsWritten: 0, 
            error: 'لم يتم تكوين Web App URL. يرجى إضافة رابط Apps Script في الإعدادات.' 
        };
    }

    try {
        const response = await fetch(config.apiConfig.webAppUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                spreadsheetId: config.spreadsheetId,
                sheetName,
                action,
                rows: action === 'append' ? rows : undefined,
                values: action === 'update' ? rows : undefined,
                range: range
            })
        });

        if (!response.ok) {
            return { success: false, rowsWritten: 0, error: `HTTP Error: ${response.status}` };
        }

        const result = await response.json();
        return { 
            success: result.success, 
            rowsWritten: rows.length,
            error: result.error 
        };
    } catch (err) {
        return { 
            success: false, 
            rowsWritten: 0, 
            error: `فشل الاتصال: ${err instanceof Error ? err.message : 'خطأ غير معروف'}` 
        };
    }
}

/**
 * Append rows to a sheet by entity type
 */
export async function appendToEntitySheet(
    entityType: ImportType,
    rows: Record<string, any>[]
): Promise<WriteResult> {
    const config = loadSheetConfig();
    if (!config) return { success: false, rowsWritten: 0, error: 'لا يوجد اتصال' };

    const schema = IMPORT_SCHEMAS[entityType];
    const headers = schema.map(f => f.name);
    
    // Convert rows to arrays
    const rowArrays = rows.map(row => headers.map(h => row[h] ?? ''));
    
    return writeToSheet(SHEET_NAMES[entityType], rowArrays, 'append');
}

// --- Auto-Sync Manager ---

type SyncCallback = (result: SheetSyncResult) => void;

class AutoSyncManager {
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private state: AutoSyncState = {
        isRunning: false,
        intervalMinutes: 5,
        lastSync: null,
        nextSync: null,
        syncCount: 0
    };
    private callbacks: Set<SyncCallback> = new Set();

    /**
     * Start auto-sync with specified interval
     */
    start(intervalMinutes: number = 5): void {
        if (this.intervalId) this.stop();

        this.state.intervalMinutes = intervalMinutes;
        this.state.isRunning = true;
        this.state.nextSync = new Date(Date.now() + intervalMinutes * 60 * 1000);

        // Save to config
        const config = loadSheetConfig();
        if (config) {
            config.autoSync = {
                enabled: true,
                intervalMinutes,
                lastSync: this.state.lastSync?.toISOString()
            };
            saveSheetConfig(config);
        }

        this.intervalId = setInterval(() => {
            this.performSync();
        }, intervalMinutes * 60 * 1000);

        console.log(`[AutoSync] Started with ${intervalMinutes} minute interval`);
    }

    /**
     * Stop auto-sync
     */
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.state.isRunning = false;
        this.state.nextSync = null;

        // Update config
        const config = loadSheetConfig();
        if (config) {
            config.autoSync = {
                enabled: false,
                intervalMinutes: this.state.intervalMinutes,
                lastSync: this.state.lastSync?.toISOString()
            };
            saveSheetConfig(config);
        }

        console.log('[AutoSync] Stopped');
    }

    /**
     * Perform a sync now
     */
    async performSync(): Promise<SheetSyncResult | null> {
        const config = loadSheetConfig();
        if (!config?.spreadsheetId) {
            console.log('[AutoSync] No spreadsheet configured');
            return null;
        }

        console.log('[AutoSync] Syncing...');
        
        try {
            const enabledSheets = Object.entries(config.sheets)
                .filter(([_, v]) => v.enabled)
                .map(([k]) => k as ImportType);

            const gids: Partial<Record<ImportType, string>> = {};
            Object.entries(config.sheets).forEach(([k, v]) => {
                gids[k as ImportType] = v.gid;
            });

            const result = await syncFromGoogleSheets(config.spreadsheetId, gids, enabledSheets);

            this.state.lastSync = new Date();
            this.state.syncCount++;
            this.state.nextSync = new Date(Date.now() + this.state.intervalMinutes * 60 * 1000);

            // Notify callbacks
            this.callbacks.forEach(cb => cb(result));

            console.log(`[AutoSync] Completed: ${result.totalRows} rows, ${result.duration}ms`);
            return result;
        } catch (err) {
            console.error('[AutoSync] Failed:', err);
            return null;
        }
    }

    /**
     * Subscribe to sync events
     */
    onSync(callback: SyncCallback): () => void {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }

    /**
     * Get current state
     */
    getState(): AutoSyncState {
        return { ...this.state };
    }

    /**
     * Restore from saved config
     */
    restoreFromConfig(): void {
        const config = loadSheetConfig();
        if (config?.autoSync?.enabled) {
            this.state.lastSync = config.autoSync.lastSync 
                ? new Date(config.autoSync.lastSync) 
                : null;
            this.start(config.autoSync.intervalMinutes);
        }
    }
}

// Singleton instance
export const autoSyncManager = new AutoSyncManager();

// Initialize auto-sync from saved config on module load
if (typeof window !== 'undefined') {
    // Only in browser environment
    setTimeout(() => autoSyncManager.restoreFromConfig(), 1000);
}
