import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole, LoginResponse } from '../../shared/types';

interface AuthState {
  token: string | null;
  user: LoginResponse['user'] | null;
  login: (data: LoginResponse) => void;
  logout: () => void;
  isAuthenticated: (role?: UserRole) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      login: (data: LoginResponse) => set({ token: data.token, user: data.user }),
      logout: () => set({ token: null, user: null }),
      isAuthenticated: (role?: UserRole) => {
        const { token, user } = get();
        if (!token || !user) return false;
        if (role && user.role !== role) return false;
        return true;
      },
    }),
    { name: 'trace-auth-storage' }
  )
);
