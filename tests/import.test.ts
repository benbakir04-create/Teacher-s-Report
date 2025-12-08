/**
 * Import Service Tests
 * 
 * Unit tests for Excel import validation and parsing.
 * Phase 11: Bulk Import System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
    validateRows, 
    mapRowToEnglish,
    upsertSchool,
    upsertClass,
    upsertTeacher,
    upsertStudent,
    upsertSubject,
    getSchools,
    getClasses,
    getTeachers
} from '../services/importService';
import { ImportType, SchoolImport, ClassImport, TeacherImport, StudentImport } from '../types/import.types';

describe('Import Service', () => {
    describe('validateRows', () => {
        it('should validate valid school rows', () => {
            const rows = [
                {
                    school_code: 'SCH001',
                    name_ar: 'مدرسة النور',
                    level: 'primary',
                    region: 'الرياض'
                }
            ];

            const result = validateRows(rows, 'schools');
            
            expect(result.isValid).toBe(true);
            expect(result.validRows).toBe(1);
            expect(result.errors).toHaveLength(0);
        });

        it('should detect missing required fields', () => {
            const rows = [
                {
                    school_code: 'SCH001',
                    // missing name_ar
                    level: 'primary',
                    region: 'الرياض'
                }
            ];

            const result = validateRows(rows, 'schools');
            
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0].field).toBe('name_ar');
        });

        it('should detect invalid enum values', () => {
            const rows = [
                {
                    school_code: 'SCH001',
                    name_ar: 'مدرسة النور',
                    level: 'invalid_level', // Invalid enum
                    region: 'الرياض'
                }
            ];

            const result = validateRows(rows, 'schools');
            
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.field === 'level')).toBe(true);
        });

        it('should detect duplicate codes', () => {
            const rows = [
                {
                    school_code: 'SCH001',
                    name_ar: 'مدرسة النور',
                    level: 'primary',
                    region: 'الرياض'
                },
                {
                    school_code: 'SCH001', // Duplicate
                    name_ar: 'مدرسة الأمل',
                    level: 'secondary',
                    region: 'جدة'
                }
            ];

            const result = validateRows(rows, 'schools');
            
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.message.includes('مكررة'))).toBe(true);
        });

        it('should validate email format', () => {
            const rows = [
                {
                    school_code: 'SCH001',
                    name_ar: 'مدرسة النور',
                    level: 'primary',
                    region: 'الرياض',
                    email: 'invalid-email' // Invalid email
                }
            ];

            const result = validateRows(rows, 'schools');
            
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.field === 'email')).toBe(true);
        });

        it('should validate foreign key references', () => {
            const existingCodes = new Map<string, Set<string>>();
            existingCodes.set('schools', new Set(['SCH001']));

            const rows = [
                {
                    class_code: 'CLS001',
                    school_code: 'SCH999', // Non-existent FK
                    grade: '1',
                    division: 'أ'
                }
            ];

            const result = validateRows(rows, 'classes', existingCodes);
            
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.message.includes('مرجع غير موجود'))).toBe(true);
        });

        it('should pass with valid foreign key', () => {
            const existingCodes = new Map<string, Set<string>>();
            existingCodes.set('schools', new Set(['SCH001']));

            const rows = [
                {
                    class_code: 'CLS001',
                    school_code: 'SCH001', // Valid FK
                    grade: '1',
                    division: 'أ'
                }
            ];

            const result = validateRows(rows, 'classes', existingCodes);
            
            expect(result.isValid).toBe(true);
        });
    });

    describe('mapRowToEnglish', () => {
        it('should map Arabic headers to English', () => {
            const row = {
                'رمز المدرسة': 'SCH001',
                'اسم المدرسة': 'مدرسة النور',
                'المرحلة': 'primary',
                'المنطقة': 'الرياض'
            };

            const mapped = mapRowToEnglish(row);
            
            expect(mapped.school_code).toBe('SCH001');
            expect(mapped.name_ar).toBe('مدرسة النور');
            expect(mapped.level).toBe('primary');
            expect(mapped.region).toBe('الرياض');
        });
    });

    describe('upsert operations', () => {
        it('should create new school', async () => {
            const school: SchoolImport = {
                school_code: 'TEST_SCH001',
                name_ar: 'مدرسة اختبار',
                level: 'primary',
                region: 'الرياض'
            };

            const result = await upsertSchool(school);
            
            expect(result).toBe('created');
        });

        it('should update existing school', async () => {
            const school: SchoolImport = {
                school_code: 'TEST_SCH001',
                name_ar: 'مدرسة اختبار محدثة',
                level: 'secondary',
                region: 'جدة'
            };

            const result = await upsertSchool(school);
            
            expect(result).toBe('updated');
        });

        it('should create class with FK', async () => {
            const cls: ClassImport = {
                class_code: 'TEST_CLS001',
                school_code: 'TEST_SCH001',
                grade: '1',
                division: 'أ'
            };

            const result = await upsertClass(cls);
            
            expect(result).toBe('created');
        });

        it('should create teacher', async () => {
            const teacher: TeacherImport = {
                teacher_code: 'TEST_TCH001',
                teacher_name: 'أحمد محمد',
                school_code: 'TEST_SCH001'
            };

            const result = await upsertTeacher(teacher);
            
            expect(result).toBe('created');
        });

        it('should create student with guardian', async () => {
            const student: StudentImport = {
                student_code: 'TEST_STD001',
                student_name: 'محمد أحمد',
                class_code: 'TEST_CLS001',
                guardian_code: 'TEST_GRD001',
                guardian_name: 'أحمد محمد',
                relationship: 'father',
                guardian_phone: '+966500000000'
            };

            const result = await upsertStudent(student);
            
            expect(result).toBe('created');
        });
    });

    describe('student-guardian relationships', () => {
        it('should link guardian to multiple students', async () => {
            // First student
            await upsertStudent({
                student_code: 'MULTI_STD001',
                student_name: 'سارة أحمد',
                class_code: 'TEST_CLS001',
                guardian_code: 'SHARED_GRD001',
                guardian_name: 'أحمد سعيد',
                relationship: 'father',
                guardian_phone: '+966511111111'
            });

            // Second student with same guardian
            await upsertStudent({
                student_code: 'MULTI_STD002',
                student_name: 'عمر أحمد',
                class_code: 'TEST_CLS001',
                guardian_code: 'SHARED_GRD001',
                guardian_name: 'أحمد سعيد',
                relationship: 'father',
                guardian_phone: '+966511111111'
            });

            // Both students should exist
            const students = getStudents();
            const student1 = students.find(s => s.student_code === 'MULTI_STD001');
            const student2 = students.find(s => s.student_code === 'MULTI_STD002');
            
            expect(student1).toBeDefined();
            expect(student2).toBeDefined();
        });
    });
});
