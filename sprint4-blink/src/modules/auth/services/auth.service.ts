import { apiClient } from '@/shared/services/api.service';
import { getCurrentTenant } from '@/shared/utils/tenantUtils';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
} from '../types/auth.types';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';
const AUTH_TENANT_KEY = 'auth_tenant';

function extractToken(payload: any): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  return payload.token || payload.access_token || payload.data?.token || payload.data?.access_token;
}

function extractUser(payload: any): User | undefined {
  if (!payload || typeof payload !== 'object') return undefined;

  // Common variants
  if (payload.user && typeof payload.user === 'object') return payload.user as User;
  if (payload.data && typeof payload.data === 'object') {
    if (payload.data.user && typeof payload.data.user === 'object') return payload.data.user as User;
    return payload.data as User;
  }

  return undefined;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const payload = await apiClient.post<any>('/v1/auth/login', credentials);

    const token = extractToken(payload);
    const user = extractUser(payload);

    if (!token || !user) {
      // Keep a predictable error shape for UI
      throw {
        message: 'errors.requestFailed',
        errors: {
          auth: ['Respuesta inválida del servidor'],
        },
      };
    }

    this.setToken(token);
    this.setUser(user);
    this.setTenant(getCurrentTenant());

    return { token, user };
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const payload = await apiClient.post<any>('/v1/auth/register', {
      name: data.name,
      email: data.email,
      password: data.password,
      password_confirmation: data.password_confirmation,
      phone: data.phone,
      role: data.role,
    });

    const token = extractToken(payload);
    const user = extractUser(payload);

    if (!token || !user) {
      throw {
        message: 'errors.requestFailed',
        errors: {
          auth: ['Respuesta inválida del servidor'],
        },
      };
    }

    this.setToken(token);
    this.setUser(user);
    this.setTenant(getCurrentTenant());

    return { token, user };
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post<void>('/v1/auth/logout');
    } finally {
      this.clearAuth();
    }
  },

  async logoutAll(): Promise<void> {
    try {
      await apiClient.post<void>('/v1/auth/logout-all');
    } finally {
      this.clearAuth();
    }
  },

  async getCurrentUser(): Promise<User> {
    const payload = await apiClient.get<any>('/v1/auth/me');

    // extractUser gestiona els wraps { user: ... }, { data: { user: ... } }, { data: ... }
    // Si cap no fa match (resposta plana), usem el payload directament
    let raw = extractUser(payload) ?? payload;

    // Intentar camp id des de diverses variants del backend
    if (raw && typeof raw === 'object' && !raw.id && raw.user_id) {
      raw = { ...raw, id: raw.user_id };
    }

    if (!raw || typeof raw !== 'object' || !raw.id) {
      throw {
        message: 'errors.notAuthenticated',
        errors: {},
      };
    }

    return raw as User;
  },

  async changePassword(data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Promise<void> {
    await apiClient.post<void>('/v1/auth/change-password', data);
  },

  setToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  },

  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  setUser(user: User): void {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  },

  getUser(): User | null {
    const stored = localStorage.getItem(AUTH_USER_KEY);
    return stored ? (JSON.parse(stored) as User) : null;
  },

  setTenant(tenant: string): void {
    localStorage.setItem(AUTH_TENANT_KEY, tenant);
  },

  getTenant(): string | null {
    return localStorage.getItem(AUTH_TENANT_KEY);
  },

  clearAuth(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TENANT_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUser();
  },
} as const;

export type AuthService = typeof authService;
