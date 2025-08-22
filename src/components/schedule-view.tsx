
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Schedule, Member, Song } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlaylistDialog } from '@/components/playlist-dialog';
import { PlaylistViewer } from '@/components/playlist-viewer';
import { ListMusic, Users, Mic, BookUser, Tv, Eye, Sun, Moon, Download, Loader2, Share2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useSchedule } from '@/context/schedule-context';
import { Separator } from './ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import * as htmlToImage from 'html-to-image';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { createPortal } from 'react-dom';

interface ScheduleViewProps {
  initialSchedules: Schedule[];
  members: Member[];
  songs: Song[];
}

const getScheduleIcon = (scheduleName: string) => {
    const lowerCaseName = scheduleName.toLowerCase();
    if (lowerCaseName.includes('manhã')) {
        return <Sun className="w-5 h-5 text-amber-500"/>;
    }
    if (lowerCaseName.includes('noite')) {
        return <Moon className="w-5 h-5 text-blue-400"/>;
    }
    return null;
};

const getMemberById = (members: Member[], id: string | null) => id ? members.find(m => m.id === id) : null;
const getSongById = (songs: Song[], id: string) => songs.find(s => s.id === id);
const getMemberInitial = (name: string) => name.charAt(0).toUpperCase();


const imageToDataURL = async (url: string) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error converting image to data URL:', error);
        return url; // fallback to original url
    }
};


