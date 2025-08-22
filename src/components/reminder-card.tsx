
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
    fill="currentColor"
    {...props}
  >
    <path d="M16.75 13.96c.25.13.41.2.46.3.06.11.04.61-.21 1.18-.2.56-1.24 1.1-1.7 1.12-.46.02-.83.02-1.29-.15-.45-.17-1.02-.35-1.92-1.12s-1.46-1.52-1.8-2.03c-.34-.52-.73-1.12-.73-1.48 0-.36.22-.57.42-.77.2-.2.42-.28.56-.28.15,0,.28,0,.38.01.1.01.13.01.21.21.08.2.23.68.25.73.02.05.03.1.01.18-.02.08-.05.11-.1.16-.05.05-.1.07-.15.11-.05.05-.1.06-.12.1a.53.53,0,0,0-.08.18c-.01.07.02.13.06.19.23.35.92,1.38,1.81,2.05.25.19.44.28.58.32.14.04.28.01.38-.05.1-.06.45-.53.57-.72.12-.19.24-.16.42-.11.18.05.95.45,1.11.52.16.07.26.1.3.15.04.05.04.12-.02.24Z" />
    <path d="M20.1 3.9C17.9 1.7 15.1 1 12 1 5.9 1 1 5.9 1 12c0 2.1.6 4.1 1.7 5.8L1 23l5.3-1.4c1.6.9 3.5 1.4 5.7 1.4h.1c6.1 0 11-4.9 11-11 0-3.1-1.3-5.9-3-8.1Zm-8.1 17.9c-1.9 0-3.8-.6-5.3-1.6l-.4-.2-4 1.1.9-3.8-.2-.4c-1-1.6-1.6-3.5-1.6-5.6 0-5 4-9 9-9s9 4 9 9-4 9-9 9Z" />
  </svg>
);


export function ReminderCard({ schedules, members }: ReminderCardProps) {
  const { can, whatsappMessage, aberturaPassword } = useAuth();
  
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
            dayDescription = "*domingo, no período da manhã*";
        } else if (scheduleNameLower.includes('noite')) {
            dayDescription = "*domingo, no período da noite*";
        }
    }


    const phone = member.phone.replace(/\D/g, ''); // Remove non-numeric characters
    const firstName = member.name.split(' ')[0];

    const message = whatsappMessage
      .replace(/\[NOME\]/g, firstName)
      .replace(/\[PERIODO\]/g, dayDescription)
      .replace(/\[SENHA\]/g, aberturaPassword);

    const whatsappLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(whatsappLink, '_blank');
  };

  return (
    <Card className="bg-amber-500/10 border-amber-500/20">
      <CardHeader className="flex-row items-center gap-3">
        <BellRing className="w-6 h-6 text-amber-500 shrink-0" />
        <CardDescription className="text-amber-300/80">
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
                {can('manage:settings') && (
                    <Button size="sm" variant="outline" onClick={() => handleRemindClick(leader, schedule)} disabled={!leader.phone}>
                      <WhatsappIcon className="mr-2 h-4 w-4 text-green-500" />
                      Lembrar
                    </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
