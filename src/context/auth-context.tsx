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
  login: (role: Role, password?: string) => boolean; // This will be simplified
  logout: () => void;
  switchRole: (role: Role) => void;
  can: (permission: Permission) => boolean;
  isLoading: boolean;
  userId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type Permission = 'edit:schedule' | 'edit:members' | 'edit:songs' | 'manage:playlists' | 'manage:settings' | 'start:live_room';

const rolePermissions: Record<Role, Permission[]> = {
  admin: ['edit:schedule', 'edit:members', 'edit:songs', 'manage:playlists', 'manage:settings', 'start:live_room'],
  abertura: ['manage:playlists', 'start:live_room'],
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
        // In a real app, you'd get the role from custom claims
        // For now, we'll continue using session storage for the prototype
        const savedRole = sessionStorage.getItem('userRole') as Role;
        if (savedRole && rolePermissions[savedRole]) {
          setRole(savedRole);
        } else {
          setRole('viewer');
        }
      } else {
        // If no user, sign in anonymously by default
        await signInAnonymously(auth);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const login = (roleToSet: Role, password?: string): boolean => {
    // This is now a mock login. In a real scenario, you'd use custom claims.
    // For the prototype, we just switch the role.
    // A real implementation would involve a backend function to set the claim.
    if (roleToSet === 'admin' && password !== 'admin') {
         toast({ title: 'Senha de Admin Incorreta', variant: 'destructive' });
         return false;
    }
     if (roleToSet === 'abertura' && password !== 'abertura') {
         toast({ title: 'Senha de Abertura Incorreta', variant: 'destructive' });
         return false;
    }

    setRole(roleToSet);
    sessionStorage.setItem('userRole', roleToSet);
    toast({ title: `Perfil alterado para ${roleToSet}` });
    return true;
  };
  
  const switchRole = (newRole: Role) => {
    if (newRole === 'viewer') {
        setRole(newRole);
        sessionStorage.setItem('userRole', newRole);
    } else {
        // For prototype purposes, we allow direct switching for simplicity,
        // but in a real app, this would trigger a login/verification flow.
        // The `login` function will handle the "password".
    }
  }

  const logout = () => {
    // For anonymous auth, "logout" means switching to a viewer role
    setRole('viewer');
    sessionStorage.setItem('userRole', 'viewer');
  };
  
  const can = (permission: Permission) => {
    if (!isAuthenticated || !role) {
        return false;
    }
    return rolePermissions[role].includes(permission);
  }

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
