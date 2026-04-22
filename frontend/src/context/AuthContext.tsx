import React, { createContext, useState, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';
import { User, UserRole, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const USER_KEY = 'business_nexus_user';
const TOKEN_KEY = 'nexus_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on page reload
  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    if (stored && token) {
      setUser(JSON.parse(stored));
      connectSocket();
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password, role });
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      connectSocket();
      toast.success('Welcome back!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password, role });
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      connectSocket();
      toast.success('Account created successfully!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try { await api.post('/auth/logout'); } catch {}
    disconnectSocket();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Password reset instructions sent to your email');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to send reset email';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    try {
      await api.put(`/auth/reset-password/${token}`, { password: newPassword });
      toast.success('Password reset successfully');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Reset failed';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const updateProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      const { data } = await api.put('/users/profile', updates);
      setUser(data.user);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      toast.success('Profile updated successfully');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Update failed';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const updateProfileManuly = async ()=> {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  };

  return (
    <AuthContext.Provider value={{
      user,setUser, login, register, logout,
      forgotPassword, resetPassword, updateProfile,updateProfileManuly,
      isAuthenticated: !!user,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
