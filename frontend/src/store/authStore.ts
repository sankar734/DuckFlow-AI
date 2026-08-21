import { create } from 'zustand';
import { User } from '../types/user';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const getInitialUser = (): User | null => {
  try {
    const stored = localStorage.getItem('docuflow_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const initialToken = localStorage.getItem('docuflow_access_token');
const initialUser = getInitialUser();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  accessToken: initialToken,
  refreshToken: localStorage.getItem('docuflow_refresh_token'),
  isAuthenticated: Boolean(initialToken && initialUser),

  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('docuflow_user', JSON.stringify(user));
    localStorage.setItem('docuflow_access_token', accessToken);
    localStorage.setItem('docuflow_refresh_token', refreshToken);
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('docuflow_user');
    localStorage.removeItem('docuflow_access_token');
    localStorage.removeItem('docuflow_refresh_token');
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  updateUser: (updatedFields) => {
    set((state) => {
      if (!state.user) return state;
      const newUser = { ...state.user, ...updatedFields };
      localStorage.setItem('docuflow_user', JSON.stringify(newUser));
      return { user: newUser };
    });
  },
}));
