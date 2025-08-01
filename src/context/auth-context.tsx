
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Role } from '@/types';

interface AuthContextType {
  role: Role | null;
  isAuthenticated: boolean;
  login: (role: Role, password?: string) => boolean;
  logout: () => void;
  switchRole: (role: Role) => void;
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
    viewer: '' // Viewer has no password
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role | null>(null);

  // By default, the app is "authenticated" in viewer mode.
  // The concept of isAuthenticated is now just about whether a role is set.
  const isAuthenticated = !!role;

  useEffect(() => {
    const savedRole = sessionStorage.getItem('userRole') as Role;
    if (savedRole && rolePermissions[savedRole]) {
        setRole(savedRole);
    } else {
        // Default to viewer if nothing is set
        setRole('viewer');
        sessionStorage.setItem('userRole', 'viewer');
    }
  }, []);

  const login = (roleToSet: Role, password?: string): boolean => {
    if (password && rolePasswords[roleToSet] === password) {
      setRole(roleToSet);
      sessionStorage.setItem('userRole', roleToSet);
      return true;
    }
    return false;
  };
  
  const switchRole = (newRole: Role) => {
    setRole(newRole);
    sessionStorage.setItem('userRole', newRole);
  }

  const logout = () => {
    // In this new flow, "logout" means reverting to viewer mode
    setRole('viewer');
    sessionStorage.setItem('userRole', 'viewer');
  };
  
  const can = (permission: Permission) => {
    if (!isAuthenticated || !role) {
        return false;
    }
    return rolePermissions[role].includes(permission);
  }

  return (
    <AuthContext.Provider value={{ role, isAuthenticated, login, logout, switchRole, can }}>
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
