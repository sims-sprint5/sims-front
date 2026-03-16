import axios from 'axios';
import type { User } from '@/modules/auth/types/auth.types';

/**
 * Client HTTP per al superadmin.
 *
 * IMPORTANT: Usem el proxy de Vite (/api → http://localhost:8000) per evitar CORS.
 * NO fem servir el apiClient normal perquè aquell afegeix la capçalera X-Tenant
 * basada en el subdomini, cosa que el superadmin no necessita.
 */
const superadminAxios = axios.create({
    baseURL: '/api',   // Proxy de Vite: /api → http://localhost:8000/api
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

superadminAxios.interceptors.request.use((config) => {
    const token = localStorage.getItem('superadmin_token');
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const SUPERADMIN_TOKEN_KEY = 'superadmin_token';
const SUPERADMIN_USER_KEY = 'superadmin_user';

export const superadminAuthService = {
    async login(credentials: { email: string; password: string }): Promise<{ token: string; user: User }> {
        const { data } = await superadminAxios.post('/v1/superadmin/auth/login', credentials);

        // The backend returns either "user", "superadmin", or wrapped in "data"
        const token: string =
            data?.token ?? data?.access_token ?? data?.data?.token ?? data?.data?.access_token;
        const user: User =
            data?.user ?? data?.superadmin ?? data?.data?.user ?? data?.data?.superadmin ?? data?.data;

        if (!token || !user) {
            throw { message: 'errors.requestFailed', errors: {} };
        }

        const superadminUser = { ...user, role: 'superadmin' };

        localStorage.setItem(SUPERADMIN_TOKEN_KEY, token);
        localStorage.setItem(SUPERADMIN_USER_KEY, JSON.stringify(superadminUser));

        // Reutilitzem els mateixos camps que authService perquè el guard i useUser funcionin
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(superadminUser));
        // Sense tenant (el guard el saltarà per requiresRole: 'superadmin')
        localStorage.removeItem('auth_tenant');

        return { token, user: superadminUser as User };
    },

    async logout(): Promise<void> {
        try {
            await superadminAxios.post('/v1/superadmin/auth/logout');
        } finally {
            this.clearAuth();
        }
    },

    clearAuth(): void {
        localStorage.removeItem(SUPERADMIN_TOKEN_KEY);
        localStorage.removeItem(SUPERADMIN_USER_KEY);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_tenant');
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem(SUPERADMIN_TOKEN_KEY);
    },
};
