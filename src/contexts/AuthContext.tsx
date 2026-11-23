/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, DEMO_CREDENTIALS } from '@/services/auth.service';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (credentials: { email: string; password?: string }) => { success: boolean; user?: User; error?: string };
  loginDemo: () => User;
  logout: () => void;
  isAdmin: () => boolean;
  isAuthenticated: () => boolean;
  demoCredentials: typeof DEMO_CREDENTIALS;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());

  useEffect(() => {
    // Sync if storage event occurs
    const handleStorageChange = () => {
      setUser(authService.getCurrentUser());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (credentials: { email: string; password?: string }) => {
    const res = authService.login(credentials);
    if (res.success && res.user) {
      setUser(res.user);
    }
    return res;
  };

  const loginDemo = () => {
    const demoUser = authService.loginDemoUser();
    setUser(demoUser);
    return demoUser;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isAuthenticated = () => {
    return !!user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginDemo,
        logout,
        isAdmin,
        isAuthenticated,
        demoCredentials: DEMO_CREDENTIALS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
