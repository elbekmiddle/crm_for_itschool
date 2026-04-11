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

// Automatic token injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
      if (window.location.pathname !== '/login' && !authRedirectInProgress) {
        authRedirectInProgress = true;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        /** Zustand persist — aks holda qayta yuklanganda isAuthenticated=true bo‘lib login↔dashboard tsikli */
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
