import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';
import { disconnectRealtimeSocket, reconnectRealtimeSocket } from '../lib/realtimeSocket';
import type { Student } from '../types';

type VerifyStep = 'phone' | 'code' | 'password' | 'login';

interface AuthState {
  user: Student | null;
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
  loginWithPassword: (phone: string, password: string, kind?: 'student' | 'staff') => Promise<void>;
  logout: () => void;
  updateActivity: () => void;
  checkInactivity: () => void;
  setStep: (step: VerifyStep) => void;
  setVerifyPhone: (phone: string) => void;
  /** Serverdan /auth/me bilan yangilash (JWT cookie orqali) */
  syncSession: () => Promise<void>;
}

const INACTIVITY_TIMEOUT = 5 * 60 * 1000;

function mapApiUserToStudent(u: unknown, phoneFallback = ''): Student {
  if (!u || typeof u !== 'object') {
    return {
      id: '',
      first_name: '',
      last_name: '',
      phone: phoneFallback,
      email: '',
      parent_name: '',
      image_url: '',
      role: '',
    };
  }
  const o = u as Record<string, unknown>;
  const role = o.role != null && String(o.role).trim() !== '' ? String(o.role).toUpperCase() : '';
  return {
    id: String(o.id ?? ''),
    first_name: String(o.first_name ?? ''),
    last_name: String(o.last_name ?? ''),
    phone: String(o.phone ?? phoneFallback),
    email: o.email != null ? String(o.email) : '',
    parent_name: o.parent_name != null ? String(o.parent_name) : '',
    image_url: o.image_url != null ? String(o.image_url) : '',
    role,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
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
          const d = data?.data || data;
          set({ verifyPhone: phone, isVerified: !!d.is_verified, hasTelegram: !!d.has_telegram, isLoading: false });
          return { is_verified: !!d.is_verified, has_telegram: !!d.has_telegram };
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      sendCode: async (phone) => {
        set({ isLoading: true });
        try {
          await api.post('/auth/send-verify-code', { phone });
          set({ isLoading: false });
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      verifyCode: async (phone, code, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/verify-code', { phone, code, password });
          const res = data as { user?: unknown };
          let user = mapApiUserToStudent(res?.user, phone);
          if (!user.id) {
            await get().syncSession();
            user = get().user || user;
          }
          if (!user.id) throw new Error('Foydalanuvchi ma’lumotlari qaytmadi');
          reconnectRealtimeSocket();
          set({
            user,
            isAuthenticated: true,
            lastActivity: Date.now(),
            isLoading: false,
            isVerified: true,
          });
        } catch (e: unknown) {
          console.error('[Auth] verifyCode xato');
          set({ isLoading: false });
          throw e;
        }
      },

      loginWithPassword: async (phone, password, kind = 'student') => {
        set({ isLoading: true });
        try {
          const path = kind === 'staff' ? '/auth/staff-phone-login' : '/auth/student-login-password';
          const { data } = await api.post(path, { phone, password });
          const res = data as { user?: unknown };
          let user = mapApiUserToStudent(res?.user, phone);
          if (!user.id) {
            await get().syncSession();
            user = get().user || user;
          }
          if (!user.id) throw new Error('Foydalanuvchi ma’lumotlari qaytmadi');
          reconnectRealtimeSocket();
          set({ user, isAuthenticated: true, lastActivity: Date.now(), isLoading: false });
        } catch (e: unknown) {
          console.error('[Auth] loginWithPassword xato');
          set({ isLoading: false });
          throw e;
        }
      },

      logout: () => {
        void (async () => {
          disconnectRealtimeSocket();
          try {
            await api.post('/auth/logout');
          } catch {
            /* cookie tozalashga harakat qilindi */
          }
          try {
            localStorage.removeItem('exam-lock');
            localStorage.removeItem('auth-storage');
          } catch {
            /* */
          }
          set({ user: null, isAuthenticated: false, verifyStep: 'phone', verifyPhone: '' });
        })();
      },

      updateActivity: () => set({ lastActivity: Date.now() }),

      checkInactivity: () => {
        const { lastActivity, isAuthenticated, logout } = get();
        if (isAuthenticated && Date.now() - lastActivity > INACTIVITY_TIMEOUT) logout();
      },

      setStep: (step) => set({ verifyStep: step }),
      setVerifyPhone: (phone) => set({ verifyPhone: phone }),

      syncSession: async () => {
        try {
          const { data: raw } = await api.get('/auth/me');
          const me = (raw as { data?: unknown })?.data ?? raw;
          if (!me || typeof me !== 'object') return;
          const m = me as Record<string, unknown>;
          const role = String(m.role ?? '')
            .trim()
            .toUpperCase();
          set({
            user: {
              id: String(m.id ?? ''),
              first_name: String(m.first_name ?? ''),
              last_name: String(m.last_name ?? ''),
              phone: String(m.phone ?? ''),
              email: m.email != null ? String(m.email) : '',
              parent_name: m.parent_name != null ? String(m.parent_name) : '',
              image_url: m.image_url != null ? String(m.image_url) : '',
              role,
            },
            isAuthenticated: true,
          });
        } catch {
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({
        user: s.user,
        isAuthenticated: s.isAuthenticated,
        lastActivity: s.lastActivity,
      }),
    },
  ),
);
