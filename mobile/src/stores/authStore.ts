// Authentication state management using Zustand
// Manages user auth state, login, logout, and auth listeners

import { create } from 'zustand';
import { User } from '../../../shared/types';
import { setupAuthListener } from '../services/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  initAuthListener: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  setUser: (user) => set({ user, isLoading: false, error: null }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  logout: () => set({ user: null, isLoading: false, error: null }),

  initAuthListener: () => {
    return setupAuthListener((user) => {
      set({ user, isLoading: false, error: null });
    });
  },
}));
