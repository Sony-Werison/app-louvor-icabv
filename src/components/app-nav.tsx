'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { AppLogo } from '@/components/app-logo';
import { CalendarDays, Library, Users, CalendarRange } from 'lucide-react';

const navItems = [
  { href: '/schedule', label: 'Reuniões', icon: CalendarDays },
  { href: '/monthly-schedule', label: 'Escala Mensal', icon: CalendarRange },
  { href: '/music', label: 'Músicas', icon: Library },
  { href: '/members', label: 'Membros', icon: Users },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader>
        <AppLogo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  as="a"
                  isActive={pathname.startsWith(item.href)}
                  tooltip={item.label}
                >
                    <item.icon />
                    <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
