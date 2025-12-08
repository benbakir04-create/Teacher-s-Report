/**
 * SaaS Types
 * 
 * Multi-tenant architecture types for enterprise deployment.
 * Phase 10: SaaS Business Layer
 */

// --- Organization Types ---

export type OrganizationType = 'central' | 'branch' | 'school_network' | 'independent';
export type TenantStatus = 'pending' | 'active' | 'suspended' | 'archived';
export type SubscriptionPlan = 'trial' | 'basic' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'quarterly' | 'annual';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

// Central organization (e.g., Ministry, Educational Group)
export interface Organization {
    id: string;
    name: string;
    nameAr: string;
    type: OrganizationType;
    logoUrl?: string;
    contactEmail: string;
    contactPhone?: string;
    address?: string;
    country: string;
    timezone: string;
    
    // Billing
    billingEmail: string;
    taxId?: string;
    
    // Settings
    settings: OrganizationSettings;
    
    // Metadata
    createdAt: number;
    updatedAt: number;
}

export interface OrganizationSettings {
    defaultPlan: SubscriptionPlan;
    maxTeachersPerSchool: number;
    allowCustomBranding: boolean;
    enableAI: boolean;
    enableAdvancedAnalytics: boolean;
    dataRetentionDays: number;
}

// --- Tenant Types (Per School) ---

export interface Tenant {
    id: string;
    slug: string; // URL-safe identifier
    organizationId: string;
    parentTenantId?: string; // For branch hierarchy
    
    // School Info
    name: string;
    nameAr: string;
    schoolType: 'primary' | 'intermediate' | 'secondary' | 'combined';
    logoUrl?: string;
    
    // Location
    city: string;
    district?: string;
    address?: string;
    
    // Status
    status: TenantStatus;
    trialEndsAt?: number;
    
    // Configuration
    settings: TenantSettings;
    
    // Metadata
    createdAt: number;
    updatedAt: number;
    provisionedAt?: number;
}

export interface TenantSettings {
    // Branding
    primaryColor: string;
    accentColor: string;
    
    // Academic
    levels: string[]; // e.g., ['1', '2', '3', '4', '5', '6']
    subjects: string[];
    periodsPerDay: number;
    workingDays: number[]; // 0-6, Sunday=0
    
    // Reports
    reportTemplate: 'standard' | 'detailed' | 'minimal';
    requireDailyReport: boolean;
    reportDeadlineHour: number; // e.g., 16 for 4 PM
    
    // AI
    enableAISuggestions: boolean;
    enableWeeklySummary: boolean;
    
    // Notifications
    enableEmailNotifications: boolean;
    enablePushNotifications: boolean;
}

// --- Subscription & Billing ---

export interface Subscription {
    id: string;
    organizationId: string;
    tenantId?: string; // null = org-level subscription
    
    plan: SubscriptionPlan;
    billingCycle: BillingCycle;
    
    // Pricing
    pricePerMonth: number;
    currency: 'SAR' | 'USD' | 'AED';
    discount?: number; // percentage
    
    // Status
    status: 'active' | 'cancelled' | 'expired' | 'trial';
    startedAt: number;
    currentPeriodStart: number;
    currentPeriodEnd: number;
    cancelledAt?: number;
    
    // Limits
    maxTeachers: number;
    maxSchools?: number;
    
    // Metadata
    createdAt: number;
    updatedAt: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    organizationId: string;
    subscriptionId: string;
    
    // Amounts
    subtotal: number;
    tax: number;
    taxRate: number; // e.g., 15 for 15%
    total: number;
    currency: 'SAR' | 'USD' | 'AED';
    
    // Period
    periodStart: string; // ISO date
    periodEnd: string;
    
    // Status
    status: InvoiceStatus;
    dueDate: string;
    paidAt?: number;
    
    // Items
    items: InvoiceItem[];
    
    // Notes
    notes?: string;
    
    // Metadata
    createdAt: number;
}

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

// --- User Invitation ---

export interface UserInvite {
    id: string;
    tenantId: string;
    email: string;
    role: SaaSRole;
    
    // Token
    token: string;
    expiresAt: number;
    
    // Status
    status: 'pending' | 'accepted' | 'expired';
    acceptedAt?: number;
    
    // Invited by
    invitedBy: string;
    createdAt: number;
}

// --- Enhanced RBAC for SaaS ---

