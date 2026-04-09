import axios from 'axios';

function normalizeApiBase(): string {
  const raw = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '');
  if (raw.includes('/api/v1')) return raw;
  return `${raw}/api/v1`;
}

const api = axios.create({
  baseURL: normalizeApiBase(),
  withCredentials: true, // Cookie'larni yuborish va qabul qilish
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're currently refreshing to avoid multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Response interceptor - auto-refresh on 401
api.interceptors.response.use(
  (response) => {
    // Data unwrapping
    if (response.data && response.data.success === true && response.data.data !== undefined) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const reqUrl = String(originalRequest?.url || '');
    const skipRefresh401 =
      reqUrl.includes('/auth/login') ||
      reqUrl.includes('/auth/student-login') ||
      reqUrl.includes('/auth/student-login-password') ||
      reqUrl.includes('/auth/check-phone') ||
      reqUrl.includes('/auth/send-verify-code') ||
      reqUrl.includes('/auth/check-code') ||
      reqUrl.includes('/auth/verify-code') ||
      reqUrl.includes('/auth/refresh');

    // 401 - token muddati tugagan (login/check-phone kabi endpointlarda refresh qilmaslik)
    if (error.response?.status === 401 && !skipRefresh401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Agar refresh jarayonda bo'lsa, navbatga qo'shamiz
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh tokenni yangilash
        await api.post('/auth/refresh');
        processQueue(null);
        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        isRefreshing = false;
        // Refresh muvaffaqiyatsiz - login sahifasiga yo'naltirish
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    const status = error.response?.status;
    const raw = error.response?.data;
    const prevMsg =
      (typeof raw === 'object' && raw && 'message' in raw && (raw as any).message) ||
      (typeof raw === 'string' ? raw : null);
    let message = prevMsg;
    if (!message && status) {
      const map: Record<number, string> = {
        400: "So'rov noto'g'ri",
        401: 'Kirish rad etildi — qayta tizimga kiring',
        403: 'Ruxsat yo‘q',
        404: 'Ma’lumot topilmadi',
        409: 'Ma’lumot allaqachon mavjud',
        413: 'Fayl juda katta',
        429: 'Juda ko‘p so‘rov — birozdan keyin urinib ko‘ring',
        500: 'Server xatosi — keyinroq urinib ko‘ring',
        503: 'Xizmat vaqtincha ishlamayapti',
      };
      message = map[status] || `Xatolik (${status})`;
    }
    if (message && error.response) {
      error.response.data = {
        ...(typeof raw === 'object' && raw ? raw : {}),
        message,
      };
    }

    return Promise.reject(error);
  },
);

export default api;
