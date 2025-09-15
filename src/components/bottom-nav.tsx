
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ListMusic, Library, Users, CalendarRange, Settings, Home, Guitar } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';

const navItems = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/schedule', label: 'Aberturas', icon: ListMusic },
  { href: '/monthly-schedule', label: 'Escala', icon: CalendarRange },
  { href: '/sala-ao-vivo', label: 'Ao Vivo', icon: Guitar, permission: 'manage:playlists' },
  { href: '/music', label: 'Músicas', icon: Library },
  { href: '/members', label: 'Membros', icon: Users },
];

const adminNavItems = [
    { href: '/settings', label: 'Ajustes', icon: Settings, permission: 'manage:settings'},
];

export function BottomNav() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { can } = useAuth();

  if (!isMobile) {
    return null;
  }

  const allNavItems = [
    ...navItems.filter(item => !item.permission || can(item.permission as any)),
    ...adminNavItems.filter(item => can(item.permission as any))
  ].slice(0, 6); // Max 6 items for bottom nav
  
  const gridColsClass = `grid-cols-${allNavItems.length}`;

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border md:hidden">
      <div className={cn("grid h-full max-w-lg mx-auto font-medium",
        gridColsClass
      )}>
        {allNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} passHref>
              <button
                type="button"
                className={cn(
                  'inline-flex flex-col items-center justify-center px-2 h-full hover:bg-muted/50 group w-full',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
