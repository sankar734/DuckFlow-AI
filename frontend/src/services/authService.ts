import { api } from './api';

export const authService = {
  login: async (credentials: { name?: string; email: string; password?: string }) => {
    return await api.post('/auth/login', credentials);
  },

  googleLogin: async (googleUser: { name: string; email: string; avatar?: string }) => {
    return await api.post('/auth/google', googleUser);
  },

  register: async (data: { name: string; email: string; password?: string; phone?: string }) => {
    return await api.post('/auth/register', data);
  },

  sendRegisterOTP: async (data: { name?: string; email: string; password?: string }) => {
    return await api.post('/auth/send-register-otp', data);
  },

  verifyRegisterOTP: async (data: { name: string; email: string; password?: string; otp: string; phone?: string }) => {
    return await api.post('/auth/verify-register-otp', data);
  },

  checkEmail: async (email: string, mode: 'register' | 'login' = 'register') => {
    return await api.post('/auth/check-email', { email, mode });
  },

  getMe: async () => {
    return await api.get('/auth/me');
  },

  refreshToken: async (token: string) => {
    return await api.post('/auth/refresh-token', { refreshToken: token });
  },

  sendOTP: async (email: string) => {
    return await api.post('/auth/send-otp', { email });
  },

  verifyOTP: async (email: string, otp: string) => {
    return await api.post('/auth/verify-otp', { email, otp });
  },
};
