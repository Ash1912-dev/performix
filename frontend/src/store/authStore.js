import { create } from 'zustand';

const TOKEN_KEY = 'performix_token';
const USER_KEY = 'performix_user';

const clearAuthStorage = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const useAuthStore = create((set) => ({
  user: null,
  token: '',
  isAuthenticated: false,
  isHydrated: false,
  setAuth: ({ user, token }) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    set({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isHydrated: true,
    });
  },
  logout: () => {
    clearAuthStorage();

    set({
      user: null,
      token: '',
      isAuthenticated: false,
      isHydrated: true,
    });

    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  },
  initAuth: () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      const user = storedUser ? JSON.parse(storedUser) : null;

      set({
        user,
        token: token || '',
        isAuthenticated: Boolean(token && user),
        isHydrated: true,
      });
    } catch {
      clearAuthStorage();
      set({
        user: null,
        token: '',
        isAuthenticated: false,
        isHydrated: true,
      });
    }
  },
}));
