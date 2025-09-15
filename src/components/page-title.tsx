
'use client';

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';

const routeTitles: { [key: string]: string } = {
    '/': 'Início',
    '/schedule': 'Aberturas da Semana',
    '/monthly-schedule': 'Escala Mensal',
    '/music': 'Biblioteca de Músicas',
    '/members': 'Membros',
    '/settings': 'Configurações',
    '/sala-ao-vivo': 'Sala ao Vivo',
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
        <h1 className="font-headline font-bold text-lg hidden md:block">{title}</h1>
    </div>
  );
}
