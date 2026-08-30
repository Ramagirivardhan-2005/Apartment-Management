import axios from 'axios';
import { getErrorMessage } from '../utils/errorHandler';

// Determine the API base URL:
// 1. If VITE_API_URL is set in environment, ensure it cleanly targets /api.
// 2. In production (Vercel deployment) or when accessed via non-localhost, use the live Render backend.
// 3. In local development (localhost), use '/api' to use Vite dev proxy.
const getBaseURL = () => {
  let url = import.meta.env.VITE_API_URL;

  if (!url || typeof url !== 'string' || url.trim() === '') {
    if (import.meta.env.PROD || (typeof window !== 'undefined' && window.location.hostname !== 'localhost')) {
      url = 'https://apartment-management-8ya0.onrender.com/api';
    } else {
      url = '/api';
    }
  }

  url = url.trim().replace(/\/+$/, '');

  // If the absolute backend URL was provided without the /api suffix, automatically append it
  if (url.startsWith('http') && !url.endsWith('/api') && !url.includes('/api/')) {
    url = `${url}/api`;
  }

  return url;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 90000,
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
