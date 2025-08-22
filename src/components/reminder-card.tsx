
'use client';

import type { Schedule, Member } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BellRing } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from '@/context/auth-context';

interface ReminderCardProps {
  schedules: Schedule[];
  members: Member[];
}

const WhatsappIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);


export function ReminderCard({ schedules, members }: ReminderCardProps) {
  const { can } = useAuth();
  if (!can('manage:playlists')) return null;
  
  const getMemberById = (id: string) => members.find(m => m.id === id);

  const handleRemindClick = (member: Member, schedule: Schedule) => {
    if (!member.phone) {
      alert(`O membro ${member.name} não possui um telefone cadastrado.`);
      return;
    }
    
    const scheduleNameLower = schedule.name.toLowerCase();
    let dayDescription = "o culto";
    if (scheduleNameLower.includes('dom')) {
        if (scheduleNameLower.includes('manhã')) {
            dayDescription = "domingo, no período da manhã";
        } else if (scheduleNameLower.includes('noite')) {
            dayDescription = "domingo, no período da noite";
        }
    }


    const phone = member.phone.replace(/\D/g, ''); // Remove non-numeric characters
    const firstName = member.name.split(' ')[0];
    const message = `Olá, ${firstName}! Essa é uma mensagem automática para lembrar que você está escalado para a abertura de ${dayDescription}. Para montar o repertório, acesse o app em Reuniões > Gerenciar. Não se esqueça de enviar o quanto antes ao grupo de louvor. Obrigado!`;
    const whatsappLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(whatsappLink, '_blank');
  };

  return (
    <Card className="bg-amber-500/10 border-amber-500/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <BellRing className="w-6 h-6 text-amber-500" />
          <CardTitle className="text-lg text-amber-200">Lembretes Pendentes</CardTitle>
        </div>
        <CardDescription className="text-amber-300/80 pl-9">
          Os seguintes membros ainda não montaram o repertório da semana:
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {schedules.map(schedule => {
            const leader = getMemberById(schedule.leaderId);
            if (!leader) return null;

            return (
              <div key={schedule.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={leader.avatar} alt={leader.name} />
                        <AvatarFallback>{leader.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{leader.name}</p>
                        <p className="text-sm text-muted-foreground">{schedule.name}</p>
                    </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleRemindClick(leader, schedule)} disabled={!leader.phone}>
                  <WhatsappIcon className="mr-2 h-4 w-4 text-green-500" />
                  Lembrar
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
