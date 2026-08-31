import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/api';

// Create central Axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // 45 seconds to handle free-tier cloud host cold starts (Render/Railway)
  withCredentials: false,
});

// Request interceptor: attach auth tokens & unique tracing ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('docuflow_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add unique request ID for distributed tracing and debugging
    if (config.headers && !config.headers['X-Request-Id']) {
      config.headers['X-Request-Id'] = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Helper to check if error is retryable (Cold starts / Network blips)
const isRetryableError = (error: AxiosError): boolean => {
  if (!error.response) return true; // Network error or CORS or server unreachable
  const status = error.response.status;
  return status === 502 || status === 503 || status === 504 || error.code === 'ECONNABORTED';
};

// Response interceptor with smart 1-time auto-retry on network blips/cold starts
api.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError<any>) => {
    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };

    // Retry once if server is cold-booting (Render takes ~30-40s to wake up)
    if (config && isRetryableError(error) && (!config._retryCount || config._retryCount < 2)) {
      config._retryCount = (config._retryCount || 0) + 1;
      await new Promise((resolve) => setTimeout(resolve, 1500 * config._retryCount!));
      return api(config);
    }

    // 1. Backend returned structured JSON error or message
    if (error.response?.data?.message && typeof error.response.data.message === 'string') {
      return Promise.reject({
        code: error.response.data.code || `HTTP_${error.response.status}`,
        message: error.response.data.message,
        status: error.response.status,
      });
    }

    if (error.response?.data?.error) {
      const errPayload = error.response.data.error;
      const msg = typeof errPayload === 'string' ? errPayload : errPayload.message || 'API request failed';
      return Promise.reject({
        code: errPayload.code || `HTTP_${error.response.status}`,
        message: msg,
        status: error.response.status,
      });
    }

    // 2. Specific HTTP status handling (when no custom message was returned)
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        return Promise.reject({
          code: 'UNAUTHORIZED',
          message: 'Your session has expired or is invalid. Please sign in again.',
          status,
        });
      }
      if (status === 403) {
        return Promise.reject({
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action.',
          status,
        });
      }
      if (status === 404) {
        return Promise.reject({
          code: 'NOT_FOUND',
          message: 'The requested service endpoint was not found.',
          status,
        });
      }
      if (status === 429) {
        return Promise.reject({
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please wait a few seconds before trying again.',
          status,
        });
      }
      if (status >= 500) {
        return Promise.reject({
          code: 'SERVER_ERROR',
          message: 'The server is temporarily starting up or busy. Please retry in a moment.',
          status,
        });
      }
    }

    // 3. Network connection / Timeout / Cloud Cold-start
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject({
        code: 'REQUEST_TIMEOUT',
        message: 'Server connection timed out while waking up. Please tap again to retry.',
      });
    }

    if (!error.response) {
      return Promise.reject({
        code: 'NETWORK_ERROR',
        message: 'Connecting to DocuFlow cloud server... If the server was sleeping, please wait a moment and try again.',
      });
    }

    return Promise.reject({
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred. Please try again.',
    });
  }
);
