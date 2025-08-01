
'use client';

import { useAuth } from '@/context/auth-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Role } from '@/types';
import { Shield, Users, Eye } from 'lucide-react';
import React from 'react';

const roleIcons: Record<Role, React.ElementType> = {
    admin: Shield,
    dirigente: Users,
    viewer: Eye,
};

const roleLabels: Record<Role, string> = {
    admin: 'Admin',
    dirigente: 'Dirigente',
    viewer: 'Visualização',
};

export function ProfileSwitcher() {
  const { role, setRole } = useAuth();
  
  const Icon = roleIcons[role];

  return (
    <Select value={role} onValueChange={(value) => setRole(value as Role)}>
      <SelectTrigger className="w-48">
        <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Selecionar Perfil" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {Object.keys(roleLabels).map((key) => {
          const roleKey = key as Role;
          const RoleIcon = roleIcons[roleKey];
          return (
            <SelectItem key={roleKey} value={roleKey}>
                <div className="flex items-center gap-2">
                    <RoleIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{roleLabels[roleKey]}</span>
                </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
