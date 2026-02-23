'use client';

import type { Schedule, Song } from '@/types';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle as SheetTitleComponent,
  SheetDescription as SheetDescriptionComponent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { ListMusic, Play, Pause, FileText, Music, X, SkipBack, SkipForward, Rabbit, Turtle, ZoomIn, ZoomOut, Plus, Minus, Timer, Podcast, FileDown, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ChordDisplay } from './chord-display';
import { Badge } from './ui/badge';
import { cn, convertGoogleDriveUrl } from '@/lib/utils';
import { getTransposedKey } from '@/lib/transpose';
import { Separator } from './ui/separator';

interface PlaylistViewerProps {
  schedule: Schedule;
  songs: Song[];
  onOpenChange: (open: boolean) => void;
}

const MIN_FONT_SIZE = 0.8;
const MAX_FONT_SIZE = 2.5;
const FONT_STEP = 0.1;
const DEFAULT_FONT_SIZE = 1.25;
const MIN_SPEED = 1;
const MAX_SPEED = 10;
const MIN_BPM = 30;
const MAX_BPM = 300;

export function PlaylistViewer({ schedule, songs, onOpenChange }: PlaylistViewerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'lyrics' | 'chords' | 'pdfs'>('lyrics');
  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [activePdfIndex, setActivePdfIndex] = useState(0);
  const [transpose, setTranspose] = useState(0);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE); 

  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(5); 
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const songsInPlaylist = schedule.playlist.map(id => songs.find(s => s.id === id)).filter((s): s is Song => !!s);
  const activeSong = songsInPlaylist.find(s => s.id === activeSongId);
  const activeSongIndex = songsInPlaylist.findIndex(s => s.id === activeSongId);

  const [metronomeBpm, setMetronomeBpm] = useState(activeSong?.bpm || 120);
  const [isMetronomePlaying, setIsMetronomePlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const metronomeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (songsInPlaylist.length > 0 && !activeSongId) {
      setActiveSongId(songsInPlaylist[0].id);
    }
  }, [schedule.id, songsInPlaylist, activeSongId]);

  // --- Metronome Logic ---
   useEffect(() => {
    return () => {
      if (metronomeIntervalRef.current) {
        clearInterval(metronomeIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setMetronomeBpm(activeSong?.bpm || 120);
  }, [activeSong?.bpm]);

  const playClick = () => {
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
  };
  
  const handleToggleMetronome = () => {
    if (isMetronomePlaying) {
      if (metronomeIntervalRef.current) {
        clearInterval(metronomeIntervalRef.current);
        metronomeIntervalRef.current = null;
      }
      setIsMetronomePlaying(false);
    } else {
      playClick();
      const interval = 60000 / metronomeBpm;
      metronomeIntervalRef.current = setInterval(playClick, interval);
      setIsMetronomePlaying(true);
    }
  };

  const changeMetronomeBpm = (delta: number) => {
    setMetronomeBpm(prevBpm => {
      const newBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, prevBpm + delta));
      if (isMetronomePlaying) {
        if (metronomeIntervalRef.current) {
          clearInterval(metronomeIntervalRef.current);
        }
        playClick();
        const interval = 60000 / newBpm;
        metronomeIntervalRef.current = setInterval(playClick, interval);
      }
      return newBpm;
    });
  };

  const stopScrolling = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    setIsScrolling(false);
  };

  useEffect(() => {
    // Stop scrolling if component unmounts
    return () => {
      stopScrolling();
    };
  }, []);
  
  useEffect(() => {
    // Reset when song or tab changes
    setTranspose(0);
    setActivePdfIndex(0);
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = 0;
    }
    stopScrolling();
    if (isMetronomePlaying) {
      handleToggleMetronome();
    }
  }, [activeSongId, activeTab]);


  const startScrolling = () => {
    stopScrolling();
    if (!scrollViewportRef.current) return;

    setIsScrolling(true);
    const maxScroll = scrollViewportRef.current.scrollHeight - scrollViewportRef.current.clientHeight;
    if (scrollViewportRef.current.scrollTop >= maxScroll) {
      scrollViewportRef.current.scrollTop = 0;
    }

    const interval = 151 - (scrollSpeed * 13);
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
  };

  const handleToggleScrolling = () => {
    if (isScrolling) {
      stopScrolling();
    } else {
      startScrolling();
    }
  };

  const changeSpeed = (delta: number) => {
    const newSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, scrollSpeed + delta));
    setScrollSpeed(newSpeed);
    if (isScrolling) {
      setTimeout(startScrolling, 0);
    }
  }

  const changeFontSize = (delta: number) => {
    setFontSize(prev => Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, prev + delta)));
  }

  const resetFontSize = () => {
    setFontSize(DEFAULT_FONT_SIZE);
  }
  
  const handleSelectSong = (songId: string) => {
    setActiveSongId(songId);
    setIsSheetOpen(false);
  }

  const navigateSong = (direction: 'next' | 'prev') => {
      const newIndex = direction === 'next' ? activeSongIndex + 1 : activeSongIndex - 1;
      if (newIndex >= 0 && newIndex < songsInPlaylist.length) {
          setActiveSongId(songsInPlaylist[newIndex].id);
      }
  }
  
  const transposedKey = activeSong ? getTransposedKey(activeSong.key, transpose) : null;
  const zoomPercentage = Math.round((fontSize / DEFAULT_FONT_SIZE) * 100);

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); setIsOpen(open); }}>
      <DialogContent className="max-w-none w-full h-full p-0 gap-0 flex flex-col" style={{'--header-height': '7.5rem'} as React.CSSProperties}>
          <DialogHeader className="sr-only">
            <DialogTitle>Visualizador de Repertório</DialogTitle>
            <DialogDescription>Navegue e visualize as letras e cifras do repertório selecionado.</DialogDescription>
          </DialogHeader>
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
                            <h1 className="font-headline font-bold text-base sm:text-lg truncate leading-tight">{activeSong?.title || 'Repertório'}</h1>
                            <div className="flex items-center gap-2">
                                {activeSong?.key && activeTab === 'chords' && <Badge variant="secondary" className="text-xs">{activeSong.key}</Badge>}
                                {transpose !== 0 && transposedKey && activeTab === 'chords' && <Badge className="text-xs">{transposedKey}</Badge>}
                            </div>
                          </div>
                      </div>
                      <div className="w-full sm:w-auto flex justify-between sm:justify-end items-center gap-2">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="shrink-0">
                          <TabsList>
                              <TabsTrigger value="lyrics"><FileText className="w-4 h-4 md:mr-2"/><span className="hidden md:inline">Letra</span></TabsTrigger>
                              <TabsTrigger value="chords"><Music className="w-4 h-4 md:mr-2"/><span className="hidden md:inline">Cifras</span></TabsTrigger>
                              <TabsTrigger value="pdfs" disabled={!activeSong?.pdfLinks || activeSong.pdfLinks.length === 0}>
                                  <FileDown className="w-4 h-4 md:mr-2"/>
                                  <span className="hidden md:inline">Cifras (Arquivo)</span>
                              </TabsTrigger>
                          </TabsList>
                        </Tabs>
                        
                        {activeTab === 'chords' && (
                            <div className="flex items-center gap-1 shrink-0">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setTranspose(transpose - 1)}>
                                    <Minus className="h-4 w-4"/>
                                </Button>
                                <div className="flex flex-col items-center w-8">
                                    <span className="text-[10px] text-muted-foreground -mb-1">Tom</span>
                                    <span className="font-bold text-center text-sm">{transpose > 0 ? `+${transpose}` : transpose}</span>
                                </div>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setTranspose(transpose + 1)}>
                                    <Plus className="h-4 w-4"/>
                                </Button>
                            </div>
                        )}

                        <div className="flex items-center gap-1 shrink-0">
                            {activeTab !== 'pdfs' ? (
                                <>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeFontSize(-FONT_STEP)} disabled={fontSize <= MIN_FONT_SIZE}>
                                        <ZoomOut className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" onClick={resetFontSize} className="font-bold w-12 text-center text-sm tabular-nums h-8 px-1">
                                        {zoomPercentage}%
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeFontSize(FONT_STEP)} disabled={fontSize >= MAX_FONT_SIZE}>
                                        <ZoomIn className="h-4 w-4" />
                                    </Button>
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
                        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => router.push(`/sala-ao-vivo?scheduleId=${schedule.id}`)}><Podcast/></Button>
                        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="shrink-0">
                          <X/>
                        </Button>
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
                                  <pre className="whitespace-pre-wrap font-body" style={{lineHeight: '1.75', whiteSpace: 'pre-wrap'}}>
                                      {activeSong.lyrics || 'Nenhuma letra disponível.'}
                                  </pre>
                              ) : (
                                  <ChordDisplay chordsText={activeSong.chords || 'Nenhuma cifra disponível.'} transposeBy={transpose}/>
                              )}
                          </div>
                      ) : (
                          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                              <h3 className="text-lg font-semibold">Nenhuma música no repertório</h3>
                              <p className="text-sm">Adicione músicas na tela de gerenciamento.</p>
                          </div>
                      )}
                      </ScrollArea>
                  )}
                  
                  {activeSong && (
                    <>
                        <div className="absolute bottom-4 left-4 z-10">
                             <Button variant="destructive" size="icon" className="h-12 w-12 rounded-full" onClick={() => navigateSong('prev')} disabled={activeSongIndex === 0}>
                                <SkipBack className="h-7 w-7 fill-current"/>
                            </Button>
                        </div>

                        {activeTab === 'chords' && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-end justify-center gap-2 rounded-full border bg-background/80 px-4 py-2 shadow-lg backdrop-blur-sm">
                                {/* Scroll Controls */}
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => changeSpeed(-1)} disabled={scrollSpeed <= MIN_SPEED}>
                                        <Turtle className="h-6 w-6" />
                                    </Button>
                                    <div className="flex flex-col items-center">
                                        <button
                                            onClick={handleToggleScrolling}
                                            className={cn("relative flex items-center justify-center w-10 h-10 text-foreground rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-colors",
                                            isScrolling && "bg-primary text-primary-foreground"
                                            )}
                                            aria-label={isScrolling ? "Pausar rolagem" : "Iniciar rolagem"}
                                        >
                                            {isScrolling ? <Pause className="w-6 h-6 fill-current"/> : <Play className="w-6 h-6 fill-current" />}
                                        </button>
                                        <span className="text-xs font-bold w-6 h-6 flex items-center justify-center mt-1 rounded-full bg-muted/50">{scrollSpeed}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => changeSpeed(1)} disabled={scrollSpeed >= MAX_SPEED}>
                                        <Rabbit className="h-6 w-6" />
                                    </Button>
                                </div>
                                
                                <Separator orientation="vertical" className="h-12"/>

                                {/* Metronome Controls */}
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => changeMetronomeBpm(-5)} disabled={metronomeBpm <= MIN_BPM}>
                                        <Minus className="h-5 w-5" />
                                    </Button>
                                    <div className="flex flex-col items-center">
                                        <button
                                            onClick={handleToggleMetronome}
                                            className={cn("relative flex items-center justify-center w-10 h-10 text-foreground rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-colors",
                                            isMetronomePlaying && "bg-primary text-primary-foreground"
                                            )}
                                            aria-label={isMetronomePlaying ? "Pausar metrônomo" : "Iniciar metrônomo"}
                                        >
                                            <Timer className="w-6 h-6"/>
                                        </button>
                                        <span className="text-xs font-bold w-12 h-6 flex items-center justify-center mt-1 rounded-full bg-muted/50 tabular-nums">{metronomeBpm}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => changeMetronomeBpm(5)} disabled={metronomeBpm >= MAX_BPM}>
                                        <Plus className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="absolute bottom-4 right-4 z-10">
                            <Button variant="destructive" size="icon" className="h-12 w-12 rounded-full" onClick={() => navigateSong('next')} disabled={activeSongIndex === songsInPlaylist.length - 1}>
                                <SkipForward className="h-7 w-7 fill-current"/>
                            </Button>
                        </div>
                    </>
                  )}
              </main>

              <SheetContent side="left" className="p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                    <SheetTitleComponent>Repertório - {schedule.name}</SheetTitleComponent>
                    <SheetDescriptionComponent>Lista de músicas no repertório para seleção rápida.</SheetDescriptionComponent>
                </SheetHeader>
                <ScrollArea className="flex-grow">
                    <div className="p-2 space-y-1">
                        {songsInPlaylist.map((s, index) => (
                        <Button
                            key={`shortcut-${s.id}`}
                            variant={activeSongId === s.id ? "secondary" : "ghost"}
                            className="w-full justify-start h-auto py-2 px-3 text-left"
                            onClick={() => handleSelectSong(s.id)}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-muted-foreground w-4">{index + 1}</span>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="truncate">{s.title}</span>
                                </div>
                            </div>
                        </Button>
                        ))}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
      </DialogContent>
    </Dialog>
    </>
  );
}
