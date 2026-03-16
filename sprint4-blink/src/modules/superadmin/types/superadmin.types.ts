export interface Tenant {
    id: number;
    name: string;
    domain: string;
    email?: string;
    status?: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
}

export interface CreateTenantData {
    name: string;
    domain: string;
    email?: string;
}

export interface UpdateTenantData {
    name?: string;
    domain?: string;
    email?: string;
    status?: 'active' | 'inactive';
}

export interface TenantsResponse {
    data: Tenant[];
    meta?: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
    };
}