import axios from 'axios';
import type {
  Tenant,
  CreateTenantData,
  UpdateTenantData,
  TenantsResponse,
  Superadmin,
  CreateSuperadminData,
  UpdateSuperadminData,
  SuperadminsResponse,
} from '../types/superadmin.types';

const superadminHttp = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

superadminHttp.interceptors.request.use((config) => {
  const token = localStorage.getItem('superadmin_token') ?? localStorage.getItem('auth_token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

superadminHttp.interceptors.response.use(
  (response) => response.data,
  (error) => {
    throw {
      message: error.response?.data?.message || 'errors.requestFailed',
      errors: error.response?.data?.errors || {},
      status: error.response?.status,
    };
  }
);

function normalizeTenant(raw: any): Tenant {
  return {
    id: String(raw.id),
    name: raw.name ?? '',
    domain: raw.domains?. [0]?.domain ?? '',
    email: raw.email ?? undefined,
    admin_email: raw.admin_email ?? undefined,
    created_at: raw.created_at ?? '',
    updated_at: raw.updated_at ?? '',
  };
}

function normalizeTenantsResponse(raw: any): TenantsResponse {
  if (Array.isArray(raw)) {
    return { data: raw.map(normalizeTenant) };
  }
  if (Array.isArray(raw?.data)) {
    return { data: raw.data.map(normalizeTenant), meta: raw.meta };
  }
  return { data: [] };
}

export const superadminService = {
  async getTenants(): Promise<TenantsResponse> {
    const raw = await superadminHttp.get<any>('/v1/superadmin/tenants');
    return normalizeTenantsResponse(raw);
  },

  async getTenantById(id: string): Promise<Tenant> {
    const raw = await superadminHttp.get<any>(`/v1/superadmin/tenants/${id}`);
    return normalizeTenant(raw?.data ?? raw);
  },

  async createTenant(data: CreateTenantData): Promise<Tenant> {
    const payload = {
      id: data.id,
      name: data.name,
    };
    const raw = await superadminHttp.post<any>('/v1/superadmin/tenants', payload);
    return normalizeTenant(raw?.data ?? raw);
  },

  async updateTenant(data: UpdateTenantData): Promise<Tenant> {
    const payload: any = {
      name: data.name,
      admin_email: data.admin_email,
    };
    
    if (data.admin_password !== undefined) {
      payload.admin_password = data.admin_password;
      payload.admin_password_confirmation = data.admin_password_confirmation;
    }
    
    const raw = await superadminHttp.put<any>(`/v1/superadmin/tenants/${data.id}`, payload);
    return normalizeTenant(raw?.data ?? raw);
  },

  async deleteTenant(id: string): Promise<void> {
    await superadminHttp.delete(`/v1/superadmin/tenants/${id}`);
  },

  async getAdmins(): Promise<SuperadminsResponse> {
    const raw = await superadminHttp.get<any>('/v1/superadmin/admins');
    return raw; // Assuming consistent response structure or add normalization if needed
  },

  async createAdmin(data: CreateSuperadminData): Promise<Superadmin> {
    const raw = await superadminHttp.post<any>('/v1/superadmin/admins', data);
    return raw.data ?? raw;
  },

  async updateAdmin(data: UpdateSuperadminData): Promise<Superadmin> {
    const payload: any = {
      name: data.name,
      email: data.email,
    };
    
    if (data.password !== undefined && data.password !== '') {
      payload.password = data.password;
      payload.password_confirmation = data.password_confirmation;
    }
    
    const raw = await superadminHttp.put<any>(`/v1/superadmin/admins/${data.id}`, payload);
    return raw.data ?? raw;
  },

  async deleteAdmin(id: string): Promise<void> {
    await superadminHttp.delete(`/v1/superadmin/admins/${id}`);
  },
};