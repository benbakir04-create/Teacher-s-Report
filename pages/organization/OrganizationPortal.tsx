import React, { useState } from 'react';
import { Building2, Mail, Phone, MapPin, Users, ArrowRight, Check, Loader2 } from 'lucide-react';
import { organizationService } from '../../services/organizationService';
import { OrganizationType, SubscriptionPlan } from '../../types/saas.types';
import toast from 'react-hot-toast';

interface RegistrationData {
    // Organization
    orgName: string;
    orgNameAr: string;
    orgType: OrganizationType;
    contactEmail: string;
    contactPhone: string;
    country: string;
    
    // Admin
    adminName: string;
    adminEmail: string;
    
    // Plan
    plan: SubscriptionPlan;
    teacherCount: string;
}

interface OrganizationPortalProps {
    onComplete?: () => void;
}

const STEPS = [
    { id: 1, title: 'معلومات المؤسسة' },
    { id: 2, title: 'بيانات المدير' },
    { id: 3, title: 'اختيار الخطة' },
    { id: 4, title: 'المراجعة والتأكيد' }
];

const PLANS: { id: SubscriptionPlan; name: string; price: string; features: string[] }[] = [
    {
        id: 'trial',
        name: 'تجربة مجانية',
        price: 'مجاني لمدة 14 يوم',
        features: ['مدرسة واحدة', '10 معلمين', 'تقارير أساسية']
    },
    {
        id: 'basic',
        name: 'أساسي',
        price: '100 ر.س/شهر',
        features: ['مدرسة واحدة', '30 معلم', 'تقارير + إحصاءات']
    },
    {
        id: 'pro',
        name: 'احترافي',
        price: '200 ر.س/شهر',
        features: ['حتى 10 مدارس', '100 معلم', 'جميع الميزات + AI']
    },
    {
        id: 'enterprise',
        name: 'مؤسسي',
        price: 'تواصل معنا',
        features: ['مدارس غير محدودة', 'معلمين غير محدود', 'دعم VIP + تخصيص']
    }
];

