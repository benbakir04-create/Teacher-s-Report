/**
 * Supabase Client
 * 
 * Initializes the Supabase client for backend connectivity.
 * Configure via environment variables:
 *   - VITE_SUPABASE_URL
 *   - VITE_SUPABASE_ANON_KEY
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Database Types (generated from Supabase schema)
export interface Database {
    public: {
        Tables: {
            organizations: {
                Row: {
                    id: string;
                    name: string;
                    name_ar: string;
                    type: string;
                    contact_email: string;
                    contact_phone: string | null;
                    country: string;
                    timezone: string;
                    billing_email: string;
                    tax_id: string | null;
                    logo_url: string | null;
                    settings: object;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
            };
            tenants: {
                Row: {
                    id: string;
                    slug: string;
                    organization_id: string;
                    parent_tenant_id: string | null;
                    name: string;
                    name_ar: string;
                    school_type: string;
                    logo_url: string | null;
                    city: string;
                    district: string | null;
                    address: string | null;
                    status: string;
                    trial_ends_at: string | null;
                    settings: object;
                    created_at: string;
                    updated_at: string;
                    provisioned_at: string | null;
                };
                Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['tenants']['Insert']>;
            };
            subscriptions: {
                Row: {
                    id: string;
                    organization_id: string;
                    tenant_id: string | null;
                    plan: string;
                    billing_cycle: string;
                    price_per_month: number;
                    currency: string;
                    discount: number | null;
                    status: string;
                    started_at: string;
                    current_period_start: string;
                    current_period_end: string;
                    cancelled_at: string | null;
                    max_teachers: number;
                    max_schools: number | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
            };
            invoices: {
                Row: {
                    id: string;
                    invoice_number: string;
                    organization_id: string;
                    subscription_id: string;
                    subtotal: number;
                    tax: number;
                    tax_rate: number;
                    total: number;
                    currency: string;
                    period_start: string;
                    period_end: string;
                    status: string;
                    due_date: string;
                    paid_at: string | null;
                    items: object;
                    notes: string | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['invoices']['Insert']>;
            };
            user_invites: {
                Row: {
                    id: string;
                    tenant_id: string;
                    email: string;
                    role: string;
                    token: string;
                    expires_at: string;
                    status: string;
                    accepted_at: string | null;
                    invited_by: string;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['user_invites']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['user_invites']['Insert']>;
            };
        };
    };
}

// Create client only if credentials are available
let supabase: SupabaseClient<Database> | null = null;

if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true
        }
    });
}

export { supabase };

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
    return !!supabase;
}

// Typed helpers for common operations
export const db = {
    organizations: {
        async list() {
            if (!supabase) throw new Error('Supabase not configured');
            const { data, error } = await supabase.from('organizations').select('*');
            if (error) throw error;
            return data;
        },
        async get(id: string) {
            if (!supabase) throw new Error('Supabase not configured');
            const { data, error } = await supabase.from('organizations').select('*').eq('id', id).single();
            if (error) throw error;
            return data;
        },
        async create(org: Database['public']['Tables']['organizations']['Insert']) {
            if (!supabase) throw new Error('Supabase not configured');
            const { data, error } = await supabase.from('organizations').insert(org).select().single();
            if (error) throw error;
            return data;
        },
        async update(id: string, updates: Database['public']['Tables']['organizations']['Update']) {
            if (!supabase) throw new Error('Supabase not configured');
            const { data, error } = await supabase.from('organizations').update(updates).eq('id', id).select().single();
            if (error) throw error;
            return data;
        }
    },
    tenants: {
        async listByOrg(orgId: string) {
            if (!supabase) throw new Error('Supabase not configured');
            const { data, error } = await supabase.from('tenants').select('*').eq('organization_id', orgId);
            if (error) throw error;
            return data;
        },
        async get(id: string) {
            if (!supabase) throw new Error('Supabase not configured');
            const { data, error } = await supabase.from('tenants').select('*').eq('id', id).single();
            if (error) throw error;
            return data;
        },
        async getBySlug(slug: string) {
            if (!supabase) throw new Error('Supabase not configured');
            const { data, error } = await supabase.from('tenants').select('*').eq('slug', slug).single();
            if (error) throw error;
            return data;
        },
        async create(tenant: Database['public']['Tables']['tenants']['Insert']) {
            if (!supabase) throw new Error('Supabase not configured');
            const { data, error } = await supabase.from('tenants').insert(tenant).select().single();
            if (error) throw error;
            return data;
        },
        async update(id: string, updates: Database['public']['Tables']['tenants']['Update']) {
            if (!supabase) throw new Error('Supabase not configured');
            const { data, error } = await supabase.from('tenants').update(updates).eq('id', id).select().single();
            if (error) throw error;
            return data;
        }
    },
    invites: {
        async listByTenant(tenantId: string) {
            if (!supabase) throw new Error('Supabase not configured');
            const { data, error } = await supabase.from('user_invites').select('*').eq('tenant_id', tenantId);
            if (error) throw error;
            return data;
        },
        async getByToken(token: string) {
            if (!supabase) throw new Error('Supabase not configured');
            const { data, error } = await supabase.from('user_invites').select('*').eq('token', token).single();
            if (error) throw error;
            return data;
        },
        async create(invite: Database['public']['Tables']['user_invites']['Insert']) {
            if (!supabase) throw new Error('Supabase not configured');
            const { data, error } = await supabase.from('user_invites').insert(invite).select().single();
            if (error) throw error;
            return data;
        },
        async accept(token: string) {
            if (!supabase) throw new Error('Supabase not configured');
            const { data, error } = await supabase
                .from('user_invites')
                .update({ status: 'accepted', accepted_at: new Date().toISOString() })
                .eq('token', token)
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    }
};
