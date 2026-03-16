import axios from 'axios';
import type {
  Tenant,
  CreateTenantData,
  UpdateTenantData,
  TenantsResponse,
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
    status: raw.status ?? 'active',
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
    const raw = await superadminHttp.post<any>('/v1/superadmin/tenants', data);
    return normalizeTenant(raw?.data ?? raw);
  },

  async updateTenant(data: UpdateTenantData): Promise<Tenant> {
    const raw = await superadminHttp.put<any>(`/v1/superadmin/tenants/${data.id}`, data);
    return normalizeTenant(raw?.data ?? raw);
  },

  async deleteTenant(id: string): Promise<void> {
    await superadminHttp.delete(`/v1/superadmin/tenants/${id}`);
  },
};