import { create } from 'zustand';
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '@/shared/types';
import { api, setTokens, clearTokens } from '@/utils/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  error: null,

  login: async (data: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<AuthResponse>('/auth/login', data);
      setTokens(res.tokens.accessToken, res.tokens.refreshToken);
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '登录失败';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<AuthResponse>('/auth/register', data);
      setTokens(res.tokens.accessToken, res.tokens.refreshToken);
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '注册失败';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),

  checkAuth: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    try {
      const user = await api.get<User>('/auth/me');
      set({ user, isAuthenticated: true });
    } catch {
      clearTokens();
      set({ isAuthenticated: false, user: null });
    }
  },
}));
