export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  bio?: string;
  role: UserRole;
  emailVerified: boolean;
  planId: string;
  storageUsed: number;
  storageLimit: number;
  aiCredits: number;
  aiCreditsUsed: number;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    documentNotifications: boolean;
    aiNotifications: boolean;
  };
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
