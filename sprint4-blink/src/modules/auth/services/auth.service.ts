import { apiClient, initializeSanctum } from '@/shared/services/api.service';
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

function getAuthBasePath(): string {
  return getCurrentTenant() === 'central'
    ? '/v1/superadmin/auth'
    : '/v1/auth';
}

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
    // Best-effort: enables Laravel Sanctum CSRF protection when available.
    try {
      await initializeSanctum();
    } catch {
      // Ignore — some backends may not expose Sanctum.
    }

    const payload = await apiClient.post<any>(`${getAuthBasePath()}/login`, {
      ...credentials,
      email: credentials.email.trim(),
    });

    const token = extractToken(payload);
    const user = extractUser(payload);

    if (!token || !user) {
      throw {
        message: 'errors.requestFailed',
        errors: {
          auth: ['Invalid server response'],
        },
      };
    }

    this.setToken(token);
    this.setUser(user);
    this.setTenant(getCurrentTenant());

    return { token, user };
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    // Best-effort: enables Laravel Sanctum CSRF protection when available.
    try {
      await initializeSanctum();
    } catch {
      // Ignore — some backends may not expose Sanctum.
    }

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
          auth: ['Invalid server response'],
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
      await apiClient.post<void>(`${getAuthBasePath()}/logout`);
    } finally {
      this.clearAuth();
    }
  },

  async logoutAll(): Promise<void> {
    try {
      await apiClient.post<void>(`${getAuthBasePath()}/logout-all`);
    } finally {
      this.clearAuth();
    }
  },

  async getCurrentUser(): Promise<User> {
    const payload = await apiClient.get<any>(`${getAuthBasePath()}/me`);

    // extractUser handles { user }, { data: { user } }, { data } wrappers; falls back to raw payload
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

  /** Updates the currently authenticated user (self profile). */
  async updateCurrentUser(data: Partial<Pick<User, 'name' | 'email' | 'phone'>>): Promise<User> {
    let payload: any;
    try {
      payload = await apiClient.patch<any>('/v1/auth/me', data);
    } catch (err: any) {
      // Some backends expose only PUT for profile update.
      // Don't rely on server error message formatting; just fallback to PUT.
      if (err?.status === 405) {
        try {
          payload = await apiClient.put<any>('/v1/auth/me', data);
        } catch (putErr: any) {
          if (putErr?.status === 405) {
            throw {
              message: 'settings.errors.profileUpdateNotSupported',
              errors: {},
              status: 405,
            };
          }
          throw putErr;
        }
      } else {
        throw err;
      }
    }

    let raw = extractUser(payload) ?? payload;

    if (raw && typeof raw === 'object' && !raw.id && (raw as any).user_id) {
      raw = { ...(raw as any), id: (raw as any).user_id };
    }

    if (!raw || typeof raw !== 'object' || !(raw as any).id) {
      throw {
        message: 'errors.requestFailed',
        errors: {
          user: ['Invalid server response'],
        },
      };
    }

    return raw as User;
  },

  async changePassword(data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Promise<void> {
    await apiClient.post<void>(`${getAuthBasePath()}/change-password`, data);
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
