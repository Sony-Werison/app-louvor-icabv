
'use client';

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

const routeTitles: { [key: string]: string } = {
    '/schedule': 'Reuniões da Semana',
    '/monthly-schedule': 'Escala Mensal',
    '/music': 'Biblioteca de Músicas',
    '/members': 'Membros',
};

const getTitleFromPath = (path: string): string => {
  const exactMatch = routeTitles[path];
  if (exactMatch) return exactMatch;

  const baseRoute = Object.keys(routeTitles).find(key => path.startsWith(key) && key !== '/');
  return baseRoute ? routeTitles[baseRoute] : '';
}

export function PageTitle() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const title = getTitleFromPath(pathname);

  if (!isMobile) {
      return <SidebarTrigger />;
  }

  return <h1 className="text-lg font-bold truncate">{title}</h1>;
}
