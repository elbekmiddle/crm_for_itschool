import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, first_name: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (phone, first_name) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/student-login', { phone, first_name });
          const { access_token } = response.data;
          
          // Decode token to get user info
          const decoded = (await import('jwt-decode')).jwtDecode<any>(access_token);
          
          // Assuming payload has sub as id, and role
          set({
            user: {
              id: decoded.sub,
              first_name: first_name,
              last_name: '', // We don't have last_name from decoding right now unless backend adds it
              phone: phone,
              role: decoded.role || 'STUDENT',
            },
            token: access_token,
            isAuthenticated: true,
          });
          
          localStorage.setItem('token', access_token);
        } catch (error) {
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage', // unique name
    }
  )
);
