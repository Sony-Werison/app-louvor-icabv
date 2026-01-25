
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Role } from '@/types';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  User,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';

interface AuthContextType {
  role: Role | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (role: Role, password?: string) => boolean;
  logout: () => void;
  switchRole: (role: Role) => void;
  can: (permission: Permission) => boolean;
  isLoading: boolean;
  userId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type Permission = 'edit:schedule' | 'edit:members' | 'edit:songs' | 'manage:playlists' | 'manage:settings';

const rolePermissions: Record<Role, Permission[]> = {
  admin: ['edit:schedule', 'edit:members', 'edit:songs', 'manage:playlists', 'manage:settings'],
  abertura: ['manage:playlists'],
  viewer: [],
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { auth, firestore } = useFirebase();
  const [role, setRole] = useState<Role | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const isAuthenticated = !!user && !!role;
  const userId = user?.uid || null;

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const savedRole = sessionStorage.getItem('userRole') as Role;
        if (savedRole && rolePermissions[savedRole]) {
          setRole(savedRole);
        } else {
          setRole('viewer');
          sessionStorage.setItem('userRole', 'viewer');
        }
      } else {
        await signInAnonymously(auth);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const login = (roleToSet: Role, password?: string): boolean => {
    // This is a mock login for the prototype.
    // In a real app, this logic would be handled by a secure backend.
    const passwords: Partial<Record<Role, string>> = {
        admin: 'admin123',
        abertura: 'abertura',
    };

    if (passwords[roleToSet] && password !== passwords[roleToSet]) {
        toast({ title: 'Senha Incorreta', variant: 'destructive' });
        return false;
    }

    setRole(roleToSet);
    sessionStorage.setItem('userRole', roleToSet);
    toast({ title: `Perfil alterado para ${roleToSet}` });
    return true;
  };
  
  const switchRole = (newRole: Role) => {
    // Directly switch for viewer, otherwise let the login dialog handle it.
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

  const value: AuthContextType = {
      role, 
      user,
      isAuthenticated, 
      login, 
      logout, 
      switchRole, 
      can,
      isLoading: isLoading,
      userId,
  };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? (
          <div className="flex items-center justify-center h-screen bg-background">
              <div className="flex flex-col items-center gap-2">
                <p className="text-muted-foreground">Autenticando...</p>
              </div>
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
