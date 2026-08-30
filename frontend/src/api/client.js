import axios from 'axios';
import { getErrorMessage } from '../utils/errorHandler';

// Determine the API base URL:
// 1. If VITE_API_URL is configured in env, use it.
// 2. In production (Vercel deployment) or when accessed via non-localhost, use the live Render backend.
// 3. In local development (localhost), use '/api' to use Vite dev proxy.
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.PROD || (typeof window !== 'undefined' && window.location.hostname !== 'localhost')) {
    return 'https://apartment-management-8ya0.onrender.com/api';
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

// Request interceptor to dynamically attach JWT on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('apartment_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to normalize errors and handle session expiry gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Session Expiry Handling
    if (error.response && error.response.status === 401) {
      if (error.config?.url?.includes('/auth/me')) {
        localStorage.removeItem('apartment_token');
        localStorage.removeItem('apartment_user');
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/setup')) {
          window.location.href = '/login';
        }
      }
    }

    // 2. Attach clean, production-safe user error message
    const userMessage = getErrorMessage(error);
    error.userMessage = userMessage;

    // Sanitize response message in-place to prevent raw technical leakages in components
    if (error.response && error.response.data) {
      error.response.data.message = userMessage;
    }

    return Promise.reject(error);
  }
);

export default api;
