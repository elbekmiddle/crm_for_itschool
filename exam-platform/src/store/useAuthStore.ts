import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import api from '../lib/api';
import { disconnectRealtimeSocket, reconnectRealtimeSocket } from '../lib/realtimeSocket';
import type { Student } from '../types';

type VerifyStep = 'phone' | 'code' | 'password' | 'login';

interface AuthState {
  user: Student | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastActivity: number;
  verifyStep: VerifyStep;
  verifyPhone: string;
  isVerified: boolean;
  hasTelegram: boolean;

  checkPhone: (phone: string) => Promise<{ is_verified: boolean; has_telegram: boolean }>;
  sendCode: (phone: string) => Promise<void>;
  verifyCode: (phone: string, code: string, password: string) => Promise<void>;
  loginWithPassword: (phone: string, password: string) => Promise<void>;
  login: (phone: string, firstName: string) => Promise<void>;
  logout: () => void;
  updateActivity: () => void;
  checkInactivity: () => void;
  setStep: (step: VerifyStep) => void;
  setVerifyPhone: (phone: string) => void;
}

const INACTIVITY_TIMEOUT = 5 * 60 * 1000;

/** Safely extract JWT from any response shape the backend might return */
function unwrapToken(data: any): string {
  // Direct: { access_token: '...' }
  if (data?.access_token) return data.access_token;
  if (data?.token) return data.token;
  // Wrapped by NestJS interceptor: { success: true, data: { access_token: '...' } }
  if (data?.data?.access_token) return data.data.access_token;
  if (data?.data?.token) return data.data.token;
  console.warn('[Auth] Could not find token in response:', JSON.stringify(data).slice(0, 200));
  return '';
}

/** Decode JWT and build Student object — never throws */
function parseJwt(token: string, phoneFallback = ''): Student {
  try {
    const d = jwtDecode<any>(token);
    console.log('[Auth] JWT payload:', d);
    return {
      id: d.sub || '',
      first_name: d.first_name || '',
      last_name: d.last_name || '',
      phone: d.phone || phoneFallback,
      email: d.email || '',
      parent_name: d.parent_name || '',
      image_url: d.image_url || '',
      role: d.role || 'STUDENT',
    };
  } catch (e) {
    console.error('[Auth] JWT decode failed:', e);
    return { id: '', first_name: '', last_name: '', phone: phoneFallback, email: '', parent_name: '', image_url: '', role: 'STUDENT' };
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      lastActivity: Date.now(),
      verifyStep: 'phone',
      verifyPhone: '',
      isVerified: false,
      hasTelegram: false,

      checkPhone: async (phone) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/check-phone', { phone });
          console.log('[Auth] checkPhone:', data);
          const d = data?.data || data;
          set({ verifyPhone: phone, isVerified: !!d.is_verified, hasTelegram: !!d.has_telegram, isLoading: false });
          return { is_verified: !!d.is_verified, has_telegram: !!d.has_telegram };
        } catch (e) {
          set({ isLoading: false }); throw e;
        }
      },

      sendCode: async (phone) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/send-verify-code', { phone });
          console.log('[Auth] sendCode:', data);
          set({ isLoading: false });
        } catch (e) {
          set({ isLoading: false }); throw e;
        }
      },

      verifyCode: async (phone, code, password) => {
        set({ isLoading: true });
        console.log('[Auth] verifyCode — phone:', phone, 'code:', code);
        try {
          const { data } = await api.post('/auth/verify-code', { phone, code, password });
          console.log('[Auth] verifyCode response:', data);
          const token = unwrapToken(data);
          if (!token) throw new Error('Server JWT tokenni qaytarmadi');
          const user = parseJwt(token, phone);
          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, lastActivity: Date.now(), isLoading: false, isVerified: true });
        } catch (e: any) {
          console.error('[Auth] verifyCode error:', e.response?.data || e.message);
          set({ isLoading: false }); throw e;
        }
      },

      loginWithPassword: async (phone, password) => {
        set({ isLoading: true });
        console.log('[Auth] loginWithPassword — phone:', phone);
        try {
          const { data } = await api.post('/auth/student-login-password', { phone, password });
          console.log('[Auth] loginWithPassword response:', data);
          const token = unwrapToken(data);
          if (!token) throw new Error('Server JWT tokenni qaytarmadi');
          const user = parseJwt(token, phone);
          localStorage.setItem('token', token);
          reconnectRealtimeSocket();
          set({ user, token, isAuthenticated: true, lastActivity: Date.now(), isLoading: false });
        } catch (e: any) {
          console.error('[Auth] loginWithPassword error:', e.response?.data || e.message);
          set({ isLoading: false }); throw e;
        }
      },

      login: async (phone, firstName) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/student-login', { phone, first_name: firstName });
          const token = unwrapToken(data);
          const user = parseJwt(token, phone);
          if (firstName) user.first_name = firstName;
          localStorage.setItem('token', token);
          reconnectRealtimeSocket();
          set({ user, token, isAuthenticated: true, lastActivity: Date.now(), isLoading: false });
        } catch (e) {
          set({ isLoading: false }); throw e;
        }
      },

      logout: () => {
        disconnectRealtimeSocket();
        localStorage.removeItem('token');
        localStorage.removeItem('exam-lock');
        set({ user: null, token: null, isAuthenticated: false, verifyStep: 'phone', verifyPhone: '' });
      },

      updateActivity: () => set({ lastActivity: Date.now() }),

      checkInactivity: () => {
        const { lastActivity, isAuthenticated, logout } = get();
        if (isAuthenticated && Date.now() - lastActivity > INACTIVITY_TIMEOUT) logout();
      },

      setStep: (step) => set({ verifyStep: step }),
      setVerifyPhone: (phone) => set({ verifyPhone: phone }),
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated, lastActivity: s.lastActivity }),
    },
  ),
);
