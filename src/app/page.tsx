
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ListMusic,
  Library,
  Users,
  CalendarRange,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';

const menuItems = [
  { href: '/schedule', label: 'Aberturas', icon: ListMusic },
  { href: '/monthly-schedule', label: 'Escala Mensal', icon: CalendarRange },
  { href: '/music', label: 'Músicas', icon: Library },
  { href: '/members', label: 'Membros', icon: Users },
];

const adminMenuItems = [
    { href: '/settings', label: 'Configurações', icon: Settings, permission: 'manage:settings' },
]

export default function HomePage() {
  const { can } = useAuth();
  const allItems = [...menuItems, ...adminMenuItems.filter(item => can(item.permission as any))];

  return (
    <div className="flex items-center justify-center p-4" style={{minHeight: 'calc(100vh - 8rem)'}}>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-headline">Selecione um menu para começar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
            {allItems.map((item) => (
              <Link href={item.href} key={item.href} passHref>
                <div className="flex flex-col items-center justify-center p-6 bg-muted/50 hover:bg-muted rounded-lg transition-colors aspect-square text-center cursor-pointer">
                  <item.icon className="h-10 w-10 sm:h-12 sm:w-12 mb-2 text-primary" />
                  <span className="font-semibold text-sm sm:text-base">{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
