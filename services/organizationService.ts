/**
 * Organization Service
 * 
 * Manages organizations, tenants, and provisioning for SaaS platform.
 * Phase 10: Multi-Tenant Architecture
 */

import {
    Organization,
    Tenant,
    TenantSettings,
    UserInvite,
    Subscription,
    Invoice,
    ProvisioningRequest,
    ProvisioningResult,
    SchoolProvisionData,
    SaaSRole,
    DEFAULT_TENANT_SETTINGS,
    DEFAULT_ORG_SETTINGS,
    TenantStatus
} from '../types/saas.types';

// --- Configuration ---
const API_BASE_URL = import.meta.env.VITE_SAAS_API_URL || '';
const USE_MOCK = !API_BASE_URL;

// --- Mock Data Storage (Development) ---
let mockOrganizations: Organization[] = [];
let mockTenants: Tenant[] = [];
let mockInvites: UserInvite[] = [];
let mockSubscriptions: Subscription[] = [];
let mockInvoices: Invoice[] = [];

// --- Utility Functions ---

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const num = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}-${num}`;
}

// --- Organization Service Class ---

class OrganizationService {
    private currentTenantId: string | null = null;
    private currentOrgId: string | null = null;

    // --- Context Management ---

    setCurrentTenant(tenantId: string | null) {
        this.currentTenantId = tenantId;
        if (tenantId) {
            localStorage.setItem('currentTenantId', tenantId);
        } else {
            localStorage.removeItem('currentTenantId');
        }
    }

    setCurrentOrganization(orgId: string | null) {
        this.currentOrgId = orgId;
        if (orgId) {
            localStorage.setItem('currentOrgId', orgId);
        } else {
            localStorage.removeItem('currentOrgId');
        }
    }

    getCurrentTenantId(): string | null {
        return this.currentTenantId || localStorage.getItem('currentTenantId');
    }

    getCurrentOrgId(): string | null {
        return this.currentOrgId || localStorage.getItem('currentOrgId');
    }

    // --- Organization CRUD ---

    async createOrganization(data: Partial<Organization>): Promise<Organization> {
        const org: Organization = {
            id: generateId(),
            name: data.name || '',
            nameAr: data.nameAr || '',
            type: data.type || 'independent',
            contactEmail: data.contactEmail || '',
            contactPhone: data.contactPhone,
            address: data.address,
            country: data.country || 'SA',
            timezone: data.timezone || 'Asia/Riyadh',
            billingEmail: data.billingEmail || data.contactEmail || '',
            taxId: data.taxId,
            logoUrl: data.logoUrl,
            settings: { ...DEFAULT_ORG_SETTINGS, ...data.settings },
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        if (USE_MOCK) {
            mockOrganizations.push(org);
            return org;
        }

        const response = await fetch(`${API_BASE_URL}/api/organizations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(org)
        });

        if (!response.ok) throw new Error('Failed to create organization');
        return response.json();
    }

    async getOrganization(orgId: string): Promise<Organization | null> {
        if (USE_MOCK) {
            return mockOrganizations.find(o => o.id === orgId) || null;
        }

        const response = await fetch(`${API_BASE_URL}/api/organizations/${orgId}`);
        if (!response.ok) return null;
        return response.json();
    }

    async listOrganizations(): Promise<Organization[]> {
        if (USE_MOCK) {
            return mockOrganizations;
        }

        const response = await fetch(`${API_BASE_URL}/api/organizations`);
        if (!response.ok) return [];
        return response.json();
    }

    // --- Tenant CRUD ---

    async createTenant(data: Partial<Tenant>): Promise<Tenant> {
        const slug = generateSlug(data.name || '') || `school-${generateId()}`;
        
        const tenant: Tenant = {
            id: generateId(),
            slug,
            organizationId: data.organizationId || this.getCurrentOrgId() || '',
            parentTenantId: data.parentTenantId,
            name: data.name || '',
            nameAr: data.nameAr || '',
            schoolType: data.schoolType || 'primary',
            logoUrl: data.logoUrl,
            city: data.city || '',
            district: data.district,
            address: data.address,
            status: 'pending',
            trialEndsAt: Date.now() + (14 * 24 * 60 * 60 * 1000), // 14 days
            settings: { ...DEFAULT_TENANT_SETTINGS, ...data.settings },
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        if (USE_MOCK) {
            mockTenants.push(tenant);
            return tenant;
        }

        const response = await fetch(`${API_BASE_URL}/api/tenants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tenant)
        });

        if (!response.ok) throw new Error('Failed to create tenant');
        return response.json();
    }

    async getTenant(tenantId: string): Promise<Tenant | null> {
        if (USE_MOCK) {
            return mockTenants.find(t => t.id === tenantId) || null;
        }

        const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}`);
        if (!response.ok) return null;
        return response.json();
    }

    async getTenantBySlug(slug: string): Promise<Tenant | null> {
        if (USE_MOCK) {
            return mockTenants.find(t => t.slug === slug) || null;
        }

        const response = await fetch(`${API_BASE_URL}/api/tenants/by-slug/${slug}`);
        if (!response.ok) return null;
        return response.json();
    }

    async listTenants(orgId?: string): Promise<Tenant[]> {
        const targetOrgId = orgId || this.getCurrentOrgId();
        
        if (USE_MOCK) {
            return targetOrgId 
                ? mockTenants.filter(t => t.organizationId === targetOrgId)
                : mockTenants;
        }

        const url = targetOrgId 
            ? `${API_BASE_URL}/api/organizations/${targetOrgId}/tenants`
            : `${API_BASE_URL}/api/tenants`;
            
        const response = await fetch(url);
        if (!response.ok) return [];
        return response.json();
    }

    async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant> {
        if (USE_MOCK) {
            const index = mockTenants.findIndex(t => t.id === tenantId);
            if (index === -1) throw new Error('Tenant not found');
            
            mockTenants[index] = {
                ...mockTenants[index],
                ...updates,
                updatedAt: Date.now()
            };
            return mockTenants[index];
        }

        const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        if (!response.ok) throw new Error('Failed to update tenant');
        return response.json();
    }

    async updateTenantSettings(tenantId: string, settings: Partial<TenantSettings>): Promise<Tenant> {
        const tenant = await this.getTenant(tenantId);
        if (!tenant) throw new Error('Tenant not found');

        return this.updateTenant(tenantId, {
            settings: { ...tenant.settings, ...settings }
        });
    }

    async updateTenantStatus(tenantId: string, status: TenantStatus): Promise<Tenant> {
        const updates: Partial<Tenant> = { status };
        if (status === 'active') {
            updates.provisionedAt = Date.now();
        }
        return this.updateTenant(tenantId, updates);
    }

    // --- Bulk Provisioning ---

    async bulkProvision(request: ProvisioningRequest): Promise<ProvisioningResult[]> {
        const results: ProvisioningResult[] = [];

        for (const school of request.schools) {
            try {
                // Create tenant
                const tenant = await this.createTenant({
                    organizationId: request.organizationId,
                    name: school.name,
                    nameAr: school.nameAr,
                    city: school.city,
                    schoolType: school.schoolType,
                    settings: {
                        ...DEFAULT_TENANT_SETTINGS,
                        levels: school.levels || DEFAULT_TENANT_SETTINGS.levels,
                        subjects: school.subjects || DEFAULT_TENANT_SETTINGS.subjects
                    }
                });

                // Create admin invite
                const invite = await this.createInvite({
                    tenantId: tenant.id,
                    email: school.adminEmail,
                    role: 'school_admin'
                });

                // Mark as provisioned
                await this.updateTenantStatus(tenant.id, 'active');

                results.push({
                    success: true,
                    tenantId: tenant.id,
                    tenantSlug: tenant.slug,
                    adminInviteId: invite.id
                });
            } catch (error) {
                results.push({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        return results;
    }

    // --- User Invitations ---

    async createInvite(data: { tenantId: string; email: string; role: SaaSRole }): Promise<UserInvite> {
        const invite: UserInvite = {
            id: generateId(),
            tenantId: data.tenantId,
            email: data.email,
            role: data.role,
            token: crypto.randomUUID(),
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
            status: 'pending',
            invitedBy: 'system',
            createdAt: Date.now()
        };

        if (USE_MOCK) {
            mockInvites.push(invite);
            return invite;
        }

        const response = await fetch(`${API_BASE_URL}/api/invites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invite)
        });

        if (!response.ok) throw new Error('Failed to create invite');
        return response.json();
    }

    async bulkInvite(tenantId: string, invites: { email: string; role: SaaSRole }[]): Promise<UserInvite[]> {
        const results: UserInvite[] = [];
        
        for (const inv of invites) {
            const invite = await this.createInvite({
                tenantId,
                email: inv.email,
                role: inv.role
            });
            results.push(invite);
        }

        return results;
    }

    async getInvite(token: string): Promise<UserInvite | null> {
        if (USE_MOCK) {
            return mockInvites.find(i => i.token === token) || null;
        }

        const response = await fetch(`${API_BASE_URL}/api/invites/${token}`);
        if (!response.ok) return null;
        return response.json();
    }

    async acceptInvite(token: string): Promise<{ tenant: Tenant; role: SaaSRole }> {
        const invite = await this.getInvite(token);
        if (!invite) throw new Error('Invalid invite');
        if (invite.status !== 'pending') throw new Error('Invite already used');
        if (Date.now() > invite.expiresAt) throw new Error('Invite expired');

        if (USE_MOCK) {
            const idx = mockInvites.findIndex(i => i.token === token);
            mockInvites[idx].status = 'accepted';
            mockInvites[idx].acceptedAt = Date.now();
        }

        const tenant = await this.getTenant(invite.tenantId);
        if (!tenant) throw new Error('Tenant not found');

        return { tenant, role: invite.role };
    }

    async listInvites(tenantId: string): Promise<UserInvite[]> {
        if (USE_MOCK) {
            return mockInvites.filter(i => i.tenantId === tenantId);
        }

        const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/invites`);
        if (!response.ok) return [];
        return response.json();
    }

    // --- Subscriptions ---

    async createSubscription(orgId: string, plan: Subscription['plan']): Promise<Subscription> {
        const now = Date.now();
        const subscription: Subscription = {
            id: generateId(),
            organizationId: orgId,
            plan,
            billingCycle: 'annual',
            pricePerMonth: plan === 'enterprise' ? 500 : plan === 'pro' ? 200 : 100,
            currency: 'SAR',
            status: plan === 'trial' ? 'trial' : 'active',
            startedAt: now,
            currentPeriodStart: now,
            currentPeriodEnd: now + (365 * 24 * 60 * 60 * 1000),
            maxTeachers: plan === 'enterprise' ? 1000 : plan === 'pro' ? 100 : 30,
            maxSchools: plan === 'enterprise' ? 50 : plan === 'pro' ? 10 : 1,
            createdAt: now,
            updatedAt: now
        };

        if (USE_MOCK) {
            mockSubscriptions.push(subscription);
            return subscription;
        }

        const response = await fetch(`${API_BASE_URL}/api/subscriptions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });

        if (!response.ok) throw new Error('Failed to create subscription');
        return response.json();
    }

    async getSubscription(orgId: string): Promise<Subscription | null> {
        if (USE_MOCK) {
            return mockSubscriptions.find(s => s.organizationId === orgId) || null;
        }

        const response = await fetch(`${API_BASE_URL}/api/organizations/${orgId}/subscription`);
        if (!response.ok) return null;
        return response.json();
    }

    // --- Invoices ---

    async createInvoice(orgId: string, subscriptionId: string, period: { start: string; end: string }): Promise<Invoice> {
        const subscription = mockSubscriptions.find(s => s.id === subscriptionId);
        const amount = subscription?.pricePerMonth || 0;
        const tax = amount * 0.15; // 15% VAT

        const invoice: Invoice = {
            id: generateId(),
            invoiceNumber: generateInvoiceNumber(),
            organizationId: orgId,
            subscriptionId,
            subtotal: amount,
            tax,
            taxRate: 15,
            total: amount + tax,
            currency: 'SAR',
            periodStart: period.start,
            periodEnd: period.end,
            status: 'draft',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            items: [
                {
                    description: `اشتراك ${subscription?.plan || 'enterprise'} - ${period.start} إلى ${period.end}`,
                    quantity: 1,
                    unitPrice: amount,
                    total: amount
                }
            ],
            createdAt: Date.now()
        };

        if (USE_MOCK) {
            mockInvoices.push(invoice);
            return invoice;
        }

        const response = await fetch(`${API_BASE_URL}/api/invoices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoice)
        });

        if (!response.ok) throw new Error('Failed to create invoice');
        return response.json();
    }

    async listInvoices(orgId: string): Promise<Invoice[]> {
        if (USE_MOCK) {
            return mockInvoices.filter(i => i.organizationId === orgId);
        }

        const response = await fetch(`${API_BASE_URL}/api/organizations/${orgId}/invoices`);
        if (!response.ok) return [];
        return response.json();
    }

    // --- Demo Data ---

    async seedDemoData(): Promise<void> {
        // Create demo org
        const org = await this.createOrganization({
            name: 'Ministry of Education - Test Region',
            nameAr: 'وزارة التعليم - منطقة الاختبار',
            type: 'central',
            contactEmail: 'admin@moe-test.sa',
            country: 'SA',
            billingEmail: 'billing@moe-test.sa'
        });

        // Create subscription
        await this.createSubscription(org.id, 'enterprise');

        // Create demo schools
        const schools: SchoolProvisionData[] = [
            { name: 'Al-Noor Primary School', nameAr: 'مدرسة النور الابتدائية', city: 'الرياض', schoolType: 'primary', adminEmail: 'admin@alnoor.edu.sa', adminName: 'أحمد محمد' },
            { name: 'Al-Amal Intermediate School', nameAr: 'مدرسة الأمل المتوسطة', city: 'الرياض', schoolType: 'intermediate', adminEmail: 'admin@alamal.edu.sa', adminName: 'خالد سعيد' },
            { name: 'Al-Fajr Secondary School', nameAr: 'مدرسة الفجر الثانوية', city: 'الرياض', schoolType: 'secondary', adminEmail: 'admin@alfajr.edu.sa', adminName: 'محمد علي' }
        ];

        await this.bulkProvision({
            organizationId: org.id,
            schools
        });

        this.setCurrentOrganization(org.id);
    }
}

export const organizationService = new OrganizationService();
