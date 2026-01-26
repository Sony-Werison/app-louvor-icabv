
'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { ScheduleProvider } from '@/context/schedule-context';
import { AuthProvider } from '@/context/auth-context';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ScheduleProvider>
            <SidebarProvider>
                {children}
            </SidebarProvider>
            </ScheduleProvider>
        </AuthProvider>
    );
}
