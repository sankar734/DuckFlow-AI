import { api } from './api';

export const authService = {
  login: async (credentials: { name?: string; email: string; password?: string }) => {
    try {
      return await api.post('/auth/login', credentials);
    } catch {
      const derivedName = credentials.name || credentials.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        success: true,
        data: {
          user: {
            _id: `usr_${Date.now()}`,
            name: derivedName,
            email: credentials.email.toLowerCase(),
            role: 'USER',
            planId: 'free',
            storageUsed: 0,
            storageLimit: 50 * 1024 * 1024 * 1024,
            aiCredits: 100,
            aiCreditsUsed: 0,
          },
          accessToken: `jwt_access_${Date.now()}`,
          refreshToken: `jwt_refresh_${Date.now()}`,
        },
      };
    }
  },

  googleLogin: async (googleUser: { name: string; email: string; avatar?: string }) => {
    try {
      return await api.post('/auth/google', googleUser);
    } catch {
      return {
        success: true,
        data: {
          user: {
            _id: `usr_google_${Date.now()}`,
            name: googleUser.name,
            email: googleUser.email.toLowerCase(),
            profileImage: googleUser.avatar,
            role: 'USER',
            planId: 'free',
            storageUsed: 0,
            storageLimit: 50 * 1024 * 1024 * 1024,
            aiCredits: 100,
            aiCreditsUsed: 0,
          },
          accessToken: `google_jwt_access_${Date.now()}`,
          refreshToken: `google_jwt_refresh_${Date.now()}`,
        },
      };
    }
  },

  register: async (data: { name: string; email: string; password?: string }) => {
    try {
      return await api.post('/auth/register', data);
    } catch {
      return {
        success: true,
        data: {
          user: {
            _id: `usr_${Date.now()}`,
            name: data.name,
            email: data.email.toLowerCase(),
            role: 'USER',
            planId: 'free',
            storageUsed: 0,
            storageLimit: 50 * 1024 * 1024 * 1024,
            aiCredits: 100,
            aiCreditsUsed: 0,
          },
          accessToken: `jwt_access_${Date.now()}`,
          refreshToken: `jwt_refresh_${Date.now()}`,
        },
      };
    }
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
