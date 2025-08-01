
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Library, Users, CalendarRange, Settings } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';

const navItems = [
  { href: '/schedule', label: 'Reuniões', icon: CalendarDays },
  { href: '/monthly-schedule', label: 'Escala', icon: CalendarRange },
  { href: '/music', label: 'Músicas', icon: Library },
  { href: '/members', label: 'Membros', icon: Users },
  { href: '/settings', label: 'Ajustes', icon: Settings, permission: 'manage:settings'},
];

export function BottomNav() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { can } = useAuth();

  if (!isMobile) {
    return null;
  }

  const visibleItems = navItems.filter(item => !item.permission || can(item.permission as any));

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border md:hidden">
      <div className={cn("grid h-full max-w-lg mx-auto font-medium",
        `grid-cols-${visibleItems.length}`
      )}>
        {visibleItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} passHref>
              <button
                type="button"
                className={cn(
                  'inline-flex flex-col items-center justify-center px-5 h-full hover:bg-muted/50 group w-full',
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
