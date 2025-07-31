'use client';

import type { Schedule, Member, Song } from '@/types';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlaylistDialog } from '@/components/playlist-dialog';
import { ListMusic } from 'lucide-react';

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
  
  const getMemberById = (id: string) => members.find(m => m.id === id);
  const getSongById = (id: string) => songs.find(s => s.id === id);
  const getMemberInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {schedules.map((schedule) => {
          const leader = getMemberById(schedule.leaderId);
          const playlistSongs = schedule.playlist.map(getSongById).filter((s): s is Song => !!s);

          return (
            <Card key={schedule.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="font-headline font-bold text-2xl">
                  {schedule.name}
                </CardTitle>
                <CardDescription>
                  {schedule.date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-6">
                {leader && (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={leader.avatar} alt={leader.name} />
                      <AvatarFallback>{getMemberInitial(leader.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-sm text-muted-foreground">Dirigente</span>
                      <p className="font-semibold">{leader.name}</p>
                    </div>
                  </div>
                )}

                <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2"><ListMusic className="w-4 h-4"/>Repertório</h3>
                    {playlistSongs.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            {playlistSongs.map(song => (
                                <li key={song.id}>{song.title} - <span className="opacity-80">{song.artist}</span></li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">Nenhuma música selecionada.</p>
                    )}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => setSelectedSchedule(schedule)} className="w-full">
                  <ListMusic className="mr-2 h-4 w-4" />
                  Gerenciar Repertório
                </Button>
              </CardFooter>
            </Card>
          );
        })}
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
