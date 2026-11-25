
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
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useSchedule } from '@/context/schedule-context';
import { NotificationBell } from './notification-bell';


export function ProfileSwitcher() {
  const { user, account, logout, isLoading } = useAuth();
  const { members } = useSchedule();
  const member = members.find(item => item.id === account?.member_id);
  const router = useRouter();
  
  if (isLoading) {
    return <div className="w-48 h-9 bg-muted rounded-md animate-pulse" />;
  }

  if (!user) {
    return (
        <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Visitante</span>
        <Button variant="outline" onClick={() => router.push('/login')}>
            <LogIn className="mr-2"/>
            Fazer Login
        </Button>
        </div>
    )
  }

  const getInitials = (name: string) => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'U';


  return (
    <div className="flex items-center gap-2"><NotificationBell /><DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-48 justify-between">
          <div className="flex items-center gap-2 truncate">
            <Avatar className="h-5 w-5 text-xs">
                {member?.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                <AvatarFallback>{getInitials(member?.name || user.email)}</AvatarFallback>
            </Avatar>
            <span className="truncate">{member?.name || user.email}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/alterar-senha')}>Alterar senha</DropdownMenuItem>
        <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu></div>
  );
}
