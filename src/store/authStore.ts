import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: number;
  phone: string;
  name?: string;
  email?: string;
  city?: string;
  role?: string;
  active?: boolean;
  approved?: boolean;
  deleted?: boolean;
  profileImgUrl?: string;
  profileCompleted: boolean;
  dateOfBirth?: string;
  preferredCategories?: string[];
  department?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (user: User, token: string) => void;
  updateUser: (user: User) => void;
  clearAuth: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: false,
      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true });
      },
      updateUser: (user) => {
        set({ user });
      },
      clearAuth: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
      initializeAuth: async () => {
        const { token, user } = get();
        if (token && user) {
          try {
            const { authAPI, userAPI } = await import('../utils/api');
            await authAPI.validateToken(token);
            const response = await userAPI.getProfile(token);
            set({ user: response.data.user, isAuthenticated: true, isInitialized: true });
          } catch {
            set({ user: null, token: null, isAuthenticated: false, isInitialized: true });
          }
        } else {
          set({ isInitialized: true });
        }
      },
    }),
    {
      name: 'maruthi-auth-storage',
    }
  )
);
