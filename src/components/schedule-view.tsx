'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { Schedule, Member, Song } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlaylistDialog } from '@/components/playlist-dialog';
import { PlaylistViewer } from '@/components/playlist-viewer';
import { ListMusic, Users, Mic, BookUser, Tv, Eye, Sun, Moon, Download, Loader2, AlertTriangle, Share2, Podcast, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useSchedule } from '@/context/schedule-context';
import { Separator } from './ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { supabase } from '@/lib/supabase-client';
import { ArrangedSwaps } from './arranged-swaps';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';


interface ScheduleViewProps {
  initialSchedules: Schedule[];
  members: Member[];
  songs: Song[];
  repeatedSongIds: Set<string>;
  onScheduleUpdate: (scheduleId: string, updates: Partial<Schedule>) => void;
}

const getScheduleIcon = (schedule: Schedule) => {
    if (schedule.id.includes('manha')) {
        return <Sun className="w-5 h-5 text-amber-500"/>;
    }
    if (schedule.id.includes('noite')) {
        return <Moon className="w-5 h-5 text-blue-400"/>;
    }
    return null;
};

const getMemberById = (members: Member[], id: string | null) => id ? (id.startsWith('guest:') ? { id, name: id.slice(6), roles: [] } as Member : members.find(m => m.id === id)) : null;
const getSongById = (songs: Song[], id:string) => songs.find(s => s.id === id);
const getMemberInitial = (name: string) => name.charAt(0).toUpperCase();


const EditableTitle = ({ schedule, canEdit, onUpdate }: { schedule: Schedule, canEdit: boolean, onUpdate: (scheduleId: string, updates: Partial<Schedule>) => void}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(schedule.name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setName(schedule.name);
    }, [schedule.name]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);
    
    const handleBlur = () => {
        setIsEditing(false);
        if (name !== schedule.name) {
            onUpdate(schedule.id, { name });
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            setName(schedule.name);
            setIsEditing(false);
        }
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                {getScheduleIcon(schedule)}
                <Input 
                    ref={inputRef}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="h-8 text-base font-bold"
                />
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2">
            {getScheduleIcon(schedule)}
            <CardTitle 
                className={cn("font-headline font-bold text-base capitalize", canEdit && "cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1 -ml-2")}
                onClick={() => canEdit && setIsEditing(true)}
            >
                {schedule.name}
            </CardTitle>
        </div>
    )
}


