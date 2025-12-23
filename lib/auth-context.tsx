// lib/auth/auth-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { apiClient } from '@/lib/api/client';

interface User {
  id: string;
  email: string;
  username: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface RegisterData {
  email: string;
  username: string;
  password: string; // Changed from password_hash to match frontend
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const decoded: any = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          logout();
        } else {
          setUser(JSON.parse(userStr));
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        logout();
      }
    }
    setIsLoading(false);
  };

  // Protect routes
  useEffect(() => {
    if (isLoading) return;

    const publicPaths = ['/login', '/register', '/'];
    const isPublicPath = publicPaths.includes(pathname);
    
    if (!user && !isPublicPath) {
      router.push('/login');
    } else if (user && isPublicPath && pathname !== '/') {
      router.push('/dashboard');
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { 
        email, 
        password 
      });

      const data = response.data;
      
      // Decode token to get user info
      const decoded: any = jwtDecode(data.access_token);
      const userData: User = {
        id: decoded.sub,
        email: decoded.email,
        username: decoded.username || email.split('@')[0],
        roles: decoded.roles || [],
      };

      // Store tokens and user data
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error details:', error);
      if (error.response) {
        throw new Error(error.response.data?.message || 'Login failed');
      } else if (error.request) {
        throw new Error('Cannot connect to server. Please check if backend is running.');
      } else {
        throw new Error('An error occurred during login');
      }
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      // Note: Backend expects password_hash, but we'll send password
      const response = await apiClient.post('/auth/register', {
        email: userData.email,
        username: userData.username,
        password_hash: userData.password, // Map password to password_hash
      });

      // Auto-login after registration
      await login(userData.email, userData.password);
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.response) {
        throw new Error(error.response.data?.message || 'Registration failed');
      } else {
        throw new Error('An error occurred during registration');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}