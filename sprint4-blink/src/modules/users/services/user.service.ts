import { apiClient } from '@/shared/services/api.service';
import { buildQuery } from '@/shared/utils/queryBuilder';
import type {
  CreateUserData,
  UpdateUserData,
  User,
  UsersResponse,
} from '../types/user.types';

/** Normalizes a user from the backend to the frontend type. */
function normalizeUser(raw: any): User {
  return {
    id: raw.id ?? raw.user_id ?? 0,
    user_id: raw.user_id ?? raw.id,
    name: raw.name ?? '',
    email: raw.email ?? '',
    phone: raw.phone ?? raw.telefono ?? '',
    role: raw.role ?? raw.rol ?? 'user',
    email_verified_at: raw.email_verified_at ?? null,
    created_at: raw.created_at ?? '',
    updated_at: raw.updated_at ?? '',
  };
}

/** Normalizes a paginated or array user response from the backend. */
function normalizeUsersResponse(raw: any): UsersResponse {
  if (Array.isArray(raw)) {
    return { data: raw.map(normalizeUser) };
  }
  if (Array.isArray(raw?.data)) {
    return { data: raw.data.map(normalizeUser), meta: raw.meta };
  }
  return { data: [] };
}

export const userService = {
  async getUsers(page: number = 1, perPage: number = 10): Promise<UsersResponse> {
    const query = buildQuery({ page, per_page: perPage });
    const raw = await apiClient.get<any>(`/v1/users${query}`);
    return normalizeUsersResponse(raw);
  },

  async getUserById(id: number): Promise<User> {
    const raw = await apiClient.get<any>(`/v1/users/${id}`);
    return normalizeUser(raw?.data ?? raw);
  },

  async createUser(data: CreateUserData): Promise<User> {
    const raw = await apiClient.post<any>('/v1/users', {
      name: data.name,
      email: data.email,
      password: data.password,
      password_confirmation: data.password_confirmation,
      phone: data.phone,
      role: data.role,
    });
    return normalizeUser(raw?.data ?? raw);
  },

  async updateUser(id: number, data: UpdateUserData): Promise<User> {
    const payload: any = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.email !== undefined) payload.email = data.email;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.role !== undefined) payload.role = data.role;
    if (data.password !== undefined) payload.password = data.password;
    if (data.password_confirmation !== undefined) payload.password_confirmation = data.password_confirmation;
    const raw = await apiClient.patch<any>(`/v1/users/${id}`, payload);
    return normalizeUser(raw?.data ?? raw);
  },

  async deleteUser(id: number): Promise<void> {
    await apiClient.delete<void>(`/v1/users/${id}`);
  },

  // Client-side search: loads all users and filters locally
  async searchUsers(query: string): Promise<User[]> {
    const response = await this.getUsers(1, 200);
    const users = Array.isArray(response.data) ? response.data : [];

    const q = query.trim().toLowerCase();
    if (!q) return users;

    return users.filter(
      (u) =>
        (u.name ?? '').toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q),
    );
  },
} as const;

export type UserService = typeof userService;
