import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('railalert_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('railalert_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('railalert_token');
      if (savedToken) {
        try {
          const userData = await authAPI.getMe();
          setUser(userData);
          localStorage.setItem('railalert_user', JSON.stringify(userData));
        } catch (err) {
          console.warn('Session verification failed, logging out:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('railalert_token', data.access_token);
    localStorage.setItem('railalert_user', JSON.stringify(data.user));
    return data.user;
  };

  const register = async (userData) => {
    const data = await authAPI.register(userData);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('railalert_token', data.access_token);
    localStorage.setItem('railalert_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('railalert_token');
    localStorage.removeItem('railalert_user');
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    role: user?.role || 'passenger',
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
