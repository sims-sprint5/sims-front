import axios, { type AxiosRequestConfig } from 'axios';
import { buildTenantApiUrl, getCurrentTenant, hasTenantSubdomain, isSuperadminHost } from '../utils/tenantUtils';
import type { ApiError } from '../types/api.types';

const axiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Required for Laravel Sanctum CSRF cookie and session-based auth.
  withCredentials: true,
});

let sanctumInitPromise: Promise<void> | null = null;

/**
 * Initializes Laravel Sanctum CSRF cookie.
 * Safe to call multiple times; it will be deduplicated.
 */
export async function initializeSanctum(): Promise<void> {
  if (!sanctumInitPromise) {
    sanctumInitPromise = axiosInstance
      .get('/sanctum/csrf-cookie')
      .then(() => undefined)
      .catch((err) => {
        sanctumInitPromise = null;
        throw err;
      });
  }

  await sanctumInitPromise;
}

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  const tenant = getCurrentTenant();
  
  config.headers = config.headers ?? {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Only send X-Tenant for real tenant subdomains.
  // On base domain (simsgrup2.app) backend should resolve central context without tenant header.
  if (hasTenantSubdomain()) {
    config.headers['X-Tenant'] = tenant;
  } else if ('X-Tenant' in config.headers) {
    delete (config.headers as Record<string, unknown>)['X-Tenant'];
  }
  
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_tenant');
        window.location.href = isSuperadminHost() ? '/superadmin/login' : '/login';
      }

      // Debug logging in dev: log 4xx and 5xx (except 403 which is often expected/handled)
      if (import.meta.env.DEV && error.response.status >= 400 && error.response.status !== 403) {
        const method = String(error.config?.method || 'GET').toUpperCase();
        const url = String(error.config?.url || '');
        const payload = {
          method,
          url,
          status: error.response.status,
          responseData: error.response.data,
          requestData: error.config?.data,
        };
        // eslint-disable-next-line no-console
        if (error.response.status >= 500) {
          console.error('[API 5xx] ' + JSON.stringify(payload, null, 2));
        } else {
          console.warn('[API 4xx] ' + JSON.stringify(payload, null, 2));
        }
      }

      // Include the raw response data so callers can show backend messages.
      throw {
        message: error.response.data?.message || 'errors.requestFailed',
        errors: error.response.data?.errors || {},
        status: error.response.status,
        responseData: error.response.data,
      } as ApiError & { status: number; responseData?: any };
    }

    throw {
      message: 'errors.serverConnection',
      errors: {},
    } as ApiError;
  }
);

async function request<T>(endpoint: string, options: AxiosRequestConfig = {}): Promise<T> {
  const fullUrl = buildTenantApiUrl(endpoint);
  const response = await axiosInstance.request<T>({
    url: fullUrl,
    ...options,
  });
  return response.data;
}

export const apiClient = {
  get: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, data?: any) =>
    request<T>(endpoint, {
      method: 'POST',
      data,
    }),

  put: <T>(endpoint: string, data?: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      data,
    }),

  patch: <T>(endpoint: string, data?: any) =>
    request<T>(endpoint, {
      method: 'PATCH',
      data,
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};

