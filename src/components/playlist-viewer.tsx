
'use client';

import type { Schedule, Song } from '@/types';
import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle as SheetTitleComponent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { ListMusic, Play, Pause, FileText, Music, X, ChevronLeft, ChevronRight, Plus, Minus, Rabbit, Turtle, ZoomIn, ZoomOut } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChordDisplay } from './chord-display';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { getTransposedKey } from '@/lib/transpose';

interface PlaylistViewerProps {
  schedule: Schedule;
  songs: Song[];
  onOpenChange: (open: boolean) => void;
}

const MIN_FONT_SIZE = 0.8;
const MAX_FONT_SIZE = 2.5;
const FONT_STEP = 0.1;
const MIN_SPEED = 1;
const MAX_SPEED = 10;

export function PlaylistViewer({ schedule, songs, onOpenChange }: PlaylistViewerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'lyrics' | 'chords'>('lyrics');
  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [transpose, setTranspose] = useState(0);
  const [fontSize, setFontSize] = useState(1.25); // em rem, default é text-lg (1.125rem)

  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(5); // 1 to 10
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const songsInPlaylist = schedule.playlist.map(id => songs.find(s => s.id === id)).filter((s): s is Song => !!s);
  const activeSong = songsInPlaylist.find(s => s.id === activeSongId);
  
  const activeSongIndex = songsInPlaylist.findIndex(s => s.id === activeSongId);

  useEffect(() => {
    if (songsInPlaylist.length > 0 && !activeSongId) {
      setActiveSongId(songsInPlaylist[0].id);
    }
  }, [schedule.id, songsInPlaylist, activeSongId]);

  useEffect(() => {
    return () => {
      stopScrolling();
    };
  }, []);
  
  useEffect(() => {
    setTranspose(0);
  }, [activeSongId]);

  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = 0;
    }
    stopScrolling();
  }, [activeSongId, activeTab]);

  const stopScrolling = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    setIsScrolling(false);
  };

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
      startScrolling(); // Restart with new speed
    }
  }

  const changeFontSize = (delta: number) => {
    setFontSize(prev => Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, prev + delta)));
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); setIsOpen(open); }}>
      <DialogContent className="max-w-none w-full h-full p-0 gap-0 flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Visualizador de Repertório</DialogTitle>
          </DialogHeader>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <header className="flex-shrink-0 bg-background/95 backdrop-blur-sm z-20 border-b">
                  <div className="h-24 sm:h-16 flex flex-col sm:flex-row items-center justify-between px-2 sm:px-4 gap-2 py-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0 w-full">
                          <SheetTrigger asChild>
                              <Button variant="destructive" size="sm">
                                  Ver Todas
                              </Button>
                          </SheetTrigger>
                          <div className="flex flex-col flex-1 min-w-0">
                            <h1 className="font-headline font-bold text-base sm:text-lg truncate leading-tight">{activeSong?.title || 'Repertório'}</h1>
                            <div className="flex items-center gap-2">
                                <p className="text-xs sm:text-sm text-muted-foreground truncate leading-tight">{activeSong?.artist}</p>
                                {activeSong?.key && <Badge variant="secondary" className="text-xs">{activeSong.key}</Badge>}
                                {transpose !== 0 && transposedKey && <Badge className="text-xs">{transposedKey}</Badge>}
                            </div>
                          </div>
                      </div>
                      <div className="w-full sm:w-auto flex justify-between sm:justify-end items-center gap-2">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="shrink-0">
                          <TabsList>
                              <TabsTrigger value="lyrics"><FileText className="w-4 h-4 md:mr-2"/><span className="hidden md:inline">Letra</span></TabsTrigger>
                              <TabsTrigger value="chords"><Music className="w-4 h-4 md:mr-2"/><span className="hidden md:inline">Cifras</span></TabsTrigger>
                          </TabsList>
                        </Tabs>
                        <div className={cn("flex items-center gap-1", activeTab !== 'chords' && 'invisible' )}>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setTranspose(transpose - 1)}>
                              <Minus className="h-4 w-4"/>
                          </Button>
                          <span className="font-bold w-8 text-center text-sm">{transpose > 0 ? `+${transpose}` : transpose}</span>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setTranspose(transpose + 1)}>
                              <Plus className="h-4 w-4"/>
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="shrink-0">
                          <X/>
                        </Button>
                      </div>
                  </div>
              </header>

              <main className="flex-grow min-h-0 relative group/main">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                        "absolute left-2 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/10 opacity-0 group-hover/main:opacity-100 transition-opacity",
                        activeSongIndex === 0 && "invisible"
                    )}
                    onClick={() => navigateSong('prev')}
                    aria-label="Música anterior"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/10 opacity-0 group-hover/main:opacity-100 transition-opacity",
                        activeSongIndex === songsInPlaylist.length - 1 && "invisible"
                    )}
                    onClick={() => navigateSong('next')}
                    aria-label="Próxima música"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                  <ScrollArea className="h-full" viewportRef={scrollViewportRef}>
                  {activeSong ? (
                      <div className="p-4 sm:p-8" style={{ fontSize: `${fontSize}rem` }}>
                          {activeTab === 'lyrics' ? (
                              <pre className="whitespace-pre-wrap font-body leading-relaxed" style={{whiteSpace: 'pre-wrap'}}>
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
                  <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
                     <div className="flex items-center justify-center gap-2 rounded-lg border bg-background/80 p-2 shadow-lg backdrop-blur-sm">
                        <Button variant="ghost" size="icon" onClick={() => changeFontSize(-FONT_STEP)} disabled={fontSize <= MIN_FONT_SIZE}>
                            <ZoomOut className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => changeFontSize(FONT_STEP)} disabled={fontSize >= MAX_FONT_SIZE}>
                            <ZoomIn className="h-5 w-5" />
                        </Button>
                      </div>

                    {activeSong && (
                      <div className="flex items-center justify-center gap-2 rounded-lg border bg-background/80 p-2 shadow-lg backdrop-blur-sm">
                        <Button variant="ghost" size="icon" onClick={handleToggleScrolling}>
                            {isScrolling ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        </Button>
                        <div className="flex items-center gap-2">
                           <Button variant="ghost" size="icon" onClick={() => changeSpeed(-1)} disabled={scrollSpeed <= MIN_SPEED}>
                               <Turtle className="h-5 w-5" />
                           </Button>
                           <div className="w-10 text-center font-bold text-sm">{scrollSpeed}</div>
                           <Button variant="ghost" size="icon" onClick={() => changeSpeed(1)} disabled={scrollSpeed >= MAX_SPEED}>
                               <Rabbit className="h-5 w-5" />
                           </Button>
                        </div>
                      </div>
                     )}
                  </div>
              </main>

              <SheetContent side="left" className="p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                    <SheetTitleComponent>Repertório - {schedule.name}</SheetTitleComponent>
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
                                    <span className="text-xs text-muted-foreground truncate">{s.artist}</span>
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
  );
}

    