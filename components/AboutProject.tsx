
import React from 'react';
import { BookOpen, Users, Target, Award, Clock, Shield, ChevronRight, Star, CheckCircle } from 'lucide-react';

export const AboutProject: React.FC = () => {
    const features = [
        { icon: BookOpen, title: 'إدارة التقارير', description: 'نظام متكامل لإدارة وتتبع تقارير الحصص اليومية' },
        { icon: Users, title: 'واجهة سهلة', description: 'تصميم بديهي وسهل الاستخدام للمدرسين' },
        { icon: Target, title: 'أهداف محددة', description: 'تتبع أهداف التعلم وإنجازات الطلاب' },
        { icon: Award, title: 'تقارير مفصلة', description: 'إنشاء تقارير شاملة ودقيقة عن الأداء' },
        { icon: Clock, title: 'توفير الوقت', description: 'أتمتة العمليات لتوفير وقت وجهد المدرسين' },
        { icon: Shield, title: 'آمن وموثوق', description: 'حماية البيانات وضمان الخصوصية التامة' }
    ];

    const testimonials = [
        { name: 'أحمد محمد', role: 'معلم قرآن', content: 'تطبيق رائع سهل الاستخدام، ساعدني كثيراً في تنظيم تقاريري اليومية.' },
        { name: 'فاطمة أحمد', role: 'معلمة لغة عربية', content: 'وفر علي الكثير من الوقت وأصبحت أركز أكثر على جودة التدريس.' },
        { name: 'عبدالله سعيد', role: 'معلم تربية إسلامية', content: 'أفضل تطبيق لإدارة تقارير الحصص، أنصح به كل المعلمين.' }
    ];

    return (
        <div className="p-6 pb-24 max-w-md mx-auto">
            <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-6 text-white mb-6 shadow-lg">
                <h1 className="text-2xl font-bold mb-2">تقارير الحصص</h1>
                <p className="text-sm opacity-90">نظام متابعة الأداء اليومي للمعلمين</p>
                <div className="flex items-center gap-2 mt-4">
                    <Star size={16} fill="white" />
                    <Star size={16} fill="white" />
                    <Star size={16} fill="white" />
                    <Star size={16} fill="white" />
                    <Star size={16} fill="white" />
                    <span className="text-sm ml-2">5.0 (120+ تقييم)</span>
                </div>
            </div>

            <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <BookOpen size={20} className="text-primary" />
                    عن المشروع
                </h2>
                <p className="text-gray-600 leading-relaxed text-sm mb-4">
                    تطبيق "تقارير الحصص" هو نظام متكامل مصمم خصيصًا للمعلمين لمساعدتهم في إدارة وتتبع تقارير الحصص اليومية بكفاءة عالية. يوفر التطبيق واجهة سهلة الاستخدام تتيح للمعلمين تسجيل بيانات الحصص، استراتيجيات التدريس المستخدمة، الأدوات التعليمية، والمهام المنجزة، بالإضافة إلى إمكانية إضافة ملاحظات إضافية.
                </p>
                <p className="text-gray-600 leading-relaxed text-sm">
                    يساعد التطبيق المعلمين على توفير الوقت والجهد في إعداد التقارير، كما يوفر إحصائيات ورسوم بيانية لتتبع الأداء والتحسين المستمر لعملية التعليم.
                </p>
            </div>

            <div className="mb-6">
                <h2 className="text-lg font-bold mb-4">المميزات الرئيسية</h2>
                <div className="grid grid-cols-1 gap-3">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div key={index} className="bg-white rounded-lg p-4 shadow-md flex items-start gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg">
                                    <Icon size={18} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                                    <p className="text-gray-600 text-xs">{feature.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
                <h2 className="text-lg font-bold mb-4">آراء المستخدمين</h2>
                <div className="space-y-4">
                    {testimonials.map((testimonial, index) => (
                        <div key={index} className="border-b border-gray-100 pb-4 last:border-0">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-primary font-bold">
                                    {testimonial.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{testimonial.name}</p>
                                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm italic">"{testimonial.content}"</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 border border-primary/20">
                <h2 className="text-lg font-bold mb-3">لماذا تختار تطبيقنا؟</h2>
                <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-primary mt-0.5" />
                        <span className="text-sm">تصميم عصري وسهل الاستخدام</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-primary mt-0.5" />
                        <span className="text-sm">حفظ آمن للبيانات محلياً</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-primary mt-0.5" />
                        <span className="text-sm">دعم كامل للغة العربية</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-primary mt-0.5" />
                        <span className="text-sm">تحديثات مستمرة وتطوير مستمر</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};
