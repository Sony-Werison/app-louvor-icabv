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
import { CalendarDays, Library, Users, CalendarRange } from 'lucide-react';

const navItems = [
  { href: '/schedule', label: 'Reuniões', icon: CalendarDays },
  { href: '/monthly-schedule', label: 'Escala Mensal', icon: CalendarRange },
  { href: '/music', label: 'Músicas', icon: Library },
  { href: '/members', label: 'Membros', icon: Users },
];

export function AppNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <>
      <SidebarContent className="pt-4">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  as="a"
                  isActive={pathname.startsWith(item.href)}
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
