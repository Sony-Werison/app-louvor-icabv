
'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import type { LiveState, Song } from '@/types';
import { useAuth } from '@/context/auth-context';
import { useSchedule } from '@/context/schedule-context';
import { fetchLiveState, saveLiveState } from '@/lib/blob-storage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ChordDisplay } from '@/components/chord-display';
import { getTransposedKey } from '@/lib/transpose';
import { cn } from '@/lib/utils';
import {
  ListMusic, Play, Pause, FileText, Music, X, SkipBack, SkipForward,
  Rabbit, Turtle, ZoomIn, ZoomOut, Plus, Minus, Power, PowerOff, RotateCcw,
  Volume2, VolumeX
} from 'lucide-react';

const MIN_FONT_SIZE = 0.8;
const MAX_FONT_SIZE = 2.5;
const FONT_STEP = 0.1;
const DEFAULT_FONT_SIZE = 1.25;
const MIN_SPEED = 1;
const MAX_SPEED = 10;
const MIN_BPM = 40;
const MAX_BPM = 220;

const LiveRoomPageComponent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { can, userId, isLoading: isAuthLoading } = useAuth();
    const { songs, monthlySchedules } = useSchedule();
    const { data: liveState, mutate, error } = useSWR<LiveState | null>('liveState', fetchLiveState, { refreshInterval: 1000 });

    const [isHost, setIsHost] = useState(false);
    const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
    
    // Local state for client-side effects
    const [isScrolling, setIsScrolling] = useState(false);
    const [isMetronomePlaying, setIsMetronomePlaying] = useState(false);
    
    const scrollViewportRef = useRef<HTMLDivElement>(null);
    const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const metronomeAudioContext = useRef<AudioContext | null>(null);
    const metronomeIntervalRef = useRef<NodeJS.Timeout | null>(null);
    
    const scheduleId = searchParams.get('scheduleId');
    const scheduleTimestamp = scheduleId ? parseInt(scheduleId.split('-')[1], 10) : 0;
    const scheduleType = scheduleId?.includes('manha') ? 'manha' : 'noite';

    const schedule = monthlySchedules.find(s => s.date.getTime() === scheduleTimestamp);
    
    const activeSong = songs.find(s => s.id === liveState?.activeSongId);
    
    const playlistSongIds = schedule 
        ? (scheduleType === 'manha' ? schedule.playlist_manha : schedule.playlist_noite) || []
        : [];
    const playlistSongs = playlistSongIds.map(id => songs.find(s => s.id === id)).filter((s): s is Song => !!s);
    
    const activeSongIndex = playlistSongs.findIndex(s => s.id === liveState?.activeSongId);
    
    // Determine if current user is the host
    useEffect(() => {
        if (liveState && userId) {
            setIsHost(liveState.hostId === userId);
        }
    }, [liveState, userId]);

    // Permissions check
    useEffect(() => {
        if (!isAuthLoading && !can('start:live_room')) {
            router.replace('/');
        }
    }, [isAuthLoading, can, router]);

    // Initialize or join a session
    useEffect(() => {
        if (!scheduleId || isAuthLoading || !userId) return;

        const isSessionActive = liveState && liveState.scheduleId === scheduleId && (Date.now() - liveState.lastUpdate < 300000); // 5 min timeout
        
        if (!isSessionActive && userId) {
            // No active session for this schedule, start one if this user is the first.
            const newState: LiveState = {
                scheduleId: scheduleId,
                hostId: userId,
                activeSongId: playlistSongs[0]?.id || null,
                transpose: 0,
                scroll: { isScrolling: false, speed: 5 },
                metronome: { isPlaying: false, bpm: 120 },
                lastUpdate: Date.now(),
            };
            saveLiveState(newState).then(() => mutate(newState));
            setIsHost(true);
        }
    }, [scheduleId, liveState, isAuthLoading, userId, mutate, playlistSongs]);

    // Function to update state and push to server
    const updateState = async (updates: Partial<LiveState>) => {
        if (!isHost || !liveState) return;
        const newState = { ...liveState, ...updates, lastUpdate: Date.now() };
        await saveLiveState(newState);
        mutate(newState, false); // Optimistic update
    };
    
    // --- SCROLL LOGIC ---
    const stopScrolling = useCallback(() => {
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }
        setIsScrolling(false);
    }, []);

    const startScrolling = useCallback((speed: number) => {
        stopScrolling();
        if (!scrollViewportRef.current) return;

        setIsScrolling(true);
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
                    stopScrolling();
                }
            }
        }, interval);
    }, [stopScrolling]);

    useEffect(() => {
        if (liveState?.scroll.isScrolling) {
            startScrolling(liveState.scroll.speed);
        } else {
            stopScrolling();
        }
    }, [liveState?.scroll.isScrolling, liveState?.scroll.speed, startScrolling, stopScrolling]);

    // --- METRONOME LOGIC ---
    const stopMetronome = useCallback(() => {
        if (metronomeIntervalRef.current) {
            clearInterval(metronomeIntervalRef.current);
            metronomeIntervalRef.current = null;
        }
        setIsMetronomePlaying(false);
    }, []);

    const startMetronome = useCallback((bpm: number) => {
        stopMetronome();
        if (!metronomeAudioContext.current) {
            metronomeAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const context = metronomeAudioContext.current;
        const interval = 60000 / bpm;
        let beatCount = 0;

        const playTick = () => {
            if (!context) return;
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.connect(gain);
            gain.connect(context.destination);
            
            osc.frequency.value = (beatCount % 4 === 0) ? 880 : 440;
            gain.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.1);
            
            osc.start(context.currentTime);
            osc.stop(context.currentTime + 0.1);
            beatCount++;
        };

        metronomeIntervalRef.current = setInterval(playTick, interval);
        setIsMetronomePlaying(true);
    }, [stopMetronome]);

    useEffect(() => {
        if (liveState?.metronome.isPlaying) {
            startMetronome(liveState.metronome.bpm);
        } else {
            stopMetronome();
        }
        return stopMetronome;
    }, [liveState?.metronome.isPlaying, liveState?.metronome.bpm, startMetronome, stopMetronome]);


    // --- Host Controls ---
    const selectSong = (songId: string) => {
        const song = songs.find(s => s.id === songId);
        updateState({ 
            activeSongId: songId, 
            metronome: { isPlaying: false, bpm: song?.bpm || 120 },
            scroll: { isScrolling: false, speed: 5 }
        });
    };
    const navigateSong = (direction: 'next' | 'prev') => {
        const newIndex = direction === 'next' ? activeSongIndex + 1 : activeSongIndex - 1;
        if (newIndex >= 0 && newIndex < playlistSongs.length) {
            selectSong(playlistSongs[newIndex].id);
        }
    };
    const changeTranspose = (delta: number) => updateState({ transpose: (liveState?.transpose || 0) + delta });
    const toggleScrolling = () => updateState({ scroll: { ...liveState!.scroll, isScrolling: !liveState!.scroll.isScrolling }});
    const changeSpeed = (delta: number) => {
        const newSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, (liveState?.scroll.speed || 5) + delta));
        updateState({ scroll: { ...liveState!.scroll, speed: newSpeed }});
    };
    const toggleMetronome = () => updateState({ metronome: { ...liveState!.metronome, isPlaying: !liveState!.metronome.isPlaying }});
    const changeBpm = (delta: number) => {
        const newBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, (liveState?.metronome.bpm || 120) + delta));
        updateState({ metronome: { ...liveState!.metronome, bpm: newBpm }});
    };
    const resetBpm = () => updateState({ metronome: { ...liveState!.metronome, bpm: activeSong?.bpm || 120 }});


    if (!scheduleId || !liveState) {
        return <div className="flex h-screen items-center justify-center">Carregando sala...</div>;
    }

    const transposedKey = activeSong ? getTransposedKey(activeSong.key, liveState.transpose) : null;
    const zoomPercentage = Math.round((fontSize / DEFAULT_FONT_SIZE) * 100);

    return (
        <div className="h-screen flex flex-col" style={{ '--header-height': '6.5rem' } as React.CSSProperties}>
             <header className="flex-shrink-0 bg-background/95 backdrop-blur-sm z-20 border-b">
                 <div className="h-full flex flex-col sm:flex-row items-center justify-between px-2 sm:px-4 gap-2 py-2" style={{height: 'var(--header-height)'}}>
                     <div className="flex items-center gap-2 flex-1 min-w-0 w-full">
                        <Sheet>
                           <SheetTrigger asChild>
                               <Button variant="outline" size="sm">
                                   <ListMusic className="mr-2"/>
                                   Repertório
                               </Button>
                           </SheetTrigger>
                           <SheetContent side="left">
                               <SheetHeader>
                                   <SheetTitle>Repertório</SheetTitle>
                               </SheetHeader>
                               <ScrollArea className="h-[calc(100%-4rem)]">
                                   <div className="p-2 space-y-1">
                                       {playlistSongs.map((s) => (
                                           <Button
                                               key={`shortcut-${s.id}`}
                                               variant={liveState.activeSongId === s.id ? "secondary" : "ghost"}
                                               className="w-full justify-start h-auto py-2 px-3 text-left"
                                               onClick={() => selectSong(s.id)}
                                               disabled={!isHost}
                                           >
                                               <p className="truncate">{s.title}</p>
                                           </Button>
                                       ))}
                                   </div>
                               </ScrollArea>
                           </SheetContent>
                        </Sheet>
                        <div className="flex flex-col flex-1 min-w-0">
                            <h1 className="font-headline font-bold text-base sm:text-lg truncate">{activeSong?.title || 'Sala ao Vivo'}</h1>
                            <div className="flex items-center gap-2">
                                {activeSong?.key && <Badge variant="secondary" className="text-xs">{activeSong.key}</Badge>}
                                {liveState.transpose !== 0 && transposedKey && <Badge className="text-xs">{transposedKey}</Badge>}
                            </div>
                        </div>
                    </div>
                     <div className="w-full sm:w-auto flex justify-between sm:justify-end items-center gap-2">
                        {isHost && (
                             <Button variant="destructive" size="icon" onClick={() => router.push('/schedule')}>
                                 <PowerOff/>
                             </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => router.push('/schedule')}>
                             <X/>
                         </Button>
                     </div>
                 </div>
             </header>

            <main className="flex-grow min-h-0 relative group/main">
                 <ScrollArea className="h-full" viewportRef={scrollViewportRef}>
                     <div className="p-4 sm:p-8 pb-28" style={{ fontSize: `${fontSize}rem` }}>
                         {activeSong ? (
                             <ChordDisplay chordsText={activeSong.chords || 'Nenhuma cifra disponível.'} transposeBy={liveState.transpose}/>
                         ) : (
                             <div className="flex h-full items-center justify-center text-muted-foreground">Selecione uma música.</div>
                         )}
                     </div>
                 </ScrollArea>
                {/* Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 z-10 flex justify-between items-end">
                    {/* Left Controls */}
                     <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="h-12 w-12 rounded-full backdrop-blur-sm bg-background/50" onClick={() => navigateSong('prev')} disabled={!isHost || activeSongIndex === 0}>
                            <SkipBack className="h-7 w-7 fill-current"/>
                        </Button>
                    </div>

                    {/* Center Controls */}
                    <div className="flex flex-col items-center gap-2">
                        {/* Transpose */}
                        <div className="flex items-center gap-1 p-1 rounded-full border bg-background/80 backdrop-blur-sm">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeTranspose(-1)} disabled={!isHost}> <Minus/> </Button>
                            <div className="w-10 text-center">
                                <p className="text-xs text-muted-foreground -mb-1">Tom</p>
                                <p className="font-bold">{liveState.transpose > 0 ? `+${liveState.transpose}` : liveState.transpose}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeTranspose(1)} disabled={!isHost}> <Plus/> </Button>
                        </div>
                        {/* Metronome */}
                        <div className="flex items-center gap-1 p-1 rounded-full border bg-background/80 backdrop-blur-sm">
                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => changeBpm(-5)} disabled={!isHost}> <Minus/> </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleMetronome} disabled={!isHost}>
                                {isMetronomePlaying ? <Volume2 className="h-6 w-6 text-primary"/> : <VolumeX className="h-6 w-6"/>}
                            </Button>
                            <div className="w-12 text-center tabular-nums">
                                <p className="font-bold text-lg">{liveState.metronome.bpm}</p>
                                <p className="text-xs text-muted-foreground -mt-1">BPM</p>
                            </div>
                             <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleMetronome} disabled={!isHost}>
                                {isMetronomePlaying ? <Pause className="h-5 w-5"/> : <Play className="h-5 w-5"/>}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => changeBpm(5)} disabled={!isHost}> <Plus/> </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={resetBpm} disabled={!isHost}> <RotateCcw className="h-5 w-5"/> </Button>
                        </div>
                         {/* Scroll */}
                         <div className="flex items-center justify-center gap-2 rounded-full border bg-background/80 px-2 py-1 shadow-lg backdrop-blur-sm">
                             <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => changeSpeed(-1)} disabled={!isHost || liveState.scroll.speed <= MIN_SPEED}> <Turtle/> </Button>
                             <button onClick={toggleScrolling} disabled={!isHost} className="flex flex-col items-center p-1">
                                {isScrolling ? <Pause className="w-6 h-6 fill-current"/> : <Play className="w-6 h-6 fill-current" />}
                                <span className="text-xs font-bold w-6 h-6 flex items-center justify-center mt-1 rounded-full bg-muted/50">{liveState.scroll.speed}</span>
                             </button>
                             <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => changeSpeed(1)} disabled={!isHost || liveState.scroll.speed >= MAX_SPEED}> <Rabbit/> </Button>
                         </div>
                    </div>

                    {/* Right Controls */}
                    <div className="flex gap-2">
                         <Button variant="outline" size="icon" className="h-12 w-12 rounded-full backdrop-blur-sm bg-background/50" onClick={() => navigateSong('next')} disabled={!isHost || activeSongIndex === playlistSongs.length - 1}>
                             <SkipForward className="h-7 w-7 fill-current"/>
                         </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}


export default function LiveRoomPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Carregando...</div>}>
            <LiveRoomPageComponent />
        </Suspense>
    );
}
