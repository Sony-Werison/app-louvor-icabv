
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Role } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  role: Role | null;
  isAuthenticated: boolean;
  login: (role: Role, password?: string, silent?: boolean) => boolean;
  logout: () => void;
  switchRole: (role: Role) => void;
  can: (permission: Permission) => boolean;
  isLoading: boolean;
  setPassword: (role: Role, newPassword: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type Permission = 'edit:schedule' | 'edit:members' | 'edit:songs' | 'manage:playlists' | 'manage:settings';

const rolePermissions: Record<Role, Permission[]> = {
  admin: ['edit:schedule', 'edit:members', 'edit:songs', 'manage:playlists', 'manage:settings'],
  abertura: ['manage:playlists'],
  viewer: [],
};

const getInitialPasswords = (): Record<Role, string> => {
    if (typeof window === 'undefined') {
        return { admin: 'admin123', abertura: 'abertura', viewer: '' };
    }
    const storedPasswords = localStorage.getItem('app_passwords');
    if (storedPasswords) {
        return JSON.parse(storedPasswords);
    }
    return { admin: 'admin123', abertura: 'abertura', viewer: '' };
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [passwords, setPasswords] = useState<Record<Role, string>>(getInitialPasswords());
  const { toast } = useToast();

  const isAuthenticated = !!role;

  useEffect(() => {
    try {
        const savedRole = sessionStorage.getItem('userRole') as Role;
        if (savedRole && rolePermissions[savedRole]) {
          setRole(savedRole);
        } else {
          setRole('viewer');
          sessionStorage.setItem('userRole', 'viewer');
        }
    } catch (e) {
        setRole('viewer');
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('app_passwords', JSON.stringify(passwords));
      }
  }, [passwords])

  const login = (roleToSet: Role, password?: string, silent = false): boolean => {
    if (passwords[roleToSet] && password !== passwords[roleToSet]) {
        if (!silent) {
            toast({ title: 'Senha Incorreta', variant: 'destructive' });
        }
        return false;
    }

    setRole(roleToSet);
    sessionStorage.setItem('userRole', roleToSet);
    if (!silent) {
        toast({ title: `Perfil alterado para ${roleToSet}` });
    }
    return true;
  };
  
  const switchRole = (newRole: Role) => {
    if (newRole === 'viewer') {
        setRole(newRole);
        sessionStorage.setItem('userRole', newRole);
    }
  }

  const logout = () => {
    setRole('viewer');
    sessionStorage.setItem('userRole', 'viewer');
  };
  
  const can = useCallback((permission: Permission) => {
    if (!isAuthenticated || !role) {
        return false;
    }
    return rolePermissions[role].includes(permission);
  }, [isAuthenticated, role]);

  const setPassword = (roleToUpdate: Role, newPassword: string) => {
      setPasswords(prev => ({
          ...prev,
          [roleToUpdate]: newPassword,
      }))
  }

  const value: AuthContextType = {
      role, 
      isAuthenticated, 
      login, 
      logout, 
      switchRole, 
      can,
      isLoading: isLoading,
      setPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? (
          <div className="flex items-center justify-center h-screen bg-background">
              <p className="text-muted-foreground">Carregando...</p>
          </div>
      ) : children}
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
