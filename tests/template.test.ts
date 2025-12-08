/**
 * Template Service Tests
 * 
 * Unit tests for template generation and validation.
 */

import { describe, it, expect } from 'vitest';
import {
    TEMPLATE_VERSION,
    TEMPLATE_ENTITIES,
    getPrefillData
} from '../services/templateService';
import { IMPORT_SCHEMAS } from '../types/import.types';

describe('Template Service', () => {
    describe('TEMPLATE_VERSION', () => {
        it('should be defined and follow semver format', () => {
            expect(TEMPLATE_VERSION).toBeDefined();
            expect(TEMPLATE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
        });
    });

    describe('TEMPLATE_ENTITIES', () => {
        it('should define all 5 entity types', () => {
            expect(TEMPLATE_ENTITIES).toHaveLength(5);
            
            const types = TEMPLATE_ENTITIES.map(e => e.type);
            expect(types).toContain('schools');
            expect(types).toContain('classes');
            expect(types).toContain('teachers');
            expect(types).toContain('students');
            expect(types).toContain('subjects');
        });

        it('should have label and description for each entity', () => {
            TEMPLATE_ENTITIES.forEach(entity => {
                expect(entity.label).toBeDefined();
                expect(entity.label.length).toBeGreaterThan(0);
                expect(entity.description).toBeDefined();
                expect(entity.description.length).toBeGreaterThan(0);
            });
        });
    });

    describe('getPrefillData', () => {
        it('should return object with code arrays', () => {
            const prefill = getPrefillData();
            
            expect(prefill).toBeDefined();
            expect(Array.isArray(prefill.school_codes)).toBe(true);
            expect(Array.isArray(prefill.class_codes)).toBe(true);
            expect(Array.isArray(prefill.teacher_codes)).toBe(true);
        });
    });

    describe('Template Schema Alignment', () => {
        it('should have matching headers for schools template', () => {
            const schema = IMPORT_SCHEMAS['schools'];
            const schemaFields = schema.map(f => f.name);
            
            expect(schemaFields).toContain('school_code');
            expect(schemaFields).toContain('name_ar');
            expect(schemaFields).toContain('level');
            expect(schemaFields).toContain('region');
        });

        it('should have matching headers for students template', () => {
            const schema = IMPORT_SCHEMAS['students'];
            const schemaFields = schema.map(f => f.name);
            
            expect(schemaFields).toContain('student_code');
            expect(schemaFields).toContain('student_name');
            expect(schemaFields).toContain('class_code');
            expect(schemaFields).toContain('guardian_code');
            expect(schemaFields).toContain('guardian_name');
            expect(schemaFields).toContain('relationship');
            expect(schemaFields).toContain('guardian_phone');
        });

        it('should have required FK fields in classes schema', () => {
            const schema = IMPORT_SCHEMAS['classes'];
            const schoolCodeField = schema.find(f => f.name === 'school_code');
            
            expect(schoolCodeField).toBeDefined();
            expect(schoolCodeField?.required).toBe(true);
            expect(schoolCodeField?.foreignKey?.table).toBe('schools');
        });

        it('should have required FK fields in students schema', () => {
            const schema = IMPORT_SCHEMAS['students'];
            const classCodeField = schema.find(f => f.name === 'class_code');
            
            expect(classCodeField).toBeDefined();
            expect(classCodeField?.required).toBe(true);
            expect(classCodeField?.foreignKey?.table).toBe('classes');
        });
    });

    describe('Enum Validations', () => {
        it('should define valid level enum for schools', () => {
            const schema = IMPORT_SCHEMAS['schools'];
            const levelField = schema.find(f => f.name === 'level');
            
            expect(levelField?.enumValues).toBeDefined();
            expect(levelField?.enumValues).toContain('primary');
            expect(levelField?.enumValues).toContain('intermediate');
            expect(levelField?.enumValues).toContain('secondary');
            expect(levelField?.enumValues).toContain('combined');
        });

        it('should define valid relationship enum for students', () => {
            const schema = IMPORT_SCHEMAS['students'];
            const relField = schema.find(f => f.name === 'relationship');
            
            expect(relField?.enumValues).toBeDefined();
            expect(relField?.enumValues).toContain('father');
            expect(relField?.enumValues).toContain('mother');
            expect(relField?.enumValues).toContain('guardian');
            expect(relField?.enumValues).toContain('other');
        });
    });
});
