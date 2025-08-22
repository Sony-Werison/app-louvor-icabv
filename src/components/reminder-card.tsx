
'use client';

import type { Schedule, Member } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BellRing, Mail } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from '@/context/auth-context';

interface ReminderCardProps {
  schedules: Schedule[];
  members: Member[];
}

export function ReminderCard({ schedules, members }: ReminderCardProps) {
  const { can } = useAuth();
  if (!can('manage:playlists')) return null;
  
  const getMemberById = (id: string) => members.find(m => m.id === id);

  const handleRemindClick = (member: Member, schedule: Schedule) => {
    if (!member.email) {
      alert(`O membro ${member.name} não possui um e-mail cadastrado.`);
      return;
    }

    const subject = `Lembrete: Montar Repertório - ${schedule.name}`;
    const body = `Olá, ${member.name}!\n\nPassando para lembrar de montar o repertório para o culto de "${schedule.name}".\n\nObrigado!`;
    const mailtoLink = `mailto:${member.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoLink;
  };

  return (
    <Card className="bg-amber-500/10 border-amber-500/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <BellRing className="w-6 h-6 text-amber-500" />
          <CardTitle className="text-lg text-amber-200">Lembretes Pendentes</CardTitle>
        </div>
        <CardDescription className="text-amber-300/80 pl-9">
          Os seguintes líderes ainda não montaram o repertório para esta semana.
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
                <Button size="sm" variant="outline" onClick={() => handleRemindClick(leader, schedule)} disabled={!leader.email}>
                  <Mail className="mr-2 h-4 w-4" />
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
