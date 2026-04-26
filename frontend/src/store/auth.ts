import { create } from 'zustand';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  condominiumId: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  
  login: (accessToken, refreshToken, user) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false, isLoading: false });
    window.location.href = '/login';
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const token = localStorage.getItem('access_token');
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const response = await api.get('/auth/me');
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
