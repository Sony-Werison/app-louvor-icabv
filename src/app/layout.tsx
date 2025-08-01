import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppNav } from '@/components/app-nav';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { ScheduleProvider } from '@/context/schedule-context';
import { AuthProvider } from '@/context/auth-context';
import { ProfileSwitcher } from '@/components/profile-switcher';
import { BottomNav } from '@/components/bottom-nav';
import { PageTitle } from '@/components/page-title';

export const metadata: Metadata = {
  title: 'Louvor ICABV',
  description: 'Gestão de escalas e repertório do ministério de louvor da ICABV.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased', 'min-h-screen bg-background')}>
        <AuthProvider>
            <ScheduleProvider>
              <SidebarProvider>
                <Sidebar>
                  <AppNav />
                </Sidebar>
                <SidebarInset>
                  <Header>
                    <PageTitle />
                    <div className="ml-auto flex items-center gap-2">
                      <ProfileSwitcher />
                    </div>
                  </Header>
                  <main className="pb-20 md:pb-0">{children}</main>
                  <BottomNav />
                </SidebarInset>
              </SidebarProvider>
            </ScheduleProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
