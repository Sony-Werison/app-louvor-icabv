
'use client';

import type { Schedule, Member, Song } from '@/types';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlaylistDialog } from '@/components/playlist-dialog';
import { PlaylistViewer } from '@/components/playlist-viewer';
import { ListMusic, Users, Mic, BookUser, Tv, Eye, Sun, Moon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useSchedule } from '@/context/schedule-context';
import { Separator } from './ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/context/auth-context';
import { convertGoogleDriveUrl } from '@/lib/utils';

interface ScheduleViewProps {
  initialSchedules: Schedule[];
  members: Member[];
  songs: Song[];
}

export function ScheduleView({ initialSchedules, members, songs }: ScheduleViewProps) {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = useState(false);
  const [isPlaylistViewerOpen, setIsPlaylistViewerOpen] = useState(false);
  const { updateSchedulePlaylist } = useSchedule();
  const { can } = useAuth();
  
  useEffect(() => {
    setSchedules(initialSchedules);
  }, [initialSchedules]);


  const handlePlaylistSave = (scheduleId: string, newPlaylist: string[]) => {
    const updatedSchedules = schedules.map(s =>
      s.id === scheduleId ? { ...s, playlist: newPlaylist } : s
    );
    setSchedules(updatedSchedules);
    updateSchedulePlaylist(scheduleId, newPlaylist);
    setIsPlaylistDialogOpen(false);
    setSelectedSchedule(null);
  };
  
  const handleOpenPlaylist = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsPlaylistDialogOpen(true);
  }

  const handleOpenViewer = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsPlaylistViewerOpen(true);
  }

  const getMemberById = (id: string | null) => id ? members.find(m => m.id === id) : null;
  const getSongById = (id: string) => songs.find(s => s.id === id);
  const getMemberInitial = (name: string) => name.charAt(0).toUpperCase();
  
  const getScheduleIcon = (scheduleName: string) => {
    const lowerCaseName = scheduleName.toLowerCase();
    if (lowerCaseName.includes('manhã')) {
        return <Sun className="w-5 h-5 text-amber-500"/>;
    }
    if (lowerCaseName.includes('noite')) {
        return <Moon className="w-5 h-5 text-blue-400"/>;
    }
    return null;
  }

  return (
    <div className="space-y-6">
        <h1 className="text-xl font-headline font-bold">Reuniões da semana</h1>
        <TooltipProvider>
        {schedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground bg-card border rounded-lg p-8 sm:p-12 h-[calc(100vh-10rem)]">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 mb-4" />
                <h2 className="text-xl sm:text-2xl font-bold mb-2">Nenhuma reunião esta semana</h2>
                <p className="text-sm sm:text-base">Vá para a página "Escala Mensal" para planejar.</p>
            </div>
        ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto">
            {schedules.map((schedule) => {
                const leader = getMemberById(schedule.leaderId);
                const preacher = getMemberById(schedule.preacherId);
                const playlistSongs = schedule.playlist.map(getSongById).filter((s): s is Song => !!s);
                const teamMembers = (schedule.team?.multimedia || [])
                .map(id => getMemberById(id))
                .filter((m): m is Member => !!m);

                return (
                <Card key={schedule.id} className="flex flex-col relative">
                    <CardHeader className="p-3">
                    <div className="flex justify-between items-start">
                        <div>
                           <div className="flex items-center gap-2">
                                {getScheduleIcon(schedule.name)}
                                <CardTitle className="font-headline font-bold text-base capitalize">
                                    {schedule.name}
                                </CardTitle>
                           </div>
                           <CardDescription className="text-xs capitalize ml-7">
                            {format(schedule.date, 'dd MMMM yyyy', { locale: ptBR })}
                          </CardDescription>
                        </div>
                    </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3 p-3 pt-0">
                    <div className="space-y-2">
                        {leader && (
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6" data-ai-hint="person portrait">
                            <AvatarImage src={convertGoogleDriveUrl(leader.avatar)} alt={leader.name} />
                            <AvatarFallback>{getMemberInitial(leader.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                            <p className="font-semibold text-xs leading-none">{leader.name}</p>
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Mic className="w-3 h-3"/>Dirigente</span>
                            </div>
                        </div>
                        )}
                        {preacher && (
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6" data-ai-hint="person portrait">
                            <AvatarImage src={convertGoogleDriveUrl(preacher.avatar)} alt={preacher.name} />
                            <AvatarFallback>{getMemberInitial(preacher.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                            <p className="font-semibold text-xs leading-none">{preacher.name}</p>
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><BookUser className="w-3 h-3"/>Pregador</span>
                            </div>
                        </div>
                        )}
                    </div>

                    {(teamMembers.length > 0 || playlistSongs.length > 0) && <Separator />}

                    {teamMembers.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-1 flex items-center gap-1.5 text-xs"><Tv className="w-3 h-3"/>Multimídia</h3>
                            <div className="space-y-1">
                                {teamMembers.map(member => (
                                    <div key={member.id} className="flex items-center gap-2 text-xs">
                                        <Avatar className="h-4 w-4" data-ai-hint="person portrait">
                                            <AvatarImage src={convertGoogleDriveUrl(member.avatar)} alt={member.name} />
                                            <AvatarFallback>{getMemberInitial(member.name)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-muted-foreground">{member.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {playlistSongs.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-1 flex items-center gap-1.5 text-xs"><ListMusic className="w-3 h-3"/>Repertório</h3>
                            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5 ml-1">
                                {playlistSongs.map(song => (
                                    <li key={song.id} className="truncate">{song.title}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    </CardContent>
                    <CardFooter className="p-2 flex gap-2">
                    <Button variant="outline" onClick={() => handleOpenViewer(schedule)} className="w-full h-8 text-xs" disabled={schedule.playlist.length === 0}>
                        <Eye className="mr-2 h-3 w-3" />
                        Visualizar
                    </Button>
                    {can('manage:playlists') && (
                        <Button onClick={() => handleOpenPlaylist(schedule)} className="w-full h-8 text-xs">
                            <ListMusic className="mr-2 h-3 w-3" />
                            Gerenciar
                        </Button>
                    )}
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

        {isPlaylistViewerOpen && selectedSchedule && (
            <PlaylistViewer
            schedule={selectedSchedule}
            songs={songs}
            onOpenChange={() => { setIsPlaylistViewerOpen(false); setSelectedSchedule(null); }}
            />
        )}
        </TooltipProvider>
    </div>
  );
}
