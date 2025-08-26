
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { ListMusic, Library, Users, CalendarRange, Settings, Home } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

const navItems = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/schedule', label: 'Aberturas', icon: ListMusic },
  { href: '/monthly-schedule', label: 'Escala Mensal', icon: CalendarRange },
  { href: '/music', label: 'Músicas', icon: Library },
  { href: '/members', label: 'Membros', icon: Users },
];

const adminNavItems = [
    { href: '/settings', label: 'Configurações', icon: Settings, permission: 'manage:settings' },
]

export function AppNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { can } = useAuth();
  
  const allNavItems = [...navItems, ...adminNavItems.filter(item => can(item.permission as any))];

  return (
    <>
      <SidebarContent className="pt-4">
        <SidebarMenu>
          {allNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  as="a"
                  isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                  tooltip={item.label}
                  onClick={() => setOpenMobile(false)}
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
