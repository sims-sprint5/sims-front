export interface User {
  id: number;
  user_id?: number; // Backend alias
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone: string;
  role: 'user' | 'admin';
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  role?: 'user' | 'admin';
  password?: string;
  password_confirmation?: string;
}

export interface UsersResponse {
  data: User[];
  meta?: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface UserResponse {
  data: User;
}
