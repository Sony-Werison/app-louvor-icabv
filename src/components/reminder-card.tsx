

'use client';

import type { Schedule, Member } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BellRing, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from '@/context/auth-context';

interface ReminderCardProps {
  schedules: Schedule[];
  members: Member[];
}

export function ReminderCard({ schedules, members }: ReminderCardProps) {
  const { can } = useAuth();
  
  const getMemberById = (id: string) => members.find(m => m.id === id);

  const handleRemindClick = (member: Member, schedule: Schedule) => {
    if (!member.phone) {
      alert(`O membro ${member.name} não possui um telefone cadastrado.`);
      return;
    }
    
    // This functionality is simplified as hardcoding messages/passwords in frontend is not secure.
    // In a real app, this would trigger a backend process (e.g., a Cloud Function)
    // that sends a templated message.
    
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

    const message = `Paz do Senhor, ${firstName}! Tudo bem? Passando para lembrar que você ficou de montar o repertório para ${dayDescription}. Assim que puder, acesse o app para definir as músicas. Deus abençoe!`;

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
                      <MessageSquare className="mr-2 h-4 w-4 text-primary" />
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