export function ScheduleView({ initialSchedules, members, songs, repeatedSongIds, onScheduleUpdate }: ScheduleViewProps) {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = useState(false);
  const [isPlaylistViewerOpen, setIsPlaylistViewerOpen] = useState(false);
  const [requestingSwap, setRequestingSwap] = useState<string | null>(null);
  const [arrangedSource, setArrangedSource] = useState<Schedule | null>(null);
  const { updateSchedulePlaylist } = useSchedule();
  const { can, canManagePlaylist, account } = useAuth();
  const { toast } = useToast();

  
  useEffect(() => {
    setSchedules(initialSchedules);
  }, [initialSchedules]);


  const handlePlaylistSave = async (scheduleId: string, newPlaylist: string[]) => {
    await updateSchedulePlaylist(scheduleId, newPlaylist);
    setSchedules(previous => previous.map(item => item.id === scheduleId ? { ...item, playlist: newPlaylist } : item));
    setIsPlaylistDialogOpen(false);
    setSelectedSchedule(null);
  };
  
  const handleOpenPlaylist = (scheduleToOpen: Schedule) => {
    if (!scheduleToOpen.leaderId) {
        toast({
            title: "Líder não atribuído",
            description: "Atribua um líder na Escala Mensal para gerenciar o repertório.",
            variant: "destructive"
        });
        return;
    }
    setSelectedSchedule(scheduleToOpen);
    setIsPlaylistDialogOpen(true);
  }

  const handleOpenViewer = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsPlaylistViewerOpen(true);
  }

  const handleTitleUpdate = (scheduleId: string, updates: Partial<Schedule>) => {
    setSchedules(prev => prev.map(s => s.id === scheduleId ? {...s, ...updates} : s));
    onScheduleUpdate(scheduleId, updates);
  }



  return (
    <>
    <div className="space-y-6">
        <TooltipProvider>
        {schedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground bg-card border rounded-lg p-8 sm:p-12 h-[calc(100vh-10rem)]">
                <Users className="w-12 h-12 sm:w-16 sm:w-16 mb-4" />
                <h2 className="text-xl sm:text-2xl font-bold mb-2">Nenhuma reunião esta semana</h2>
                <p className="text-sm sm:text-base">Vá para a página "Escala Mensal" para planejar.</p>
            </div>
         ) :
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl">
            {schedules.map((schedule) => {
                const leader = getMemberById(members, schedule.leaderId);
                const preacher = getMemberById(members, schedule.preacherId);
                const playlistSongs = (schedule.playlist || []).map(id => getSongById(songs, id)).filter((s): s is Song => !!s);
                const teamMembers = (schedule.team?.multimedia || [])
                .map(id => getMemberById(members, id))
                .filter((m): m is Member => !!m);
                
                const hasPlaylist = playlistSongs.length > 0;
                const canManagePlaylists = canManagePlaylist(schedule.leaderId);
                const isMySchedule = !!account?.member_id && account.member_id === schedule.leaderId;
                const canEditSchedule = can('edit:schedule');

                return (
                <Card key={schedule.id} id={`schedule-card-${schedule.id}`} className="flex flex-col relative bg-card text-card-foreground">
                    <style>{'.capturing .schedule-card-footer { display: none !important; }'}</style>
                    <CardHeader className="p-3">
                    <div className="flex justify-between items-start">
                        <div>
                           <EditableTitle schedule={schedule} canEdit={canEditSchedule} onUpdate={handleTitleUpdate} />
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
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={leader.avatar} alt={leader.name} />
                              <AvatarFallback>{getMemberInitial(leader.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                            <p className="font-semibold text-xs leading-none">{leader.name}</p>
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Mic className="w-3 h-3"/>Abertura</span>
                            </div>
                        </div>
                        )}
                        {preacher && (
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={preacher.avatar} alt={preacher.name} />
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
                                        <Avatar className="h-4 w-4">
                                            <AvatarImage src={member.avatar} alt={member.name} />
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
                                    <li key={song.id} className="truncate flex items-center gap-1.5">
                                      {repeatedSongIds.has(song.id) && (
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500"/>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Música repetida no mesmo dia.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                      )}
                                      <span className="truncate">{song.title}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    </CardContent>
                    <CardFooter className="p-2 schedule-card-footer">
                        <div className="flex flex-col gap-2 w-full">
                            <div className="flex gap-2">
                                {hasPlaylist && <Button variant="outline" onClick={() => handleOpenViewer(schedule)} className="h-8 text-xs w-full">
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver
                                </Button>}
                            </div>
                            {canManagePlaylists && (
                                <Button onClick={() => handleOpenPlaylist(schedule)} className="w-full h-8 text-xs">
                                    <ListMusic className="w-4 h-4 mr-2" />
                                    Gerenciar Repertório
                                </Button>
                            )}
                            {isMySchedule && <Button variant="outline" className="w-full h-8 text-xs" onClick={() => setArrangedSource(schedule)}>Combinar troca de reunião</Button>}
                            {isMySchedule && <Button variant="outline" disabled={requestingSwap === schedule.id} onClick={async () => {
                                if (!supabase) return;
                                setRequestingSwap(schedule.id);
                                try {
                                    const [, period, ...id] = schedule.id.split('-');
                                    const { error } = await supabase.rpc('request_schedule_swap', { p_schedule_id: id.join('-'), p_column: `abertura_${period}`, p_slot: 0 });
                                    if (error) throw error;
                                    toast({ title: 'Pedido de substituição enviado', description: `${schedule.name} — ${format(schedule.date, 'dd/MM/yyyy')}` });
                                } catch { toast({ title: 'Não foi possível pedir substituição', description: 'Confira se já existe um pedido aberto para esta atribuição.', variant: 'destructive' }); }
                                finally { setRequestingSwap(null); }
                            }} className="w-full h-8 text-xs">{requestingSwap === schedule.id ? 'Enviando...' : 'Pedir substituição'}</Button>}
                        </div>
                    </CardFooter>
                </Card>
                );
            })}
            </div>
        }
        </TooltipProvider>
    </div>

    <Dialog open={!!arrangedSource} onOpenChange={open => { if (!open) setArrangedSource(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto overflow-x-hidden"><DialogHeader><DialogTitle>Combinar troca</DialogTitle><DialogDescription>Escolha a reunião para propor uma troca com confirmação.</DialogDescription></DialogHeader>{arrangedSource && <ArrangedSwaps key={arrangedSource.id} source={{scheduleId:arrangedSource.id.split('-').slice(2).join('-'),column:`abertura_${arrangedSource.id.split('-')[1]}`,slot:0}} />}</DialogContent></Dialog>
    {isPlaylistDialogOpen && selectedSchedule && (
        <PlaylistDialog 
            schedule={selectedSchedule}
            allSongs={songs}
            onSave={handlePlaylistSave}
            onOpenChange={(open) => {
                if (!open) {
                    setIsPlaylistDialogOpen(false);
                    setSelectedSchedule(null);
                }
            }}
            repeatedSongIds={repeatedSongIds}
        />
    )}
     {isPlaylistViewerOpen && selectedSchedule && (
        <PlaylistViewer 
            schedule={selectedSchedule}
            songs={songs}
            onOpenChange={(open) => {
                if (!open) {
                    setIsPlaylistViewerOpen(false);
                    setSelectedSchedule(null);
                }
            }}
        />
     )}
    </>
  );
}
