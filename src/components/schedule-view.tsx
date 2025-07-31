'use client';

import type { Schedule, Member, Song } from '@/types';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlaylistDialog } from '@/components/playlist-dialog';
import { Guitar, MicVocal, Music, Users, ListMusic } from 'lucide-react';

const instrumentIcons: Record<string, React.ElementType> = {
  Vocal: MicVocal,
  Guitar: Guitar,
  Bass: Guitar,
  Drums: Music,
  Keyboard: Music,
};

interface ScheduleViewProps {
  initialSchedules: Schedule[];
  members: Member[];
  songs: Song[];
}

export function ScheduleView({ initialSchedules, members, songs }: ScheduleViewProps) {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  const handlePlaylistSave = (scheduleId: string, newPlaylist: string[]) => {
    setSchedules(currentSchedules =>
      currentSchedules.map(s =>
        s.id === scheduleId ? { ...s, playlist: newPlaylist } : s
      )
    );
    setSelectedSchedule(null);
  };
  
  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || 'Desconhecido';
  const getMemberAvatar = (id: string) => members.find(m => m.id === id)?.avatar || '';
  const getMemberInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {schedules.map((schedule) => (
          <Card key={schedule.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">
                {schedule.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
              </CardTitle>
              <CardDescription>
                {schedule.date.toLocaleDateString('pt-BR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <h3 className="font-semibold mb-2 flex items-center gap-2"><Users className="w-4 h-4"/>Equipe</h3>
              <div className="flex flex-wrap gap-4">
                {schedule.team.map(({ memberId, instrument }) => {
                  const Icon = instrumentIcons[instrument];
                  const memberName = getMemberName(memberId);
                  return (
                    <div key={memberId} className="flex items-center gap-2 text-sm">
                       <Avatar className="h-8 w-8">
                        <AvatarImage src={getMemberAvatar(memberId)} alt={memberName} />
                        <AvatarFallback>{getMemberInitial(memberName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{memberName}</p>
                        <p className="text-muted-foreground flex items-center gap-1"><Icon className="w-3 h-3"/>{instrument}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setSelectedSchedule(schedule)} className="w-full">
                <ListMusic className="mr-2 h-4 w-4" />
                Gerenciar Repertório
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      {selectedSchedule && (
        <PlaylistDialog
          schedule={selectedSchedule}
          allSongs={songs}
          onSave={handlePlaylistSave}
          onOpenChange={() => setSelectedSchedule(null)}
        />
      )}
    </>
  );
}
