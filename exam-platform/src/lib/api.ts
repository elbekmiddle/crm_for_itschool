import axios from 'axios';

/** 401 da bir necha parallel so‘rov bir vaqtda redirect qilmasin */
let authRedirectInProgress = false;

const api = axios.create({
  baseURL: 'http://localhost:5001/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// JWT faqat HTTPOnly cookie orqali (withCredentials); Authorization header qo‘shilmaydi

// Response interceptor to handle auth errors and data unwrapping
api.interceptors.response.use(
  (response) => {
    // If the backend uses the TransformInterceptor pattern { success: true, data: ... }
    if (response.data && response.data.success === true && response.data.data !== undefined) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const url = `${error.config?.baseURL || ''}${error.config?.url || ''}`;
      const isSessionProbe = url.includes('/auth/me');
      if (!isSessionProbe && window.location.pathname !== '/login' && !authRedirectInProgress) {
        authRedirectInProgress = true;
        localStorage.removeItem('user');
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
