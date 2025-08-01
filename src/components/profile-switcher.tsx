
'use client';

import { useAuth } from '@/context/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { Role } from '@/types';
import { Shield, Users, Eye, LogOut, ChevronDown } from 'lucide-react';
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
  const { role, logout } = useAuth();
  
  if (!role) return null;

  const Icon = roleIcons[role];
  const label = roleLabels[role];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-48 justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span>{label}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Trocar de Perfil</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
