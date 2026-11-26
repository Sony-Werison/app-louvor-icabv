
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
import { ListMusic, Library, Users, CalendarRange, Settings, Home, History, Music } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

const navItems = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/schedule', label: 'Aberturas', icon: ListMusic },
  { href: '/monthly-schedule', label: 'Escala Mensal', icon: CalendarRange },
  { href: '/music', label: 'Músicas', icon: Library },
  { href: '/members', label: 'Membros', icon: Users },
  { href: '/history', label: 'Histórico', icon: History },
];

const adminNavItems = [
    { href: '/settings', label: 'Configurações', icon: Settings, permission: 'manage:settings' },
]

export function AppNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { can, account } = useAuth();
  
  const allNavItems = [
      ...navItems,
      ...adminNavItems.filter(item => item.href === '/settings' ? !!account?.active && !account.must_change_password : can(item.permission as any))
  ];

  return (
    <>
      <SidebarContent className="pt-4">
        <SidebarMenu>
          {allNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                  tooltip={item.label}
                  onClick={() => setOpenMobile(false)}
                >
                  <Link href={item.href}><item.icon /><span>{item.label}</span></Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
