import axios, { type AxiosRequestConfig } from 'axios';
import { buildTenantApiUrl } from '../utils/tenantUtils';
import type { ApiError } from '../types/api.types';

/**
 * Axios instance sin baseURL estático
 * Las URLs se construyen dinámicamente en cada request según el tenant
 */
const axiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Interceptor de request: Agregar token de autenticación
 */
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Interceptor de response: Manegar errores y 401
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Manejo especial de 401 (no autenticado / token expirado)
      if (error.response.status === 401) {
        // Limpiar autenticación del localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_tenant');

        // Redirigir al login (usando navegación del navegador para evitar circular imports)
        window.location.href = '/login';
      }

      // Helpful debugging in dev: log 4xx y 5xx
      if (import.meta.env.DEV && error.response.status >= 400) {
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

      throw {
        message: error.response.data?.message || 'errors.requestFailed',
        errors: error.response.data?.errors || {},
        status: error.response.status,
      } as ApiError & { status: number };
    }

    throw {
      message: 'errors.serverConnection',
      errors: {},
    } as ApiError;
  }
);

/**
 * Function genérica para hacer requests
 * Construye la URL completa dinámicamente según el tenant
 */
async function request<T>(
  endpoint: string,
  options: AxiosRequestConfig = {}
): Promise<T> {
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

