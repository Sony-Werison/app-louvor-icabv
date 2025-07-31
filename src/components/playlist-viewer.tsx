
'use client';

import type { Schedule, Song } from '@/types';
import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { ListMusic, Play, Pause, FileText, Music } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChordDisplay } from './chord-display';
import { Slider } from './ui/slider';

interface PlaylistViewerProps {
  schedule: Schedule;
  songs: Song[];
  onOpenChange: (open: boolean) => void;
}

export function PlaylistViewer({ schedule, songs, onOpenChange }: PlaylistViewerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'lyrics' | 'chords'>('lyrics');
  const [activeSongId, setActiveSongId] = useState<string | null>(null);

  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(50);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const songsInPlaylist = schedule.playlist.map(id => songs.find(s => s.id === id)).filter((s): s is Song => !!s);
  const activeSong = songsInPlaylist.find(s => s.id === activeSongId);

  useEffect(() => {
    if (songsInPlaylist.length > 0) {
      setActiveSongId(songsInPlaylist[0].id);
    }
  }, [schedule.id]);

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); setIsOpen(open); }}>
      <DialogContent className="max-w-7xl w-[95vw] h-[90vh] grid-rows-[auto,1fr,auto] p-4 sm:p-6 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="font-headline font-bold text-xl sm:text-2xl truncate">
            Visualizar: {schedule.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-[300px_1fr] gap-6 h-full min-h-0 py-4">
          <div className="flex flex-col gap-4 h-full overflow-hidden">
            <h3 className="font-semibold text-lg flex items-center gap-2 shrink-0"><ListMusic className="w-5 h-5" /> Repertório</h3>
            <ScrollArea className="flex-grow rounded-md border">
              <div className="p-2 space-y-1">
                {songsInPlaylist.map((s) => (
                  <Button
                    key={`shortcut-${s.id}`}
                    variant={activeSongId === s.id ? "secondary" : "ghost"}
                    className="w-full justify-start h-auto py-2 px-3 text-left"
                    onClick={() => setActiveSongId(s.id)}
                  >
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate">{s.title}</span>
                      <span className="text-xs text-muted-foreground truncate">{s.artist}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="h-full flex flex-col gap-4 overflow-hidden relative">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-shrink-0">
              <TabsList>
                <TabsTrigger value="lyrics"><FileText className="mr-2"/>Letra</TabsTrigger>
                <TabsTrigger value="chords"><Music className="mr-2"/>Cifras</TabsTrigger>
              </TabsList>
            </Tabs>
            <ScrollArea className="flex-grow rounded-md border" viewportRef={scrollViewportRef}>
              {activeSong ? (
                <div className="p-4 sm:p-6 text-lg">
                  <h3 className="font-bold text-2xl font-headline">{activeSong.title}</h3>
                  <p className="text-base text-muted-foreground mb-4">{activeSong.artist} - (Tom: {activeSong.key})</p>
                  {activeTab === 'lyrics' ? (
                    <pre className="whitespace-pre-wrap font-body text-base sm:text-lg leading-relaxed">
                      {activeSong.lyrics || 'Nenhuma letra disponível.'}
                    </pre>
                  ) : (
                    <ChordDisplay chordsText={activeSong.chords || 'Nenhuma cifra disponível.'} />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                  <h3 className="text-lg font-semibold">Selecione uma música</h3>
                  <p className="text-sm">Clique em uma música na lista à esquerda para ver os detalhes aqui.</p>
                </div>
              )}
            </ScrollArea>
             {activeTab === 'chords' && (
              <div className="absolute bottom-4 right-4 z-10">
                <div className="flex items-center justify-center gap-2 rounded-lg border bg-background/80 p-2 shadow-lg backdrop-blur-sm">
                  <Button variant="ghost" size="icon" onClick={handleToggleScrolling} disabled={!activeSong}>
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
                      disabled={!activeSong}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
