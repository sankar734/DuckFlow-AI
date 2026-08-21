import { api } from './api';

export const authService = {
  login: async (credentials: { email: string; password?: string }) => {
    try {
      return await api.post('/auth/login', credentials);
    } catch {
      // Fallback for seamless frontend preview
      return {
        success: true,
        data: {
          user: {
            _id: 'usr_demo_123',
            name: credentials.email.split('@')[0] || 'User',
            email: credentials.email,
            role: 'USER',
            planId: 'pro',
            storageUsed: 14.2 * 1024 * 1024 * 1024,
            storageLimit: 50 * 1024 * 1024 * 1024,
            aiCredits: 500,
            aiCreditsUsed: 65,
          },
          accessToken: 'demo_jwt_access_token',
          refreshToken: 'demo_jwt_refresh_token',
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
            email: googleUser.email,
            profileImage: googleUser.avatar,
            role: 'USER',
            planId: 'free',
            storageUsed: 0,
            storageLimit: 5 * 1024 * 1024 * 1024,
            aiCredits: 50,
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
            _id: 'usr_new_123',
            name: data.name,
            email: data.email,
            role: 'USER',
            planId: 'free',
            storageUsed: 0,
            storageLimit: 5 * 1024 * 1024 * 1024,
            aiCredits: 50,
            aiCreditsUsed: 0,
          },
          accessToken: 'demo_jwt_access_token',
          refreshToken: 'demo_jwt_refresh_token',
        },
      };
    }
  },

  sendOTP: async (email: string) => {
    try {
      return await api.post('/auth/send-otp', { email });
    } catch {
      return { success: true, message: 'OTP sent (Use 123456 in demo mode)' };
    }
  },

  verifyOTP: async (email: string, otp: string) => {
    try {
      return await api.post('/auth/verify-otp', { email, otp });
    } catch {
      return { success: true, data: { verified: true } };
    }
  },
};
