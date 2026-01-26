
'use client';

import React from 'react';
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
import { LogOut, User as UserIcon, ChevronDown, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from './ui/avatar';


export function ProfileSwitcher() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  
  if (isLoading) {
    return <div className="w-48 h-9 bg-muted rounded-md animate-pulse" />;
  }

  if (!user) {
    return (
        <Button variant="outline" onClick={() => router.push('/login')}>
            <LogIn className="mr-2"/>
            Fazer Login
        </Button>
    )
  }

  const getInitials = (email: string) => {
    const parts = email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').split(' ');
    if (parts.length > 1) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  }


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-48 justify-between">
          <div className="flex items-center gap-2 truncate">
            <Avatar className="h-5 w-5 text-xs">
                <AvatarFallback>{getInitials(user.email || '')}</AvatarFallback>
            </Avatar>
            <span className="truncate">{user.email}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