// Componente para o layout do PNG
const ExportableCard = React.forwardRef<HTMLDivElement, { schedule: Schedule, members: Member[], songs: Song[], onReady: () => void }>(({ schedule, members, songs, onReady }, ref) => {
    const [embeddedMembers, setEmbeddedMembers] = useState<Member[]>([]);

    useEffect(() => {
        let isCancelled = false;
        
        const convertImages = async () => {
            const updatedMembers = await Promise.all(
                members.map(async member => {
                    if (member.avatar && !member.avatar.startsWith('data:')) {
                        const dataUrl = await imageToDataURL(member.avatar);
                        return { ...member, avatar: dataUrl };
                    }
                    return member;
                })
            );
            if (!isCancelled) {
              setEmbeddedMembers(updatedMembers);
              onReady();
            }
        };
        
        convertImages();

        return () => {
            isCancelled = true;
        }
    }, [members, onReady]);

    const leader = getMemberById(embeddedMembers, schedule.leaderId);
    const preacher = getMemberById(embeddedMembers, schedule.preacherId);
    const playlistSongs = schedule.playlist.map(id => getSongById(songs, id)).filter((s): s is Song => !!s);
    const teamMembers = (schedule.team?.multimedia || [])
        .map(id => getMemberById(embeddedMembers, id))
        .filter((m): m is Member => !!m);

    if (embeddedMembers.length === 0) {
        return <div ref={ref} />;
    }

  return (
    <div ref={ref} className="w-[380px] bg-card text-card-foreground p-4 flex flex-col gap-3 rounded-lg border">
        <header>
            <div className="flex items-center gap-2">
                {getScheduleIcon(schedule.name)}
                <h1 className="font-headline font-bold text-lg capitalize">{schedule.name}</h1>
            </div>
            <p className="text-sm text-muted-foreground capitalize ml-7">
                {format(schedule.date, 'dd MMMM yyyy', { locale: ptBR })}
            </p>
        </header>

        <div className="space-y-2">
            {leader && (
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8" data-ai-hint="person portrait">
                <AvatarImage src={leader.avatar} alt={leader.name} />
                <AvatarFallback>{getMemberInitial(leader.name)}</AvatarFallback>
                </Avatar>
                <div>
                <p className="font-semibold text-sm leading-none">{leader.name}</p>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Mic className="w-3 h-3"/>Abertura</span>
                </div>
            </div>
            )}
            {preacher && (
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8" data-ai-hint="person portrait">
                <AvatarImage src={preacher.avatar} alt={preacher.name} />
                <AvatarFallback>{getMemberInitial(preacher.name)}</AvatarFallback>
                </Avatar>
                <div>
                <p className="font-semibold text-sm leading-none">{preacher.name}</p>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><BookUser className="w-3 h-3"/>Pregador</span>
                </div>
            </div>
            )}
        </div>

        {(teamMembers.length > 0 || playlistSongs.length > 0) && <Separator />}

        {teamMembers.length > 0 && (
            <div>
                <h3 className="font-semibold mb-2 flex items-center gap-1.5 text-sm"><Tv className="w-4 h-4"/>Multimídia</h3>
                <div className="space-y-1.5 pl-1">
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

        {playlistSongs.length > 0 && (
            <div>
                <h3 className="font-semibold mb-2 flex items-center gap-1.5 text-sm"><ListMusic className="w-4 h-4"/>Repertório</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-1">
                    {playlistSongs.map(song => (
                        <li key={song.id} className="truncate">{song.title}</li>
                    ))}
                </ul>
            </div>
        )}
    </div>
  );
});
ExportableCard.displayName = 'ExportableCard';


export function ScheduleView({ initialSchedules, members, songs }: ScheduleViewProps) {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = useState(false);
  const [isPlaylistViewerOpen, setIsPlaylistViewerOpen] = useState(false);
  const { updateSchedulePlaylist, shareMessage } = useSchedule();
  const { can } = useAuth();
  const { toast } = useToast();
  const [canShare, setCanShare] = useState(false);
  const isMobile = useIsMobile();

  const [exportingSchedule, setExportingSchedule] = useState<Schedule | null>(null);
  
  useEffect(() => {
    setSchedules(initialSchedules);
  }, [initialSchedules]);

  useEffect(() => {
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([], '')] })) {
      setCanShare(true);
    }
  }, []);

  const generateImage = useCallback(async (schedule: Schedule) => {
    return new Promise<string>((resolve) => {
      setExportingSchedule(schedule);
      
      const onReady = () => {
        const node = document.getElementById(`export-node-${schedule.id}`);
        if (node) {
          htmlToImage.toPng(node, {
            quality: 1,
            pixelRatio: 2,
            backgroundColor: 'hsl(var(--card))',
            skipFonts: true,
          }).then((dataUrl) => {
            setExportingSchedule(null);
            resolve(dataUrl);
          }).catch((error) => {
             console.error('oops, something went wrong!', error);
             toast({ title: 'Erro na Exportação', description: 'Não foi possível gerar a imagem.', variant: 'destructive'});
             setExportingSchedule(null);
          });
        }
      };

      const portalElement = document.createElement('div');
      document.body.appendChild(portalElement);
      const portal = createPortal(
          <div id={`export-node-${schedule.id}`} className="fixed top-0 left-0 -z-50 opacity-0 dark">
              <ExportableCard schedule={schedule} members={members} songs={songs} onReady={onReady} />
          </div>,
          portalElement
      );
      // We render portal manually to have control over the lifecycle
      // This is a bit of a hack, but it's the cleanest way to handle this async process
      const { unmount } = require('react-dom');
      unmount(portalElement);
      require('react-dom').render(portal, portalElement);
    });
  }, [members, songs, toast]);


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

  const handleExport = useCallback(async (schedule: Schedule) => {
    toast({ title: 'Preparando exportação...', description: 'Aguarde enquanto a imagem é gerada.' });
    try {
        const dataUrl = await generateImage(schedule);
        const link = document.createElement('a');
        link.download = `repertorio_${schedule.name.replace(/\s+/g, '_').toLowerCase()}.png`;
        link.href = dataUrl;
        link.click();
        toast({ title: 'Exportação Concluída!', description: 'A imagem do repertório foi baixada.' });
    } catch (error) {
        // Error toast is handled inside generateImage
    }
  }, [toast, generateImage]);
  
  const handleShare = useCallback(async (schedule: Schedule) => {
    toast({ title: 'Preparando imagem...', description: 'Aguarde um instante.'});

    try {
        const dataUrl = await generateImage(schedule);
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'repertorio.png', { type: 'image/png' });

        const text = shareMessage
            .replace(/\[PERIODO\]/g, schedule.name)
            .replace(/\[DATA\]/g, format(schedule.date, 'dd/MM/yyyy', { locale: ptBR }));

        await navigator.share({
            title: `Repertório - ${schedule.name}`,
            text,
            files: [file],
        });
    } catch (error: any) {
        if (error.name === 'AbortError') {
          return;
        }
        console.error('Share failed:', error);
        toast({ title: 'Falha no Compartilhamento', description: 'Não foi possível compartilhar a imagem.', variant: 'destructive'});
    }
  }, [toast, shareMessage, generateImage, ptBR]);
  

  return (
    <>
    <div className="space-y-6">
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
                const leader = getMemberById(members, schedule.leaderId);
                const preacher = getMemberById(members, schedule.preacherId);
                const playlistSongs = schedule.playlist.map(id => getSongById(songs, id)).filter((s): s is Song => !!s);
                const teamMembers = (schedule.team?.multimedia || [])
                .map(id => getMemberById(members, id))
                .filter((m): m is Member => !!m);
                
                const isCurrentlyExporting = exportingSchedule?.id === schedule.id;

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
                            <Avatar className="h-6 w-6" data-ai-hint="person portrait">
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
                                        <Avatar className="h-4 w-4" data-ai-hint="person portrait">
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
                                    <li key={song.id} className="truncate">{song.title}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    </CardContent>
                    <CardFooter className="p-2 flex flex-col gap-2">
                        <div className='flex gap-2 w-full'>
                            <Button variant="outline" onClick={() => handleOpenViewer(schedule)} className="h-8 text-xs flex-1">
                                <Eye />
                                Visualizar
                            </Button>

                            {canShare && isMobile && (
                                <Button variant="outline" onClick={() => handleShare(schedule)} className="h-8 text-xs flex-1" disabled={playlistSongs.length === 0 || !!exportingSchedule}>
                                    {isCurrentlyExporting ? <Loader2 className="animate-spin" /> : <Share2 />}
                                    Compartilhar
                                </Button>
                            )}
                            {!isMobile && (
                                <Button variant="outline" onClick={() => handleExport(schedule)} className="h-8 text-xs flex-1" disabled={playlistSongs.length === 0 || !!exportingSchedule}>
                                    {isCurrentlyExporting ? <Loader2 className="animate-spin" /> : <Download />}
                                    Exportar PNG
                                </Button>
                            )}
                        </div>
                        {can('manage:playlists') && (
                            <Button onClick={() => handleOpenPlaylist(schedule)} variant="destructive" className="h-8 text-xs w-full">
                                <ListMusic/>
                                Gerenciar Repertório
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
    </>
  );
}
