'use client';

import type { Schedule, Member, Song } from '@/types';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlaylistDialog } from '@/components/playlist-dialog';
import { ListMusic, Users, Mic, BookUser, Tv } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useSchedule } from '@/context/schedule-context';
import { Separator } from './ui/separator';

interface ScheduleViewProps {
  initialSchedules: Schedule[];
  members: Member[];
  songs: Song[];
}

export function ScheduleView({ initialSchedules, members, songs }: ScheduleViewProps) {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = useState(false);
  const { updateSchedulePlaylist } = useSchedule();
  
  useEffect(() => {
    setSchedules(initialSchedules);
  }, [initialSchedules]);


  const handlePlaylistSave = (scheduleId: string, newPlaylist: string[]) => {
    // This function will now update the context/global state
    // For now, it just updates local state for the dialog to close properly
    const updatedSchedules = schedules.map(s =>
      s.id === scheduleId ? { ...s, playlist: newPlaylist } : s
    );
    setSchedules(updatedSchedules);

    // Here you could call a function from context to persist the change
    updateSchedulePlaylist(scheduleId, newPlaylist);

    setIsPlaylistDialogOpen(false);
    setSelectedSchedule(null);
  };
  
  const handleOpenPlaylist = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsPlaylistDialogOpen(true);
  }

  const getMemberById = (id: string | null) => id ? members.find(m => m.id === id) : null;
  const getSongById = (id: string) => songs.find(s => s.id === id);
  const getMemberInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <TooltipProvider>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-headline font-bold">Reuniões da Semana</h1>
      </div>

      {schedules.length === 0 ? (
         <div className="flex flex-col items-center justify-center text-center text-muted-foreground bg-card border rounded-lg p-12">
            <Users className="w-16 h-16 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Nenhuma reunião esta semana</h2>
            <p>Vá para a página "Escala Mensal" para planejar as próximas semanas.</p>
         </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {schedules.map((schedule) => {
            const leader = getMemberById(schedule.leaderId);
            const preacher = getMemberById(schedule.preacherId);
            const playlistSongs = schedule.playlist.map(getSongById).filter((s): s is Song => !!s);
            const teamMembers = (schedule.team?.multimedia || [])
              .map(id => getMemberById(id))
              .filter((m): m is Member => !!m);

            return (
              <Card key={schedule.id} className="flex flex-col relative">
                <CardHeader>
                  <CardTitle className="font-headline font-bold text-2xl pr-8">
                    {schedule.name}
                  </CardTitle>
                  <CardDescription>
                    {schedule.date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-6">
                  <div className="space-y-4">
                    {leader && (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10" data-ai-hint="person portrait">
                          <AvatarImage src={leader.avatar} alt={leader.name} />
                          <AvatarFallback>{getMemberInitial(leader.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-sm text-muted-foreground flex items-center gap-1"><Mic className="w-3 h-3"/>Dirigente</span>
                          <p className="font-semibold">{leader.name}</p>
                        </div>
                      </div>
                    )}
                    {preacher && (
                       <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10" data-ai-hint="person portrait">
                          <AvatarImage src={preacher.avatar} alt={preacher.name} />
                          <AvatarFallback>{getMemberInitial(preacher.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-sm text-muted-foreground flex items-center gap-1"><BookUser className="w-3 h-3"/>Pregador</span>
                          <p className="font-semibold">{preacher.name}</p>
                        </div>
                      </div>
                    )}
                  </div>


                  {teamMembers.length > 0 && (
                      <div>
                          <Separator className="my-4" />
                          <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm"><Tv className="w-4 h-4"/>Multimídia</h3>
                          <div className="space-y-2">
                              {teamMembers.map(member => (
                                <div key={member.id} className="flex items-center gap-2 text-sm">
                                    <Avatar className="h-6 w-6" data-ai-hint="person portrait">
                                        <AvatarImage src={member.avatar} alt={member.name} />
                                        <AvatarFallback>{getMemberInitial(member.name)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-muted-foreground">{member.name}</span>
                                </div>
                              ))}
                          </div>
                      </div>
                  )}

                  <div>
                      <Separator className="my-4" />
                      <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm"><ListMusic className="w-4 h-4"/>Repertório</h3>
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
                  <Button onClick={() => handleOpenPlaylist(schedule)} className="w-full">
                    <ListMusic className="mr-2 h-4 w-4" />
                    Gerenciar Repertório
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
      
      {isPlaylistDialogOpen && selectedSchedule && (
        <PlaylistDialog
          schedule={selectedSchedule}
          allSongs={songs}
          onSave={handlePlaylistSave}
          onOpenChange={() => { setIsPlaylistDialogOpen(false); setSelectedSchedule(null); }}
        />
      )}
    </TooltipProvider>
  );
}
