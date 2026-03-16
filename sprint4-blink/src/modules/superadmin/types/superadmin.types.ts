export interface Tenant {
    id: string;
    name: string;
    domain: string;
    email?: string;
    admin_email?: string;
    status?: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
}

export interface CreateTenantData {
    id: string;
    name: string;
    admin_email: string;
    admin_password: string;
}

export interface UpdateTenantData {
    id: string;
    name: string;
    admin_email: string;
    admin_password?: string | undefined;
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