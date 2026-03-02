import axios, { type AxiosRequestConfig } from 'axios';
import type { ApiError } from '../types/api.types';

const RAW_API_URL = import.meta.env.VITE_API_URL || '/api';
const API_URL = String(RAW_API_URL).replace(/\/+$/, '');

function normalizeEndpoint(endpoint: string): string {
  // If baseURL already points to /api/v1, avoid creating /api/v1/v1/... by stripping the /v1 prefix.
  const baseHasV1 = /\/api\/v1$/i.test(API_URL);
  if (baseHasV1 && endpoint.startsWith('/v1/')) return endpoint.replace(/^\/v1/, '');
  return endpoint;
}

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});


axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Helpful debugging in dev: log 4xx and 5xx with request/response info
      if (import.meta.env.DEV && error.response.status >= 400) {
        const method = String(error.config?.method || 'GET').toUpperCase();
        const url = String(error.config?.baseURL || '') + String(error.config?.url || '');
        const payload = {
          method,
          url,
          status: error.response.status,
          responseData: error.response.data,
          requestData: error.config?.data,
          requestHeaders: error.config?.headers,
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

async function request<T>(
  endpoint: string,
  options: AxiosRequestConfig = {}
): Promise<T> {
  const response = await axiosInstance.request<T>({
    url: normalizeEndpoint(endpoint),
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

