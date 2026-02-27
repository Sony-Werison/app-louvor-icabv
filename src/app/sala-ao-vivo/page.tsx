
'use client';

import { Suspense, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSchedule } from '@/context/schedule-context';
import { useAuth } from '@/context/auth-context';
import { useLiveSession } from '@/hooks/use-live-session';
import type { LiveState, Schedule, Song } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChordDisplay } from '@/components/chord-display';
import { Badge } from '@/components/ui/badge';
import { cn, convertGoogleDriveUrl } from '@/lib/utils';
import { getTransposedKey } from '@/lib/transpose';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle as SheetTitleComponent, SheetDescription as SheetDescriptionComponent, SheetTrigger } from '@/components/ui/sheet';
import { FileText, Music, X, SkipBack, SkipForward, Rabbit, Turtle, ZoomIn, ZoomOut, Plus, Minus, Timer, Podcast, WifiOff, ArrowLeft, Play, Pause, FileDown, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MIN_FONT_SIZE = 0.8;
const MAX_FONT_SIZE = 2.5;
const FONT_STEP = 0.1;
const DEFAULT_FONT_SIZE = 1.25;
const MIN_SPEED = 1;
const MAX_SPEED = 10;
const MIN_BPM = 30;
const MAX_BPM = 300;


function LiveRoomComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const scheduleId = searchParams.get('scheduleId');

    const { monthlySchedules, songs, rehearsalPlaylist } = useSchedule();
    const { user, can } = useAuth();
    const { toast } = useToast();

    const isHost = can('manage:playlists');
    
    const { liveState, broadcastState, isConnected } = useLiveSession(scheduleId || '', isHost);
    
    const [hostState, setHostState] = useState<LiveState>({
        scheduleId: scheduleId || '',
        hostId: user?.email || '',
        activeSongId: null,
        transpose: 0,
        scroll: { isScrolling: false, speed: 5 },
        metronome: { isPlaying: false, bpm: 120 },
        lastUpdate: Date.now(),
    });

    const [activeTab, setActiveTab] = useState<'lyrics' | 'chords' | 'pdfs'>('lyrics');
    const [activePdfIndex, setActivePdfIndex] = useState(0);
    const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const scrollViewportRef = useRef<HTMLDivElement>(null);
    const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const metronomeIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const currentState = isHost ? hostState : liveState;

    const transformedSchedule = useMemo(() => {
        if (!scheduleId) return null;

        if (scheduleId === 'rehearsal') {
            return {
                id: 'rehearsal',
                name: 'Ensaio do Ministério',
                date: new Date(),
                playlist: rehearsalPlaylist,
            } as Partial<Schedule>;
        }

        const idParts = scheduleId.split('-');
        const scheduleType = idParts[1];
        const monthlyId = idParts.slice(2).join('-');
        
        const monthlySchedule = monthlySchedules.find(ms => ms.id === monthlyId);
        if (!monthlySchedule) return null;

         return {
            id: scheduleId,
            name: scheduleType === 'manha' ? monthlySchedule.name_manha : monthlySchedule.name_noite,
            date: monthlySchedule.date,
            playlist: scheduleType === 'manha' ? monthlySchedule.playlist_manha : monthlySchedule.playlist_noite,
        } as Partial<Schedule>;
    }, [scheduleId, monthlySchedules, rehearsalPlaylist]);

    const songsInPlaylist = useMemo(() => 
        (transformedSchedule?.playlist || []).map(id => songs.find(s => s.id === id)).filter((s): s is Song => !!s)
    , [transformedSchedule, songs]);

    const activeSong = useMemo(() => 
        songsInPlaylist.find(s => s.id === currentState?.activeSongId)
    , [songsInPlaylist, currentState]);
    
    const activeSongIndex = useMemo(() => 
        songsInPlaylist.findIndex(s => s.id === currentState?.activeSongId)
    , [songsInPlaylist, currentState]);

    useEffect(() => {
        if (isHost) {
            broadcastState(hostState);
        }
    }, [hostState, isHost, broadcastState]);

    useEffect(() => {
        if (isHost && songsInPlaylist.length > 0 && !hostState.activeSongId) {
             setHostState(prev => ({ ...prev, activeSongId: songsInPlaylist[0].id }));
        }
    }, [isHost, songsInPlaylist, hostState.activeSongId]);
    
    const stopScrolling = useCallback(() => {
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }
        if (isHost) {
            setHostState(prev => ({...prev, scroll: {...prev.scroll, isScrolling: false}}));
        }
    }, [isHost]);
    
    const startScrolling = useCallback((speed: number) => {
        if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
        if (!scrollViewportRef.current) return;
        
        const maxScroll = scrollViewportRef.current.scrollHeight - scrollViewportRef.current.clientHeight;
        if (scrollViewportRef.current.scrollTop >= maxScroll) {
            scrollViewportRef.current.scrollTop = 0;
        }

        const interval = 151 - (speed * 13);
        scrollIntervalRef.current = setInterval(() => {
            if (scrollViewportRef.current) {
                const currentMaxScroll = scrollViewportRef.current.scrollHeight - scrollViewportRef.current.clientHeight;
                if (scrollViewportRef.current.scrollTop < currentMaxScroll) {
                    scrollViewportRef.current.scrollTop += 1;
                } else {
                    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
                     if (isHost) {
                        setHostState(prev => ({...prev, scroll: {...prev.scroll, isScrolling: false}}));
                    }
                }
            }
        }, interval);
    }, [isHost]);


    useEffect(() => {
        if (currentState?.scroll.isScrolling) {
            startScrolling(currentState.scroll.speed);
        } else {
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current);
                scrollIntervalRef.current = null;
            }
        }
        return () => { if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current); };
    }, [currentState?.scroll.isScrolling, currentState?.scroll.speed, startScrolling]);

    const handleToggleScrolling = () => {
        if (!isHost) return;
        const newIsScrolling = !hostState.scroll.isScrolling;
        setHostState(prev => ({...prev, scroll: {...prev.scroll, isScrolling: newIsScrolling }}));
    };

    const changeSpeed = (delta: number) => {
        if (!isHost) return;
        setHostState(prev => {
            const newSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, prev.scroll.speed + delta));
            return {...prev, scroll: {...prev.scroll, speed: newSpeed}};
        });
    }
    
    const playClick = useCallback(() => {
        if (typeof window.AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') return;
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const context = audioContextRef.current;
        const osc = context.createOscillator();
        osc.frequency.value = 880;
        osc.connect(context.destination);
        osc.start(context.currentTime);
        osc.stop(context.currentTime + 0.05);
    }, []);

    useEffect(() => {
        if (metronomeIntervalRef.current) {
            clearInterval(metronomeIntervalRef.current);
            metronomeIntervalRef.current = null;
        }
        if (currentState?.metronome.isPlaying) {
            playClick(); // Play first click immediately
            const interval = 60000 / currentState.metronome.bpm;
            metronomeIntervalRef.current = setInterval(playClick, interval);
        }
        return () => { if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current); };
    }, [currentState?.metronome.isPlaying, currentState?.metronome.bpm, playClick]);


    const handleToggleMetronome = () => {
        if (!isHost) return;
        const newIsPlaying = !hostState.metronome.isPlaying;
        setHostState(prev => ({ ...prev, metronome: { ...prev.metronome, isPlaying: newIsPlaying, bpm: activeSong?.bpm || prev.metronome.bpm } }));
    };

    const changeMetronomeBpm = (delta: number) => {
        if (!isHost) return;
        setHostState(prev => {
            const newBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, prev.metronome.bpm + delta));
            return { ...prev, metronome: { ...prev.metronome, bpm: newBpm }};
        });
    };

    const changeTranspose = (delta: number) => {
        if (!isHost) return;
        setHostState(prev => ({ ...prev, transpose: prev.transpose + delta }));
    };

    const handleSelectSong = (songId: string) => {
        if (isHost) {
            setHostState(prev => ({ 
                ...prev, 
                activeSongId: songId, 
                transpose: 0, 
                scroll: {...prev.scroll, isScrolling: false},
                metronome: {...prev.metronome, isPlaying: false, bpm: songs.find(s=>s.id === songId)?.bpm || 120}
            }));
        }
        setIsSheetOpen(false);
        setActivePdfIndex(0);
    }
    
    const navigateSong = (direction: 'next' | 'prev') => {
        if (!isHost) return;
        const newIndex = direction === 'next' ? activeSongIndex + 1 : activeSongIndex - 1;
        if (newIndex >= 0 && newIndex < songsInPlaylist.length) {
            handleSelectSong(songsInPlaylist[newIndex].id);
        }
    }
    
    useEffect(() => {
        return () => {
            if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
            if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
        };
    }, []);

    useEffect(() => {
        if (scrollViewportRef.current) {
            scrollViewportRef.current.scrollTop = 0;
        }
    }, [currentState?.activeSongId, currentState?.transpose]);


    if (!scheduleId || !transformedSchedule) {
        return <div className="p-4 text-center">ID da escala não encontrado ou escala inválida.</div>;
    }
    
    if (!isConnected) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center text-muted-foreground bg-background">
                <WifiOff className="h-16 w-16 mb-4"/>
                <h2 className="text-xl font-bold">Conectando à sala ao vivo...</h2>
                <p className="text-sm">Aguarde ou verifique sua conexão.</p>
                <Button variant="outline" className="mt-6" onClick={() => router.back()}><ArrowLeft className="mr-2"/>Voltar</Button>
            </div>
        );
    }

    if (!isHost && !liveState) {
         return (
            <div className="flex h-screen w-full flex-col items-center justify-center text-muted-foreground bg-background">
                <Podcast className="h-16 w-16 mb-4 animate-pulse"/>
                <h2 className="text-xl font-bold">Aguardando o Host...</h2>
                <p className="text-sm">A sessão começará em breve.</p>
                <Button variant="outline" className="mt-6" onClick={() => router.back()}><ArrowLeft className="mr-2"/>Voltar</Button>
            </div>
        );
    }

    const transposedKey = activeSong ? getTransposedKey(activeSong.key, currentState?.transpose || 0) : null;
    const zoomPercentage = Math.round((fontSize / DEFAULT_FONT_SIZE) * 100);
    const readOnly = !isHost;
    
    return (
      <div className="max-w-none w-full h-screen p-0 gap-0 flex flex-col bg-background" style={{'--header-height': '7.5rem'} as any}>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
             <header className="flex-shrink-0 bg-background/95 backdrop-blur-sm z-20 border-b">
                 <div className="h-full flex flex-col sm:flex-row items-center justify-between px-2 sm:px-4 gap-2 py-2" style={{height: 'var(--header-height)'}}>
                     <div className="flex items-center gap-2 flex-1 min-w-0 w-full overflow-x-auto pb-1 sm:pb-0">
                         <SheetTrigger asChild>
                             <Button variant="destructive" size="sm" className="shrink-0">
                                 Ver Todas
                             </Button>
                         </SheetTrigger>
                         <div className="flex flex-col flex-1 min-w-0">
                           <h1 className="font-headline font-bold text-base sm:text-lg truncate leading-tight">{activeSong?.title || 'Sala ao Vivo'}</h1>
                           <div className="flex items-center gap-2">
                               {activeSong?.key && activeTab === 'chords' && <Badge variant="secondary" className="text-xs">{activeSong.key}</Badge>}
                               {transposedKey && transposedKey !== activeSong?.key && activeTab === 'chords' && <Badge className="text-xs">{transposedKey}</Badge>}
                           </div>
                         </div>
                     </div>
                     <div className="w-full sm:w-auto flex justify-between sm:justify-end items-center gap-2">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="shrink-0">
                            <TabsList>
                                <TabsTrigger value="lyrics"><FileText /></TabsTrigger>
                                <TabsTrigger value="chords"><Music /></TabsTrigger>
                                <TabsTrigger value="pdfs" disabled={!activeSong?.pdfLinks || activeSong.pdfLinks.length === 0}><FileDown /></TabsTrigger>
                            </TabsList>
                        </Tabs>
                       
                       {activeTab === 'chords' && (
                           <div className="flex items-center gap-1 shrink-0">
                               <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeTranspose(-1)} disabled={readOnly}><Minus /></Button>
                               <div className="w-8 text-center"><span className="text-xs -mb-1 block text-muted-foreground">Tom</span><span className="font-bold text-sm">{currentState?.transpose > 0 ? `+${currentState?.transpose}`: currentState?.transpose}</span></div>
                               <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeTranspose(1)} disabled={readOnly}><Plus /></Button>
                           </div>
                       )}

                       <div className="flex items-center gap-1 shrink-0">
                           {activeTab !== 'pdfs' ? (
                               <>
                                   <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setFontSize(s => Math.max(MIN_FONT_SIZE, s - FONT_STEP))}><ZoomOut /></Button>
                                   <Button variant="ghost" onClick={() => setFontSize(DEFAULT_FONT_SIZE)} className="font-bold w-12 text-center text-sm tabular-nums h-8 px-1">{zoomPercentage}%</Button>
                                   <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setFontSize(s => Math.min(MAX_FONT_SIZE, s + FONT_STEP))}><ZoomIn /></Button>
                               </>
                           ) : (
                               activeSong?.pdfLinks && activeSong.pdfLinks.length > 1 && (
                                   <div className="flex items-center gap-1">
                                       {activeSong.pdfLinks.map((pdf, idx) => (
                                           <Button 
                                               key={idx} 
                                               variant={activePdfIndex === idx ? 'default' : 'outline'} 
                                               size="sm" 
                                               className="h-8 text-xs px-2"
                                               onClick={() => setActivePdfIndex(idx)}
                                           >
                                               {pdf.name}
                                           </Button>
                                       ))}
                                   </div>
                               )
                           )}
                       </div>
                       
                       <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0"><X/></Button>
                     </div>
                 </div>
             </header>

              <main className="flex-grow min-h-0 relative group/main h-[calc(100vh-var(--header-height))]">
                  {activeTab === 'pdfs' && activeSong?.pdfLinks?.[activePdfIndex] ? (
                      <div className="w-full h-full flex flex-col items-center bg-muted/20">
                          <div className="w-full flex justify-end p-2 gap-2">
                              <Button variant="secondary" size="sm" asChild>
                                  <a href={activeSong.pdfLinks[activePdfIndex].url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-4 w-4 mr-2"/>
                                      Abrir no Drive
                                  </a>
                              </Button>
                          </div>
                          <iframe 
                              src={convertGoogleDriveUrl(activeSong.pdfLinks[activePdfIndex].url)} 
                              className="w-full h-full border-none flex-grow"
                              allow="autoplay"
                          />
                      </div>
                  ) : (
                      <ScrollArea className="h-full" viewportRef={scrollViewportRef}>
                          {activeSong ? (
                              <div className="p-4 sm:p-8 pb-32" style={{ fontSize: `${fontSize}rem` }}>
                                  {activeTab === 'lyrics' ? (
                                      <pre className="whitespace-pre-wrap font-body" style={{lineHeight: '1.75'}}>{activeSong.lyrics || 'Nenhuma letra.'}</pre>
                                  ) : (
                                      <ChordDisplay chordsText={activeSong.chords || 'Nenhuma cifra.'} transposeBy={currentState?.transpose || 0}/>
                                  )}
                              </div>
                          ) : (
                               <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                                  <h3 className="text-lg font-semibold">Nenhuma música no repertório</h3>
                              </div>
                          )}
                      </ScrollArea>
                  )}

                  {activeSong && (
                    <>
                        <div className="absolute bottom-4 left-4 z-10">
                             <Button variant="destructive" size="icon" className="h-12 w-12 rounded-full" onClick={() => navigateSong('prev')} disabled={readOnly || activeSongIndex <= 0}>
                                <SkipBack className="fill-current"/>
                             </Button>
                        </div>

                        {activeTab === 'chords' && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-end justify-center gap-2 rounded-full border bg-background/80 px-4 py-2 shadow-lg backdrop-blur-sm">
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => changeSpeed(-1)} disabled={readOnly || currentState?.scroll.speed <= MIN_SPEED}><Turtle /></Button>
                                    <div className="flex flex-col items-center">
                                        <button onClick={handleToggleScrolling} disabled={readOnly} className={cn("w-10 h-10 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-ring", currentState?.scroll.isScrolling && "bg-primary text-primary-foreground")}>
                                            {currentState?.scroll.isScrolling ? <Pause className="fill-current w-6 h-6" /> : <Play className="fill-current w-6 h-6" />}
                                        </button>
                                        <span className="text-xs font-bold w-6 h-6 flex items-center justify-center mt-1 rounded-full bg-muted/50">{currentState?.scroll.speed}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => changeSpeed(1)} disabled={readOnly || currentState?.scroll.speed >= MAX_SPEED}><Rabbit /></Button>
                                </div>
                                
                                <Separator orientation="vertical" className="h-12"/>

                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => changeMetronomeBpm(-5)} disabled={readOnly || currentState?.metronome.bpm <= MIN_BPM}><Minus /></Button>
                                    <div className="flex flex-col items-center">
                                        <button onClick={handleToggleMetronome} disabled={readOnly} className={cn("w-10 h-10 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-ring", currentState?.metronome.isPlaying && "bg-primary text-primary-foreground")}>
                                            <Timer className="w-6 h-6" />
                                        </button>
                                        <span className="text-xs font-bold w-12 h-6 flex items-center justify-center mt-1 rounded-full bg-muted/50 tabular-nums">{currentState?.metronome.bpm}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => changeMetronomeBpm(5)} disabled={readOnly || currentState?.metronome.bpm >= MAX_BPM}><Plus /></Button>
                                </div>
                            </div>
                        )}

                        <div className="absolute bottom-4 right-4 z-10">
                            <Button variant="destructive" size="icon" className="h-12 w-12 rounded-full" onClick={() => navigateSong('next')} disabled={readOnly || activeSongIndex >= songsInPlaylist.length - 1}>
                                <SkipForward className="fill-current"/>
                            </Button>
                        </div>
                    </>
                  )}
              </main>
              
              <SheetContent side="left" className="p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                    <SheetTitleComponent>Repertório - {transformedSchedule.name}</SheetTitleComponent>
                    <SheetDescriptionComponent>Selecione uma música para {isHost ? 'controlar' : 'visualizar'}.</SheetDescriptionComponent>
                </SheetHeader>
                <ScrollArea className="flex-grow">
                    <div className="p-2 space-y-1">
                        {songsInPlaylist.map((s, index) => (
                        <Button key={s.id} variant={currentState?.activeSongId === s.id ? "secondary" : "ghost"} className="w-full justify-start h-auto py-2 px-3 text-left" onClick={() => handleSelectSong(s.id)} disabled={readOnly}>
                            <div className="flex items-center gap-3"><span className="text-sm font-bold text-muted-foreground w-4">{index + 1}</span><div className="truncate">{s.title}</div></div>
                        </Button>
                        ))}
                    </div>
                </ScrollArea>
              </SheetContent>
          </Sheet>
      </div>
    );
}

export default function LiveRoomPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center text-muted-foreground">Carregando sala ao vivo...</div>}>
            <LiveRoomComponent />
        </Suspense>
    );
}
