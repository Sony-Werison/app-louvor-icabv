
'use client';

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';

const routeTitles: { [key: string]: string } = {
    '/schedule': 'Reuniões da Semana',
    '/monthly-schedule': 'Escala Mensal',
    '/music': 'Biblioteca de Músicas',
    '/members': 'Membros',
    '/settings': 'Configurações',
};

const getTitleFromPath = (path: string): string => {
  const exactMatch = routeTitles[path];
  if (exactMatch) return exactMatch;

  const baseRoute = Object.keys(routeTitles).find(key => path.startsWith(key) && key !== '/');
  return baseRoute ? routeTitles[baseRoute] : 'Dashboard';
}

export function PageTitle() {
  const pathname = usePathname();
  const title = getTitleFromPath(pathname);

  return (
    <div className="flex items-center gap-2">
        <SidebarTrigger/>
    </div>
  );
}
