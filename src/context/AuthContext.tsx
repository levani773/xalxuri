import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserStats } from '../types';
import { api, tokenStorage } from '../services/api';

interface AuthContextType {
  user: User | null;
  stats: UserStats | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: {
    username: string;
    email: string;
    fullName: string;
    password: string;
    avatar?: string;
    bio?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: {
    fullName?: string;
    bio?: string;
    avatar?: string;
    coverImage?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: (initialTab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  authModalTab: 'login' | 'register';
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = tokenStorage.get();
    if (!token) {
      setUser(null);
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
      setStats(res.stats);
    } catch {
      tokenStorage.clear();
      setUser(null);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (identifier: string, password: string) => {
    const res = await api.login({ identifier, password });
    setUser(res.user);
    setIsAuthModalOpen(false);
    showToast(`მოგესალმებით, ${res.user.fullName}!`);
    await refreshUser();
  };

  const register = async (payload: {
    username: string;
    email: string;
    fullName: string;
    password: string;
    avatar?: string;
    bio?: string;
  }) => {
    const res = await api.register(payload);
    setUser(res.user);
    setIsAuthModalOpen(false);
    showToast(`რეგისტრაცია წარმატებულია! მოგესალმებით, ${res.user.fullName}!`);
    await refreshUser();
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setStats(null);
    showToast('წარმატებით გამოხვედით სისტემიდან.');
  };

  const updateProfile = async (payload: {
    fullName?: string;
    bio?: string;
    avatar?: string;
    coverImage?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => {
    const res = await api.updateProfile(payload);
    setUser(res.user);
    showToast('პროფილი წარმატებით განახლდა!');
    await refreshUser();
  };

  const openAuthModal = (initialTab: 'login' | 'register' = 'login') => {
    setAuthModalTab(initialTab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        stats,
        loading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authModalTab,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
