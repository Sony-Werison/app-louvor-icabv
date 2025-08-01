
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Role } from '@/types';
import { LoginDialog } from '@/components/login-dialog';

interface AuthContextType {
  role: Role | null;
  isAuthenticated: boolean;
  login: (role: Role, password: string) => boolean;
  logout: () => void;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type Permission = 'edit:schedule' | 'edit:members' | 'edit:songs' | 'manage:playlists';

const rolePermissions: Record<Role, Permission[]> = {
  admin: ['edit:schedule', 'edit:members', 'edit:songs', 'manage:playlists'],
  dirigente: ['manage:playlists'],
  viewer: [],
};

const rolePasswords: Record<Role, string> = {
    admin: 'admin',
    dirigente: 'dirigente',
    viewer: 'viewer'
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const savedRole = sessionStorage.getItem('userRole') as Role;
    if (savedRole && rolePermissions[savedRole]) {
        setRole(savedRole);
        setIsAuthenticated(true);
    }
  }, []);

  const login = (roleToSet: Role, password: string): boolean => {
    if (rolePasswords[roleToSet] === password) {
      setRole(roleToSet);
      setIsAuthenticated(true);
      sessionStorage.setItem('userRole', roleToSet);
      return true;
    }
    return false;
  };

  const logout = () => {
    setRole(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('userRole');
  };
  
  const can = (permission: Permission) => {
    if (!isAuthenticated || !role) {
        return false;
    }
    return rolePermissions[role].includes(permission);
  }

  return (
    <AuthContext.Provider value={{ role, isAuthenticated, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthGate = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <LoginDialog />;
    }

    return <>{children}</>;
}


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
