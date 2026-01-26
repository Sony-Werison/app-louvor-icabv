
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Role } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  role: Role;
  isLoading: boolean;
  can: (permission: Permission) => boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  shareMessage: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type Permission = 'edit:schedule' | 'edit:members' | 'edit:songs' | 'manage:playlists' | 'manage:settings';

const rolePermissions: Record<Role, Permission[]> = {
  admin: ['edit:schedule', 'edit:members', 'edit:songs', 'manage:playlists', 'manage:settings'],
  abertura: [], // Not used with Supabase basic auth
  viewer: [],
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>('viewer');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const shareMessage = "Paz do Senhor, segue o repertório para [PERIODO] ([DATA]). Deus abençoe!";

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      setRole('admin'); // Fallback to admin if no supabase
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setRole(session?.user ? 'admin' : 'viewer');
      setIsLoading(false);
    });

    // Check initial session
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setRole(data.session?.user ? 'admin' : 'viewer');
      setIsLoading(false);
    }
    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);


  const login = async (email: string, password: string):Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      toast({ title: 'Erro de Configuração', description: 'Supabase não está configurado.', variant: 'destructive'});
      return { success: false, error: 'Supabase not configured' };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        toast({ title: 'Falha no Login', description: error.message, variant: 'destructive' });
        return { success: false, error: error.message };
    }
    
    toast({ title: 'Login bem-sucedido!'});
    return { success: true };
  };
  
  const logout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  const can = useCallback((permission: Permission) => {
    return rolePermissions[role].includes(permission);
  }, [role]);


  const value: AuthContextType = {
      user,
      role,
      isLoading,
      can,
      login,
      logout,
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
