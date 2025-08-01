
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Role } from '@/types';

interface AuthContextType {
  role: Role;
  setRole: (role: Role) => void;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type Permission = 'edit:schedule' | 'edit:members' | 'edit:songs' | 'manage:playlists';

const rolePermissions: Record<Role, Permission[]> = {
  admin: ['edit:schedule', 'edit:members', 'edit:songs', 'manage:playlists'],
  dirigente: ['manage:playlists'],
  viewer: [],
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role>('admin');
  
  const can = (permission: Permission) => {
    return rolePermissions[role].includes(permission);
  }

  return (
    <AuthContext.Provider value={{ role, setRole, can }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};
