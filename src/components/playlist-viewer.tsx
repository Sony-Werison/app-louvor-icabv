
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
import { ListMusic, Play, Pause, FileText, Music, X, SkipBack, SkipForward, Rabbit, Turtle, ZoomIn, ZoomOut, Plus, Minus, Share2, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChordDisplay } from './chord-display';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { getTransposedKey } from '@/lib/transpose';
import { useAuth } from '@/context/auth-context';
import * as htmlToImage from 'html-to-image';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export function PlaylistViewer({ schedule, songs, onOpenChange }: PlaylistViewerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'lyrics' | 'chords'>('lyrics');
  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [transpose, setTranspose] = useState(0);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE); // em rem

  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(5); // 1 to 10
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isSharing, setIsSharing] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { can } = useAuth();


  const songsInPlaylist = schedule.playlist.map(id => songs.find(s => s.id === id)).filter((s): s is Song => !!s);
  const activeSong = songsInPlaylist.find(s => s.id === activeSongId);
  
  const activeSongIndex = songsInPlaylist.findIndex(s => s.id === activeSongId);

  useEffect(() => {
    if (songsInPlaylist.length > 0 && !activeSongId) {
      setActiveSongId(songsInPlaylist[0].id);
    }
  }, [schedule.id, songsInPlaylist, activeSongId]);

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
    // Reset transpose and scrolling when song or tab changes
    setTranspose(0);
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = 0;
    }
    stopScrolling();
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
      // Use a timeout to restart scrolling after the state has updated
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
  
    const handleShare = async () => {
        if (!navigator.share) {
            toast({
                title: "Compartilhamento não suportado",
                description: "Seu navegador não suporta o compartilhamento direto de arquivos. Tente baixar a imagem.",
                variant: 'destructive'
            });
            return;
        }

        setIsSharing(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            if (!exportRef.current) {
                throw new Error("Elemento de exportação não encontrado.");
            }

            const dataUrl = await htmlToImage.toPng(exportRef.current, { 
                quality: 1, 
                pixelRatio: 2,
                backgroundColor: '#121212',
                skipFonts: true,
            });

            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], 'repertorio.png', { type: 'image/png' });

            await navigator.share({
                title: `Repertório - ${schedule.name}`,
                text: `Repertório para ${schedule.name}`,
                files: [file],
            });

        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error("Erro ao compartilhar", error);
                toast({
                    title: "Erro ao compartilhar",
                    description: "Não foi possível compartilhar a imagem.",
                    variant: 'destructive'
                });
            }
        } finally {
            setIsSharing(false);
        }
    };


  const transposedKey = activeSong ? getTransposedKey(activeSong.key, transpose) : null;
  const zoomPercentage = Math.round((fontSize / DEFAULT_FONT_SIZE) * 100);

  const PlaylistExportContent = () => (
    <div className="bg-background text-foreground p-8">
        <h1 className="text-3xl font-bold mb-2 capitalize">{schedule.name}</h1>
        <p className="text-lg text-muted-foreground mb-8 capitalize">
            {format(schedule.date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
        <div className="space-y-4">
            {songsInPlaylist.map((song, index) => (
                <div key={song.id} className="flex items-baseline gap-4">
                    <span className="text-2xl font-bold text-muted-foreground">{index + 1}.</span>
                    <div>
                        <h2 className="text-2xl font-semibold flex items-center gap-3">
                           {song.title}
                           {song.key && <Badge variant="outline" className="text-xl px-3 py-1">{song.key}</Badge>}
                        </h2>
                        <p className="text-xl text-muted-foreground">{song.artist}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);


  return (
    <>
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
                                {activeSong?.key && activeTab === 'chords' && <Badge variant="secondary" className="text-xs">{activeSong.key}</Badge>}
                                {transpose !== 0 && transposedKey && activeTab === 'chords' && <Badge className="text-xs">{transposedKey}</Badge>}
                            </div>
                          </div>
                      </div>
                      <div className="w-full sm:w-auto flex justify-between sm:justify-end items-center gap-2">
                        {can('manage:playlists') && navigator.share && (
                            <Button size="sm" variant="outline" onClick={handleShare} disabled={isSharing}>
                                {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Share2 className="mr-2 h-4 w-4"/>}
                                {isSharing ? 'Gerando...' : 'PNG'}
                            </Button>
                        )}
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="shrink-0">
                          <TabsList>
                              <TabsTrigger value="lyrics"><FileText className="w-4 h-4 md:mr-2"/><span className="hidden md:inline">Letra</span></TabsTrigger>
                              <TabsTrigger value="chords"><Music className="w-4 h-4 md:mr-2"/><span className="hidden md:inline">Cifras</span></TabsTrigger>
                          </TabsList>
                        </Tabs>
                        
                        {activeTab === 'chords' && (
                            <div className="flex items-center gap-1">
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

                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeFontSize(-FONT_STEP)} disabled={fontSize <= MIN_FONT_SIZE}>
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" onClick={resetFontSize} className="font-bold w-12 text-center text-sm tabular-nums h-8 px-1">
                                {zoomPercentage}%
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeFontSize(FONT_STEP)} disabled={fontSize >= MAX_FONT_SIZE}>
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="shrink-0">
                          <X/>
                        </Button>
                      </div>
                  </div>
              </header>

              <main className="flex-grow min-h-0 relative group/main">
                  <ScrollArea className="h-full" viewportRef={scrollViewportRef}>
                  {activeSong ? (
                      <div className="p-4 sm:p-8 pb-28" style={{ fontSize: `${fontSize}rem` }}>
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
                  
                  {activeSong && (
                    <>
                        <div className="absolute bottom-4 left-4 z-10">
                             <Button variant="ghost" size="icon" className="h-12 w-12 bg-background/60 backdrop-blur-sm rounded-full" onClick={() => navigateSong('prev')} disabled={activeSongIndex === 0}>
                                <SkipBack className="h-7 w-7 fill-current"/>
                            </Button>
                        </div>

                        {activeTab === 'chords' && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center gap-4 rounded-full border bg-background/80 px-3 py-1 shadow-lg backdrop-blur-sm">
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
                                    {isScrolling ? 
                                    <Pause className="w-6 h-6 fill-current"/> :
                                    <Play className="w-6 h-6 fill-current" />
                                    }
                                </button>
                                <span className="text-xs font-bold w-6 h-6 flex items-center justify-center mt-1 rounded-full bg-muted/50">
                                    {scrollSpeed}
                                </span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => changeSpeed(1)} disabled={scrollSpeed >= MAX_SPEED}>
                                    <Rabbit className="h-6 w-6" />
                                </Button>
                            </div>
                        )}

                        <div className="absolute bottom-4 right-4 z-10">
                            <Button variant="ghost" size="icon" className="h-12 w-12 bg-background/60 backdrop-blur-sm rounded-full" onClick={() => navigateSong('next')} disabled={activeSongIndex === songsInPlaylist.length - 1}>
                                <SkipForward className="h-7 w-7 fill-current"/>
                            </Button>
                        </div>
                    </>
                  )}
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
     {/* Hidden element for export */}
     <div className="fixed top-0 left-0 -z-50 opacity-0 dark w-[800px]" >
        <div ref={exportRef}>
            <PlaylistExportContent />
        </div>
     </div>
    </>
  );
}
