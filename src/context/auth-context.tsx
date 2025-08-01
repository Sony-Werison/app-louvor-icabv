
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Role } from '@/types';
import { fetchPasswords, savePasswords } from '@/lib/blob-storage';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  role: Role | null;
  isAuthenticated: boolean;
  login: (role: Role, password?: string) => boolean;
  logout: () => void;
  switchRole: (role: Role) => void;
  can: (permission: Permission) => boolean;
  updatePassword: (roleToUpdate: Role, currentPassword: string, newPassword: string) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type Permission = 'edit:schedule' | 'edit:members' | 'edit:songs' | 'manage:playlists' | 'manage:settings';

const rolePermissions: Record<Role, Permission[]> = {
  admin: ['edit:schedule', 'edit:members', 'edit:songs', 'manage:playlists', 'manage:settings'],
  dirigente: ['manage:playlists'],
  viewer: [],
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role | null>(null);
  const [rolePasswords, setRolePasswords] = useState<Record<Role, string> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const isAuthenticated = !!role;

  const loadPasswords = useCallback(async () => {
    setIsLoading(true);
    const passwords = await fetchPasswords();
    setRolePasswords(passwords);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadPasswords();
  }, [loadPasswords]);

  useEffect(() => {
    if (isLoading) return; // Wait for passwords to be loaded

    const savedRole = sessionStorage.getItem('userRole') as Role;
    if (savedRole && rolePermissions[savedRole]) {
        setRole(savedRole);
    } else {
        setRole('viewer');
        sessionStorage.setItem('userRole', 'viewer');
    }
  }, [isLoading]);

  const login = (roleToSet: Role, password?: string): boolean => {
    if (!rolePasswords) return false;

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
    setRole('viewer');
    sessionStorage.setItem('userRole', 'viewer');
  };
  
  const can = (permission: Permission) => {
    if (!isAuthenticated || !role) {
        return false;
    }
    return rolePermissions[role].includes(permission);
  }

  const updatePassword = async (roleToUpdate: Role, currentPassword: string, newPassword: string) => {
    if (role !== 'admin' || !rolePasswords) {
      toast({ title: 'Acesso Negado', description: 'Você não tem permissão para alterar senhas.', variant: 'destructive'});
      return false;
    }
    if (roleToUpdate === 'viewer') {
        toast({ title: 'Ação Inválida', description: 'O perfil de Visualização não pode ter uma senha.', variant: 'destructive'});
        return false;
    }
    
    if (rolePasswords[roleToUpdate] !== currentPassword) {
        toast({ title: 'Senha Incorreta', description: `A senha atual para o perfil ${roleToUpdate} está incorreta.`, variant: 'destructive'});
        return false;
    }

    const newPasswords = { ...rolePasswords, [roleToUpdate]: newPassword };
    try {
        await savePasswords(newPasswords);
        setRolePasswords(newPasswords); // Update state locally
        toast({ title: 'Sucesso!', description: `A senha para o perfil ${roleToUpdate} foi atualizada.`});
        return true;
    } catch(error) {
        console.error('Failed to update password:', error);
        toast({ title: 'Erro', description: 'Não foi possível atualizar a senha.', variant: 'destructive'});
        return false;
    }
  }

  const value = {
      role, 
      isAuthenticated, 
      login, 
      logout, 
      switchRole, 
      can,
      updatePassword,
      isLoading: isLoading || !role, // Consider loading until role is also set
  };

  return (
    <AuthContext.Provider value={value}>
      {value.isLoading ? (
          <div className="flex items-center justify-center h-screen bg-background">
              <div className="flex flex-col items-center gap-2">
                <p className="text-muted-foreground">Carregando...</p>
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