export type SaaSRole = 
    | 'org_admin'      // Can see all tenants in organization
    | 'branch_admin'   // Can see tenants in their branch
    | 'school_owner'   // Owner of a single school
    | 'school_admin'   // Admin of a single school
    | 'supervisor'     // Supervisor within a school
    | 'teacher';       // Teacher within a school

export interface SaaSPermission {
    resource: string;
    actions: ('create' | 'read' | 'update' | 'delete' | 'manage')[];
    scope: 'own' | 'tenant' | 'branch' | 'organization';
}

export const SAAS_ROLE_PERMISSIONS: Record<SaaSRole, SaaSPermission[]> = {
    org_admin: [
        { resource: 'tenants', actions: ['create', 'read', 'update', 'delete', 'manage'], scope: 'organization' },
        { resource: 'users', actions: ['create', 'read', 'update', 'delete', 'manage'], scope: 'organization' },
        { resource: 'reports', actions: ['read'], scope: 'organization' },
        { resource: 'analytics', actions: ['read'], scope: 'organization' },
        { resource: 'billing', actions: ['read', 'manage'], scope: 'organization' },
        { resource: 'settings', actions: ['read', 'update'], scope: 'organization' }
    ],
    branch_admin: [
        { resource: 'tenants', actions: ['read', 'update'], scope: 'branch' },
        { resource: 'users', actions: ['create', 'read', 'update'], scope: 'branch' },
        { resource: 'reports', actions: ['read'], scope: 'branch' },
        { resource: 'analytics', actions: ['read'], scope: 'branch' }
    ],
    school_owner: [
        { resource: 'tenants', actions: ['read', 'update'], scope: 'tenant' },
        { resource: 'users', actions: ['create', 'read', 'update', 'delete'], scope: 'tenant' },
        { resource: 'reports', actions: ['read'], scope: 'tenant' },
        { resource: 'analytics', actions: ['read'], scope: 'tenant' },
        { resource: 'settings', actions: ['read', 'update'], scope: 'tenant' },
        { resource: 'billing', actions: ['read'], scope: 'tenant' }
    ],
    school_admin: [
        { resource: 'users', actions: ['create', 'read', 'update'], scope: 'tenant' },
        { resource: 'reports', actions: ['read'], scope: 'tenant' },
        { resource: 'analytics', actions: ['read'], scope: 'tenant' },
        { resource: 'settings', actions: ['read', 'update'], scope: 'tenant' }
    ],
    supervisor: [
        { resource: 'users', actions: ['read'], scope: 'tenant' },
        { resource: 'reports', actions: ['read'], scope: 'tenant' },
        { resource: 'analytics', actions: ['read'], scope: 'tenant' }
    ],
    teacher: [
        { resource: 'reports', actions: ['create', 'read', 'update'], scope: 'own' },
        { resource: 'analytics', actions: ['read'], scope: 'own' }
    ]
};

// --- Tenant Context ---

export interface TenantContext {
    organizationId: string;
    tenantId: string;
    tenantSlug: string;
    userId: string;
    userRole: SaaSRole;
    permissions: SaaSPermission[];
}

// --- Provisioning ---

export interface ProvisioningRequest {
    organizationId: string;
    schools: SchoolProvisionData[];
}

export interface SchoolProvisionData {
    name: string;
    nameAr: string;
    city: string;
    schoolType: Tenant['schoolType'];
    adminEmail: string;
    adminName: string;
    levels?: string[];
    subjects?: string[];
}

export interface ProvisioningResult {
    success: boolean;
    tenantId?: string;
    tenantSlug?: string;
    adminInviteId?: string;
    error?: string;
}

// --- Default Settings Templates ---

export const DEFAULT_TENANT_SETTINGS: TenantSettings = {
    primaryColor: '#4F46E5',
    accentColor: '#10B981',
    levels: ['1', '2', '3', '4', '5', '6'],
    subjects: ['القرآن الكريم', 'اللغة العربية', 'الرياضيات', 'العلوم', 'الدراسات الإسلامية'],
    periodsPerDay: 7,
    workingDays: [0, 1, 2, 3, 4], // Sunday to Thursday
    reportTemplate: 'standard',
    requireDailyReport: true,
    reportDeadlineHour: 16,
    enableAISuggestions: true,
    enableWeeklySummary: true,
    enableEmailNotifications: true,
    enablePushNotifications: false
};

export const DEFAULT_ORG_SETTINGS: OrganizationSettings = {
    defaultPlan: 'enterprise',
    maxTeachersPerSchool: 50,
    allowCustomBranding: true,
    enableAI: true,
    enableAdvancedAnalytics: true,
    dataRetentionDays: 365
};
