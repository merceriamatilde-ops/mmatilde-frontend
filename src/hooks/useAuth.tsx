import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api/client';

type User = {
  email: string;
  nombre: string;
  rol: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (data: any) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('mmatilde_user');
    const token = localStorage.getItem('mmatilde_token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (data: any) => {
    const res: any = await api.login(data);
    const userData = { email: res.email, nombre: res.nombre, rol: res.rol };
    localStorage.setItem('mmatilde_token', res.token);
    localStorage.setItem('mmatilde_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('mmatilde_token');
    localStorage.removeItem('mmatilde_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
