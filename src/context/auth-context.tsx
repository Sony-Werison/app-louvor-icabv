
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Role, PasswordSet } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: { email: string } | null;
  role: Role;
  isLoading: boolean;
  passwords: PasswordSet;
  can: (permission: Permission) => boolean;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updatePasswords: (newPasswords: PasswordSet) => Promise<void>;
  shareMessage: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type Permission = 'edit:schedule' | 'edit:members' | 'edit:songs' | 'manage:playlists' | 'manage:settings';

const rolePermissions: Record<Role, Permission[]> = {
  admin: ['edit:schedule', 'edit:members', 'edit:songs', 'manage:playlists', 'manage:settings'],
  abertura: ['manage:playlists'],
  viewer: [],
};

const defaultPasswords: PasswordSet = {
  admin: 'admin123',
  abertura: 'abertura123',
  viewer: 'viewer123',
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [role, setRole] = useState<Role>('viewer');
  const [isLoading, setIsLoading] = useState(true);
  const [passwords, setPasswords] = useState<PasswordSet>(defaultPasswords);
  const { toast } = useToast();

  const shareMessage = "Paz do Senhor, segue o repertório para [PERIODO] ([DATA]). Deus abençoe!";

  useEffect(() => {
    try {
        const storedRole = localStorage.getItem('userRole') as Role;
        const storedUser = localStorage.getItem('user');
        const storedPasswords = localStorage.getItem('appPasswords');
        
        if (storedRole && storedUser && ['admin', 'abertura', 'viewer'].includes(storedRole)) {
            setRole(storedRole);
            setUser(JSON.parse(storedUser));
        }

        if (storedPasswords) {
            setPasswords(JSON.parse(storedPasswords));
        }
    } catch (e) {
        // Could be running on server or localStorage is disabled
    } finally {
        setIsLoading(false);
    }
  }, []);


  const login = async (password: string):Promise<{ success: boolean; error?: string }> => {
    let loggedInRole: Role | null = null;
    if (password === passwords.admin) {
        loggedInRole = 'admin';
    } else if (password === passwords.abertura) {
        loggedInRole = 'abertura';
    } else if (password === passwords.viewer) {
        loggedInRole = 'viewer';
    }

    if (loggedInRole) {
        const userObject = { email: loggedInRole };
        setUser(userObject);
        setRole(loggedInRole);
        localStorage.setItem('userRole', loggedInRole);
        localStorage.setItem('user', JSON.stringify(userObject));
        toast({ title: 'Login bem-sucedido!'});
        return { success: true };
    }
    
    return { success: false, error: 'Senha inválida' };
  };
  
  const logout = async () => {
    setUser(null);
    setRole('viewer');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
  }

  const updatePasswords = async (newPasswords: PasswordSet) => {
    setPasswords(newPasswords);
    localStorage.setItem('appPasswords', JSON.stringify(newPasswords));
  };

  const can = useCallback((permission: Permission) => {
    return rolePermissions[role].includes(permission);
  }, [role]);


  const value: AuthContextType = {
      user,
      role,
      isLoading,
      passwords,
      can,
      login,
      logout,
      updatePasswords,
      shareMessage,
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
