
'use client';

import type { Schedule, Song } from '@/types';
import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { ListMusic, Play, Pause, FileText, Music, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChordDisplay } from './chord-display';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';

interface PlaylistViewerProps {
  schedule: Schedule;
  songs: Song[];
  onOpenChange: (open: boolean) => void;
}

export function PlaylistViewer({ schedule, songs, onOpenChange }: PlaylistViewerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'lyrics' | 'chords'>('lyrics');
  const [activeSongId, setActiveSongId] = useState<string | null>(null);

  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(50);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const songsInPlaylist = schedule.playlist.map(id => songs.find(s => s.id === id)).filter((s): s is Song => !!s);
  const activeSong = songsInPlaylist.find(s => s.id === activeSongId);

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

    scrollIntervalRef.current = setInterval(() => {
      if (scrollViewportRef.current) {
        const currentMaxScroll = scrollViewportRef.current.scrollHeight - scrollViewportRef.current.clientHeight;
        if (scrollViewportRef.current.scrollTop < currentMaxScroll) {
          scrollViewportRef.current.scrollTop += 1;
        } else {
          stopScrolling();
        }
      }
    }, 151 - (scrollSpeed * 1.3));
  };

  const handleToggleScrolling = () => {
    if (isScrolling) {
      stopScrolling();
    } else {
      startScrolling();
    }
  };
  
  const handleSelectSong = (songId: string) => {
    setActiveSongId(songId);
    setIsSheetOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); setIsOpen(open); }}>
      <DialogContent className="max-w-none w-full h-full p-0 gap-0 flex flex-col">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <header className="flex-shrink-0 bg-background/95 backdrop-blur-sm z-20 border-b">
                  <div className="h-16 flex items-center justify-between px-2 sm:px-4 gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
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
                            </div>
                          </div>
                      </div>
                       <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="shrink-0">
                        <TabsList>
                            <TabsTrigger value="lyrics"><FileText className="w-4 h-4 md:mr-2"/><span className="hidden md:inline">Letra</span></TabsTrigger>
                            <TabsTrigger value="chords"><Music className="w-4 h-4 md:mr-2"/><span className="hidden md:inline">Cifras</span></TabsTrigger>
                        </TabsList>
                      </Tabs>
                      <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="shrink-0">
                        <X/>
                      </Button>
                  </div>
              </header>

              <main className="flex-grow min-h-0 relative">
                  <ScrollArea className="h-full" viewportRef={scrollViewportRef}>
                  {activeSong ? (
                      <div className="p-4 sm:p-8 text-lg md:text-xl">
                          {activeTab === 'lyrics' ? (
                              <pre className="whitespace-pre-wrap font-body leading-relaxed">
                                  {activeSong.lyrics || 'Nenhuma letra disponível.'}
                              </pre>
                          ) : (
                              <ChordDisplay chordsText={activeSong.chords || 'Nenhuma cifra disponível.'} />
                          )}
                      </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                          <h3 className="text-lg font-semibold">Nenhuma música no repertório</h3>
                          <p className="text-sm">Adicione músicas na tela de gerenciamento.</p>
                      </div>
                  )}
                  </ScrollArea>
                  {activeTab === 'chords' && activeSong && (
                  <div className="absolute bottom-4 right-4 z-10">
                      <div className="flex items-center justify-center gap-2 rounded-lg border bg-background/80 p-2 shadow-lg backdrop-blur-sm">
                      <Button variant="ghost" size="icon" onClick={handleToggleScrolling}>
                          {isScrolling ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </Button>
                      <div className="flex items-center gap-2 w-24 sm:w-32">
                          <Slider
                          value={[scrollSpeed]}
                          onValueChange={(value) => {
                              setScrollSpeed(value[0]);
                              if (isScrolling) {
                              stopScrolling();
                              setTimeout(() => startScrolling(), 0);
                              }
                          }}
                          min={1}
                          max={100}
                          step={1}
                          />
                      </div>
                      </div>
                  </div>
                  )}
              </main>

              <SheetContent side="left" className="p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle>Repertório - {schedule.name}</SheetTitle>
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