export const OrganizationPortal: React.FC<OrganizationPortalProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [data, setData] = useState<RegistrationData>({
        orgName: '',
        orgNameAr: '',
        orgType: 'independent',
        contactEmail: '',
        contactPhone: '',
        country: 'SA',
        adminName: '',
        adminEmail: '',
        plan: 'trial',
        teacherCount: ''
    });

    const updateData = (updates: Partial<RegistrationData>) => {
        setData(prev => ({ ...prev, ...updates }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        
        try {
            // Create organization
            const org = await organizationService.createOrganization({
                name: data.orgName,
                nameAr: data.orgNameAr,
                type: data.orgType,
                contactEmail: data.contactEmail,
                contactPhone: data.contactPhone,
                country: data.country,
                billingEmail: data.contactEmail
            });

            // Create subscription
            await organizationService.createSubscription(org.id, data.plan);

            // Create first tenant (school)
            const tenant = await organizationService.createTenant({
                organizationId: org.id,
                name: data.orgName,
                nameAr: data.orgNameAr,
                city: 'الرياض', // Default
                schoolType: 'combined'
            });

            // Create admin invite
            await organizationService.createInvite({
                tenantId: tenant.id,
                email: data.adminEmail,
                role: 'school_owner'
            });

            // Set as current org
            organizationService.setCurrentOrganization(org.id);
            organizationService.setCurrentTenant(tenant.id);

            toast.success('تم إنشاء المؤسسة بنجاح! تم إرسال دعوة للمدير.');
            onComplete?.();
        } catch (error) {
            console.error('Registration error:', error);
            toast.error('حدث خطأ أثناء التسجيل');
        } finally {
            setIsSubmitting(false);
        }
    };

    const canProceed = () => {
        switch (step) {
            case 1:
                return data.orgName && data.orgNameAr && data.contactEmail;
            case 2:
                return data.adminName && data.adminEmail;
            case 3:
                return data.plan;
            default:
                return true;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
                        <Building2 className="text-white" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">تسجيل مؤسسة جديدة</h1>
                    <p className="text-gray-500 mt-1">انضم إلى منصة التقارير التعليمية الذكية</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {STEPS.map((s, i) => (
                        <React.Fragment key={s.id}>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                                step === s.id 
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : step > s.id
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-400'
                            }`}>
                                {step > s.id ? <Check size={14} /> : <span>{s.id}</span>}
                                <span className="hidden sm:inline">{s.title}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`w-8 h-0.5 ${step > s.id ? 'bg-green-300' : 'bg-gray-200'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                    {/* Step 1: Organization Info */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">معلومات المؤسسة</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        اسم المؤسسة (إنجليزي)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.orgName}
                                        onChange={e => updateData({ orgName: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                                        placeholder="School Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        اسم المؤسسة (عربي)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.orgNameAr}
                                        onChange={e => updateData({ orgNameAr: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                                        placeholder="اسم المدرسة"
                                        dir="rtl"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">نوع المؤسسة</label>
                                <select
                                    value={data.orgType}
                                    onChange={e => updateData({ orgType: e.target.value as OrganizationType })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                                >
                                    <option value="independent">مدرسة مستقلة</option>
                                    <option value="school_network">مجموعة مدارس</option>
                                    <option value="branch">فرع تعليمي</option>
                                    <option value="central">إدارة تعليمية مركزية</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Mail size={14} className="inline ml-1" />
                                        البريد الإلكتروني
                                    </label>
                                    <input
                                        type="email"
                                        value={data.contactEmail}
                                        onChange={e => updateData({ contactEmail: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                                        placeholder="info@school.edu.sa"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Phone size={14} className="inline ml-1" />
                                        رقم الهاتف
                                    </label>
                                    <input
                                        type="tel"
                                        value={data.contactPhone}
                                        onChange={e => updateData({ contactPhone: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                                        placeholder="+966 5XXXXXXXX"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Admin Info */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">بيانات المدير</h2>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Users size={14} className="inline ml-1" />
                                    اسم المدير
                                </label>
                                <input
                                    type="text"
                                    value={data.adminName}
                                    onChange={e => updateData({ adminName: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                                    placeholder="الاسم الكامل"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Mail size={14} className="inline ml-1" />
                                    البريد الإلكتروني للمدير
                                </label>
                                <input
                                    type="email"
                                    value={data.adminEmail}
                                    onChange={e => updateData({ adminEmail: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                                    placeholder="admin@school.edu.sa"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    سيتم إرسال رابط الدخول إلى هذا البريد
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    عدد المعلمين التقديري
                                </label>
                                <input
                                    type="number"
                                    value={data.teacherCount}
                                    onChange={e => updateData({ teacherCount: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                                    placeholder="30"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Plan Selection */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">اختر الخطة المناسبة</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {PLANS.map(plan => (
                                    <button
                                        key={plan.id}
                                        onClick={() => updateData({ plan: plan.id })}
                                        className={`p-4 rounded-2xl border-2 text-right transition-all ${
                                            data.plan === plan.id
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                data.plan === plan.id 
                                                    ? 'border-indigo-500 bg-indigo-500' 
                                                    : 'border-gray-300'
                                            }`}>
                                                {data.plan === plan.id && <Check size={12} className="text-white" />}
                                            </span>
                                            {plan.id === 'pro' && (
                                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                                                    الأكثر شيوعاً
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-gray-800">{plan.name}</h3>
                                        <p className="text-sm text-indigo-600 font-medium mb-2">{plan.price}</p>
                                        <ul className="text-xs text-gray-500 space-y-1">
                                            {plan.features.map((f, i) => (
                                                <li key={i}>✓ {f}</li>
                                            ))}
                                        </ul>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">مراجعة البيانات</h2>
                            
                            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">المؤسسة</span>
                                    <span className="font-medium">{data.orgNameAr}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">البريد</span>
                                    <span className="font-medium">{data.contactEmail}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">المدير</span>
                                    <span className="font-medium">{data.adminName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">الخطة</span>
                                    <span className="font-medium text-indigo-600">
                                        {PLANS.find(p => p.id === data.plan)?.name}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                                <strong>ملاحظة:</strong> بالضغط على "تأكيد التسجيل" ستوافق على شروط الخدمة وسياسة الخصوصية.
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                        {step > 1 ? (
                            <button
                                onClick={() => setStep(s => s - 1)}
                                className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition"
                            >
                                السابق
                            </button>
                        ) : (
                            <div />
                        )}

                        {step < 4 ? (
                            <button
                                onClick={() => setStep(s => s + 1)}
                                disabled={!canProceed()}
                                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                            >
                                التالي
                                <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        جاري التسجيل...
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        تأكيد التسجيل
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
