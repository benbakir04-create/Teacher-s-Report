import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { 
    organizationService 
} from '../services/organizationService';
import {
    Organization,
    Tenant,
    TenantContext,
    SaaSRole,
    Subscription,
    SAAS_ROLE_PERMISSIONS
} from '../types/saas.types';

// --- Tenant Context ---

interface TenantContextValue {
    organization: Organization | null;
    tenant: Tenant | null;
    subscription: Subscription | null;
    userRole: SaaSRole | null;
    isLoading: boolean;
    error: string | null;
    
    // Actions
    switchTenant: (tenantId: string) => Promise<void>;
    switchOrganization: (orgId: string) => Promise<void>;
    refreshContext: () => Promise<void>;
    
    // Helpers
    hasPermission: (resource: string, action: string) => boolean;
    canAccessTenant: (tenantId: string) => boolean;
}

const TenantContextDefault: TenantContextValue = {
    organization: null,
    tenant: null,
    subscription: null,
    userRole: null,
    isLoading: true,
    error: null,
    switchTenant: async () => {},
    switchOrganization: async () => {},
    refreshContext: async () => {},
    hasPermission: () => false,
    canAccessTenant: () => false
};

const TenantCtx = createContext<TenantContextValue>(TenantContextDefault);

// --- Provider ---

interface TenantProviderProps {
    children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [userRole, setUserRole] = useState<SaaSRole | null>('org_admin'); // Default for demo
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadContext = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const orgId = organizationService.getCurrentOrgId();
            const tenantId = organizationService.getCurrentTenantId();

            if (orgId) {
                const org = await organizationService.getOrganization(orgId);
                setOrganization(org);

                if (org) {
                    const sub = await organizationService.getSubscription(orgId);
                    setSubscription(sub);
                }
            }

            if (tenantId) {
                const t = await organizationService.getTenant(tenantId);
                setTenant(t);
            }
        } catch (err) {
            console.error('Failed to load tenant context:', err);
            setError('فشل تحميل بيانات المؤسسة');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadContext();
    }, [loadContext]);

    const switchTenant = useCallback(async (tenantId: string) => {
        organizationService.setCurrentTenant(tenantId);
        const t = await organizationService.getTenant(tenantId);
        setTenant(t);
    }, []);

    const switchOrganization = useCallback(async (orgId: string) => {
        organizationService.setCurrentOrganization(orgId);
        organizationService.setCurrentTenant(null);
        setTenant(null);
        
        const org = await organizationService.getOrganization(orgId);
        setOrganization(org);

        if (org) {
            const sub = await organizationService.getSubscription(orgId);
            setSubscription(sub);
        }
    }, []);

    const hasPermission = useCallback((resource: string, action: string): boolean => {
        if (!userRole) return false;
        
        const permissions = SAAS_ROLE_PERMISSIONS[userRole];
        return permissions.some(
            p => p.resource === resource && p.actions.includes(action as any)
        );
    }, [userRole]);

    const canAccessTenant = useCallback((tenantId: string): boolean => {
        if (!userRole) return false;
        
        // Org admins can access all tenants
        if (userRole === 'org_admin') return true;
        
        // Others can only access their own tenant
        return tenant?.id === tenantId;
    }, [userRole, tenant]);

    const value: TenantContextValue = {
        organization,
        tenant,
        subscription,
        userRole,
        isLoading,
        error,
        switchTenant,
        switchOrganization,
        refreshContext: loadContext,
        hasPermission,
        canAccessTenant
    };

    return (
        <TenantCtx.Provider value={value}>
            {children}
        </TenantCtx.Provider>
    );
}

// --- Hook ---

export function useTenant() {
    return useContext(TenantCtx);
}

// --- Organization Hook ---

export function useOrganization() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { organization } = useTenant();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [orgs, tenantList] = await Promise.all([
                organizationService.listOrganizations(),
                organization 
                    ? organizationService.listTenants(organization.id)
                    : []
            ]);

            setOrganizations(orgs);
            setTenants(tenantList);
        } catch (err) {
            console.error('Failed to load organization data:', err);
            setError('فشل تحميل بيانات المؤسسات');
        } finally {
            setIsLoading(false);
        }
    }, [organization]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const createTenant = useCallback(async (data: Partial<Tenant>) => {
        const tenant = await organizationService.createTenant(data);
        setTenants(prev => [...prev, tenant]);
        return tenant;
    }, []);

    const updateTenant = useCallback(async (tenantId: string, updates: Partial<Tenant>) => {
        const updated = await organizationService.updateTenant(tenantId, updates);
        setTenants(prev => prev.map(t => t.id === tenantId ? updated : t));
        return updated;
    }, []);

    return {
        organizations,
        tenants,
        isLoading,
        error,
        refresh: loadData,
        createTenant,
        updateTenant
    };
}

// --- Invites Hook ---

export function useInvites(tenantId: string | null) {
    const [invites, setInvites] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadInvites = useCallback(async () => {
        if (!tenantId) return;
        
        setIsLoading(true);
        try {
            const list = await organizationService.listInvites(tenantId);
            setInvites(list);
        } catch (err) {
            console.error('Failed to load invites:', err);
        } finally {
            setIsLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        loadInvites();
    }, [loadInvites]);

    const createInvite = useCallback(async (email: string, role: SaaSRole) => {
        if (!tenantId) return;
        
        const invite = await organizationService.createInvite({ tenantId, email, role });
        setInvites(prev => [...prev, invite]);
        return invite;
    }, [tenantId]);

    return {
        invites,
        isLoading,
        refresh: loadInvites,
        createInvite
    };
}
