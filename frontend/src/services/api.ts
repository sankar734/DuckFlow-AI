import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../config/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds to tolerate free-tier cloud host wake-up / cold starts
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

// Response interceptor: provide descriptive network & status error handling
api.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<any>) => {
    // 1. Backend returned structured JSON error
    if (error.response?.data?.error) {
      return Promise.reject(error.response.data.error);
    }

    if (error.response?.data?.message) {
      return Promise.reject({
        code: 'API_ERROR',
        message: error.response.data.message,
        status: error.response.status,
      });
    }

    // 2. Specific HTTP status handling
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
          message: 'The requested resource or endpoint was not found.',
          status,
        });
      }
      if (status === 429) {
        return Promise.reject({
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please wait a moment before trying again.',
          status,
        });
      }
      if (status >= 500) {
        return Promise.reject({
          code: 'SERVER_ERROR',
          message: 'The server is temporarily unavailable or starting up. Please retry in a few seconds.',
          status,
        });
      }
    }

    // 3. Network connection / Timeout / CORS blockage
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject({
        code: 'REQUEST_TIMEOUT',
        message: 'Server took too long to respond. The cloud service might be waking up, please retry.',
      });
    }

    if (!error.response) {
      return Promise.reject({
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to DocuFlow server. Please check your internet connection or verify backend is online.',
      });
    }

    return Promise.reject({
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred. Please try again.',
    });
  }
);
