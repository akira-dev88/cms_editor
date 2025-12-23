// lib/api/auth.ts
import { apiClient } from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password_hash: string;
}

export interface AuthResponse {
  access_token: string;
  user?: {
    id: string;
    email: string;
    username: string;
    roles: string[];
  };
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterData): Promise<any> => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  getProfile: async (): Promise<any> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  logout: (): void => {
    // Clear client-side storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
};