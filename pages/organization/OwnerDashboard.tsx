import React, { useState } from 'react';
import { 
    Building2, Users, FileText, Settings, CreditCard, PlusCircle, 
    ChevronLeft, TrendingUp, AlertCircle, Loader2, Mail 
} from 'lucide-react';
import { useTenant, useOrganization, useInvites } from '../../hooks/useTenant';
import { Tenant, SaaSRole } from '../../types/saas.types';
import toast from 'react-hot-toast';

export const OwnerDashboard: React.FC = () => {
    const { organization, subscription, isLoading: contextLoading } = useTenant();
    const { tenants, isLoading: tenantsLoading, createTenant } = useOrganization();
    const [activeTab, setActiveTab] = useState<'overview' | 'schools' | 'users' | 'billing' | 'settings'>('overview');
    const [showAddSchool, setShowAddSchool] = useState(false);

    if (contextLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!organization) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
                    <h2 className="text-xl font-bold text-gray-800">لا توجد مؤسسة</h2>
                    <p className="text-gray-500">يرجى تسجيل مؤسستك أولاً</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'نظرة عامة', icon: TrendingUp },
        { id: 'schools', label: 'المدارس', icon: Building2, count: tenants.length },
        { id: 'users', label: 'المستخدمين', icon: Users },
        { id: 'billing', label: 'الفوترة', icon: CreditCard },
        { id: 'settings', label: 'الإعدادات', icon: Settings }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-bl from-indigo-600 to-purple-700 px-6 py-6 text-white">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-4 mb-4">
                        {organization.logoUrl ? (
                            <img src={organization.logoUrl} alt="" className="w-12 h-12 rounded-xl bg-white/20" />
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                <Building2 size={24} />
                            </div>
                        )}
                        <div>
                            <h1 className="text-xl font-bold">{organization.nameAr}</h1>
                            <p className="text-white/70 text-sm">{organization.name}</p>
                        </div>
                        <div className="mr-auto">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                subscription?.status === 'active' 
                                    ? 'bg-green-400/20 text-green-100'
                                    : subscription?.status === 'trial'
                                    ? 'bg-amber-400/20 text-amber-100'
                                    : 'bg-red-400/20 text-red-100'
                            }`}>
                                {subscription?.plan === 'enterprise' ? 'مؤسسي' :
                                 subscription?.plan === 'pro' ? 'احترافي' :
                                 subscription?.plan === 'basic' ? 'أساسي' : 'تجربة'}
                            </span>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                                    activeTab === tab.id
                                        ? 'bg-white text-indigo-700'
                                        : 'bg-white/10 hover:bg-white/20'
                                }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                                {tab.count !== undefined && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                                        activeTab === tab.id ? 'bg-indigo-100' : 'bg-white/20'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto p-6">
                {activeTab === 'overview' && (
                    <OverviewTab tenants={tenants} subscription={subscription} />
                )}
                {activeTab === 'schools' && (
                    <SchoolsTab 
                        tenants={tenants} 
                        isLoading={tenantsLoading}
                        onAddSchool={() => setShowAddSchool(true)}
                    />
                )}
                {activeTab === 'users' && <UsersTab />}
                {activeTab === 'billing' && <BillingTab subscription={subscription} />}
                {activeTab === 'settings' && <SettingsTab organization={organization} />}
            </div>

            {/* Add School Modal */}
            {showAddSchool && (
                <AddSchoolModal 
                    onClose={() => setShowAddSchool(false)}
                    onCreate={async (data) => {
                        await createTenant(data);
                        setShowAddSchool(false);
                        toast.success('تمت إضافة المدرسة بنجاح');
                    }}
                />
            )}
        </div>
    );
};

// --- Overview Tab ---
const OverviewTab: React.FC<{ tenants: Tenant[]; subscription: any }> = ({ tenants, subscription }) => {
    const activeSchools = tenants.filter(t => t.status === 'active').length;
    
    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="المدارس" value={tenants.length} icon={Building2} color="blue" />
                <StatCard label="النشطة" value={activeSchools} icon={TrendingUp} color="green" />
                <StatCard label="المعلمين" value={tenants.length * 25} icon={Users} color="purple" />
                <StatCard label="التقارير اليوم" value={Math.floor(Math.random() * 100) + 50} icon={FileText} color="amber" />
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-4">النشاط الأخير</h3>
                <div className="space-y-3">
                    {[
                        { action: 'تم إضافة مدرسة جديدة', time: 'منذ ساعة', type: 'add' },
                        { action: 'تم دعوة 5 معلمين', time: 'منذ 3 ساعات', type: 'invite' },
                        { action: 'تم تحديث إعدادات الفوترة', time: 'أمس', type: 'settings' }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                {item.type === 'add' && <Building2 size={14} className="text-indigo-600" />}
                                {item.type === 'invite' && <Users size={14} className="text-indigo-600" />}
                                {item.type === 'settings' && <Settings size={14} className="text-indigo-600" />}
                            </div>
                            <div className="flex-1">
                                <span className="text-sm text-gray-800">{item.action}</span>
                            </div>
                            <span className="text-xs text-gray-400">{item.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Schools Tab ---
const SchoolsTab: React.FC<{ tenants: Tenant[]; isLoading: boolean; onAddSchool: () => void }> = ({ 
    tenants, isLoading, onAddSchool 
}) => (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800">المدارس ({tenants.length})</h3>
            <button
                onClick={onAddSchool}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition"
            >
                <PlusCircle size={18} />
                إضافة مدرسة
            </button>
        </div>

        {isLoading ? (
            <div className="flex justify-center py-12">
                <Loader2 size={32} className="animate-spin text-gray-400" />
            </div>
        ) : tenants.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">لا توجد مدارس مسجلة</p>
                <button
                    onClick={onAddSchool}
                    className="mt-4 text-indigo-600 font-medium hover:underline"
                >
                    إضافة أول مدرسة
                </button>
            </div>
        ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500">المدرسة</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500">المدينة</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500">الحالة</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tenants.map(tenant => (
                            <tr key={tenant.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                                            <Building2 size={18} className="text-indigo-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-800">{tenant.nameAr}</div>
                                            <div className="text-xs text-gray-500">{tenant.slug}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{tenant.city}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        tenant.status === 'active' ? 'bg-green-100 text-green-700' :
                                        tenant.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {tenant.status === 'active' ? 'نشط' : 
                                         tenant.status === 'pending' ? 'قيد الإعداد' : 'معلق'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button className="text-indigo-600 hover:underline text-sm">
                                        إدارة
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);

// --- Users Tab ---
const UsersTab: React.FC = () => {
    const { tenant } = useTenant();
    const { invites, createInvite, isLoading } = useInvites(tenant?.id || null);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<SaaSRole>('teacher');

    const handleInvite = async () => {
        if (!email) return;
        await createInvite(email, role);
        setEmail('');
        toast.success('تم إرسال الدعوة');
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-4">دعوة مستخدم جديد</h3>
                <div className="flex gap-3">
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="البريد الإلكتروني"
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 outline-none"
                    />
                    <select
                        value={role}
                        onChange={e => setRole(e.target.value as SaaSRole)}
                        className="px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 outline-none"
                    >
                        <option value="teacher">معلم</option>
                        <option value="supervisor">مشرف</option>
                        <option value="school_admin">مدير</option>
                    </select>
                    <button
                        onClick={handleInvite}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition flex items-center gap-2"
                    >
                        <Mail size={18} />
                        دعوة
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-4">الدعوات المرسلة ({invites.length})</h3>
                {invites.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">لا توجد دعوات</p>
                ) : (
                    <div className="space-y-2">
                        {invites.map(inv => (
                            <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <span>{inv.email}</span>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                    inv.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                    inv.status === 'expired' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-100 text-amber-700'
                                }`}>
                                    {inv.status === 'accepted' ? 'مقبول' : 
                                     inv.status === 'expired' ? 'منتهي' : 'قيد الانتظار'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Billing Tab ---
const BillingTab: React.FC<{ subscription: any }> = ({ subscription }) => (
    <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4">الاشتراك الحالي</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <span className="text-gray-500 text-sm">الخطة</span>
                    <p className="font-bold text-gray-800">{subscription?.plan || '-'}</p>
                </div>
                <div>
                    <span className="text-gray-500 text-sm">السعر</span>
                    <p className="font-bold text-gray-800">{subscription?.pricePerMonth || 0} ر.س/شهر</p>
                </div>
                <div>
                    <span className="text-gray-500 text-sm">الحالة</span>
                    <p className="font-bold text-green-600">{subscription?.status || '-'}</p>
                </div>
                <div>
                    <span className="text-gray-500 text-sm">التجديد</span>
                    <p className="font-bold text-gray-800">
                        {subscription?.currentPeriodEnd 
                            ? new Date(subscription.currentPeriodEnd).toLocaleDateString('ar-SA')
                            : '-'}
                    </p>
                </div>
            </div>
        </div>
    </div>
);

// --- Settings Tab ---
const SettingsTab: React.FC<{ organization: any }> = ({ organization }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-800 mb-4">إعدادات المؤسسة</h3>
        <p className="text-gray-500">قريباً...</p>
    </div>
);

// --- Stat Card ---
const StatCard: React.FC<{ label: string; value: number; icon: any; color: string }> = ({ 
    label, value, icon: Icon, color 
}) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center mb-3`}>
            <Icon size={20} className={`text-${color}-600`} />
        </div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
    </div>
);

// --- Add School Modal ---
const AddSchoolModal: React.FC<{ onClose: () => void; onCreate: (data: Partial<Tenant>) => Promise<void> }> = ({ 
    onClose, onCreate 
}) => {
    const [name, setName] = useState('');
    const [nameAr, setNameAr] = useState('');
    const [city, setCity] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        setIsLoading(true);
        await onCreate({ name, nameAr, city, schoolType: 'primary' });
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">إضافة مدرسة جديدة</h3>
                <div className="space-y-4">
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="اسم المدرسة (إنجليزي)"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                    />
                    <input
                        type="text"
                        value={nameAr}
                        onChange={e => setNameAr(e.target.value)}
                        placeholder="اسم المدرسة (عربي)"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                        dir="rtl"
                    />
                    <input
                        type="text"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="المدينة"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                    />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600">إلغاء</button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !name || !nameAr}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-xl disabled:opacity-50"
                    >
                        {isLoading ? 'جاري الإضافة...' : 'إضافة'}
                    </button>
                </div>
            </div>
        </div>
    );
};
