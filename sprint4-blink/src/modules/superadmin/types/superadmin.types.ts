export interface Tenant {
    id: string;
    name: string;
    domain: string;
    email?: string;
    admin_email?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateTenantData {
    id: string;
    name: string;
}

export interface UpdateTenantData {
    id: string;
    name: string;
    admin_email: string;
    admin_password?: string | undefined;
    admin_password_confirmation?: string | undefined;
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

export interface Superadmin {
    id: string;
    name: string;
    email: string;
    created_at: string;
    updated_at: string;
}

export interface CreateSuperadminData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export interface UpdateSuperadminData {
    id: string;
    name: string;
    email: string;
    password?: string;
    password_confirmation?: string;
}

export interface SuperadminsResponse {
    data: Superadmin[];
}