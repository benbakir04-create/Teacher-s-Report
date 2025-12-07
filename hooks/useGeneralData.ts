import { useState, useEffect } from 'react';
import { dbService, GeneralData } from '../services/db.service';
import { LEVELS, SECTION_NUMBERS, SCHOOLS, getSubjectsForLevel } from '../data/levels';
import toast from 'react-hot-toast';

// Initial empty state
const initialData: GeneralData = {
    registrationId: '',
    name: '',
    email: '',
    phone: '',
    school: '',
    level: '',
    sectionNumber: '',
    updatedAt: 0
};

export function useGeneralData() {
    const [data, setData] = useState<GeneralData>(initialData);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const savedData = await dbService.getGeneralData();
            if (savedData) {
                setData(savedData);
            }
        } catch (error) {
            console.error('Error loading general data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Update a single field
    const updateField = (field: keyof GeneralData, value: string) => {
        setData(prev => ({ ...prev, [field]: value }));
        // Clear error when field is updated
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // Validation
    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!data.registrationId.trim()) {
            newErrors.registrationId = 'رقم التسجيل مطلوب';
        }
        if (!data.name.trim()) {
            newErrors.name = 'الاسم الكامل مطلوب';
        }
        if (!data.email.trim()) {
            newErrors.email = 'البريد الإلكتروني مطلوب';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            newErrors.email = 'البريد الإلكتروني غير صحيح';
        }
        if (!data.school) {
            newErrors.school = 'المدرسة مطلوبة';
        }
        if (!data.level) {
            newErrors.level = 'المستوى مطلوب';
        }
        if (!data.sectionNumber) {
            newErrors.sectionNumber = 'القسم مطلوب';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Save data
    const saveData = async (): Promise<boolean> => {
        if (!validate()) {
            toast.error('يرجى تعبئة جميع الحقول المطلوبة');
            return false;
        }

        try {
            setIsSaving(true);
            await dbService.saveGeneralData(data);
            toast.success('تم حفظ البيانات بنجاح');
            return true;
        } catch (error) {
            console.error('Error saving general data:', error);
            toast.error('حدث خطأ أثناء الحفظ');
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    // Get subjects for current level
    const subjects = data.level ? getSubjectsForLevel(data.level) : [];

    // Get full class name
    const fullClassName = data.level && data.sectionNumber 
        ? `${data.level} ${data.sectionNumber}` 
        : '';

    return {
        data,
        isLoading,
        isSaving,
        errors,
        updateField,
        saveData,
        subjects,
        fullClassName,
        // Config lists
        levels: LEVELS,
        sections: SECTION_NUMBERS,
        schools: SCHOOLS
    };
}
