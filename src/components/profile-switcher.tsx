
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { Role } from '@/types';
import { Shield, Users, Eye, Check, ChevronDown, UserCheck } from 'lucide-react';
import { LoginDialog } from './login-dialog';


const roleIcons: Record<Role, React.ElementType> = {
    admin: Shield,
    abertura: UserCheck,
    viewer: Eye,
};

const roleLabels: Record<Role, string> = {
    admin: 'Admin',
    abertura: 'Abertura',
    viewer: 'Visualização',
};

export function ProfileSwitcher() {
  const { role, switchRole } = useAuth();
  const [loginRole, setLoginRole] = useState<Role | null>(null);
  
  if (!role) return null;

  const Icon = roleIcons[role];
  const label = roleLabels[role];

  const handleRoleSelect = (selectedRole: Role) => {
    if (selectedRole === 'viewer') {
        switchRole('viewer');
    } else {
        setLoginRole(selectedRole);
    }
  }

  return (
    <>
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
        <DropdownMenuLabel>Trocar Perfil</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(roleLabels) as Role[]).map((r) => {
            const RoleIcon = roleIcons[r];
            return (
                 <DropdownMenuItem key={r} onClick={() => handleRoleSelect(r)}>
                    <RoleIcon className="mr-2 h-4 w-4" />
                    <span>{roleLabels[r]}</span>
                    {role === r && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
            )
        })}
      </DropdownMenuContent>
    </DropdownMenu>

    {loginRole && (
        <LoginDialog
            isOpen={!!loginRole}
            onOpenChange={() => setLoginRole(null)}
            roleToLogin={loginRole}
        />
    )}
    </>
  );
}
