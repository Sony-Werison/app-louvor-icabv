'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSchedule } from '@/context/schedule-context';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, Plus, Minus, ZoomIn, ZoomOut, Turtle, Rabbit, Play, Pause, FileText, Music, Timer, FileDown, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SongEditForm } from '@/components/song-edit-form';
import { ChordDisplay } from '@/components/chord-display';
import { useAuth } from '@/context/auth-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Song } from '@/types';
import { getTransposedKey } from '@/lib/transpose';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, convertGoogleDriveUrl } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const MIN_FONT_SIZE = 0.8;
const MAX_FONT_SIZE = 2.5;
const FONT_STEP = 0.1;
const DEFAULT_FONT_SIZE = 1.25;
const MIN_SPEED = 1;
const MAX_SPEED = 10;
const MIN_BPM = 30;
const MAX_BPM = 300;

export default function SongDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { songs, updateSong, removeSong } = useSchedule();
  const [isEditing, setIsEditing] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [transpose, setTranspose] = useState(0);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [activeTab, setActiveTab] = useState<'lyrics' | 'chords' | 'pdfs'>('lyrics');
  const [activePdfIndex, setActivePdfIndex] = useState(0);
  
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(5);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { can } = useAuth();
  const songId = params.id as string;
  const song = songs.find((s) => s.id === songId);
  
  const [metronomeBpm, setMetronomeBpm] = useState(song?.bpm || 120);
  const [isMetronomePlaying, setIsMetronomePlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const metronomeIntervalRef = useRef<NodeJS.Timeout | null>(null);


  // --- Metronome Logic ---
  useEffect(() => {
    return () => {
      if (metronomeIntervalRef.current) {
        clearInterval(metronomeIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setMetronomeBpm(song?.bpm || 120);
  }, [song?.bpm]);

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

  // --- Scrolling Logic ---
  const stopScrolling = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    setIsScrolling(false);
  };

  useEffect(() => {
    return () => stopScrolling(); // Cleanup on unmount
  }, []);

  useEffect(() => {
    // Reset scroll when tab changes
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = 0;
    }
    stopScrolling();
  }, [activeTab]);


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

  // --- Other Logic ---
  if (!song) {
    return (
      <div className="p-4 md:p-6 text-center">
        <h2 className="text-2xl font-bold">Música não encontrada</h2>
        <Button onClick={() => router.push('/music')} className="mt-4">
          <ArrowLeft className="mr-2" />
          Voltar para a Biblioteca
        </Button>
      </div>
    );
  }

  const handleSave = (updatedSong: Partial<Song>) => {
    updateSong(songId, updatedSong);
    setIsEditing(false);
  };

  const handleDelete = () => {
    removeSong(songId);
    router.push('/music');
    setIsAlertOpen(false);
  };

  if (isEditing) {
    return (
        <div className="p-4 md:p-6">
            <SongEditForm
                song={song}
                onSave={handleSave}
                onCancel={() => setIsEditing(false)}
            />
        </div>
    );
  }

  const changeFontSize = (delta: number) => {
    setFontSize(prev => Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, prev + delta)));
  }

  const resetFontSize = () => {
    setFontSize(DEFAULT_FONT_SIZE);
  }

  const transposedKey = getTransposedKey(song.key, transpose);
  const zoomPercentage = Math.round((fontSize / DEFAULT_FONT_SIZE) * 100);
  
  return (
    <div className="h-[calc(100vh-var(--header-height)-1px)] flex flex-col" style={{'--header-height': '7.5rem'} as React.CSSProperties}>
        <header className="flex-shrink-0 bg-background/95 backdrop-blur-sm z-20 border-b">
             <div className="h-14 flex items-center justify-between px-2 sm:px-4">
                <Button variant="ghost" size="sm" onClick={() => router.push('/music')}>
                    <ArrowLeft className="mr-2" />
                    Voltar
                </Button>
                <div className="flex flex-col items-center text-center mx-2 flex-1 min-w-0">
                    <h1 className="font-headline font-bold text-base sm:text-lg truncate leading-tight w-full">{song.title}</h1>
                    <span className="text-sm text-muted-foreground truncate w-full">{song.artist}</span>
                </div>
                {can('edit:songs') ? (
                    <div className="flex gap-1 sm:gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8 sm:h-auto sm:w-auto sm:px-3 sm:py-1" onClick={() => setIsEditing(true)}>
                            <Edit className="h-4 w-4 sm:mr-2"/>
                            <span className="hidden sm:inline">Editar</span>
                        </Button>
                        <Button size="icon" variant="destructive" className="h-8 w-8 sm:h-auto sm:w-auto sm:px-3 sm:py-1" onClick={() => setIsAlertOpen(true)}>
                            <Trash2 className="h-4 w-4 sm:mr-2" />
                             <span className="hidden sm:inline">Excluir</span>
                        </Button>
                    </div>
                ) : <div className="w-10 sm:w-24"/>}
             </div>
             <div className="h-auto flex flex-col sm:flex-row items-center justify-between px-2 sm:px-4 gap-2 py-2 border-t">
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="shrink-0">
                        <TabsList>
                            <TabsTrigger value="lyrics"><FileText className="w-4 h-4 md:mr-2"/><span className="hidden md:inline">Letra</span></TabsTrigger>
                            <TabsTrigger value="chords"><Music className="w-4 h-4 md:mr-2"/><span className="hidden md:inline">Cifras</span></TabsTrigger>
                            <TabsTrigger value="pdfs" disabled={!song.pdfLinks || song.pdfLinks.length === 0}>
                                <FileDown className="w-4 h-4 md:mr-2"/>
                                <span className="hidden md:inline">Cifras (PDF)</span>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                    
                    {activeTab === 'chords' && (
                        <>
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
                            {song.key && <Badge variant="secondary" className="text-sm sm:text-base">{song.key}</Badge>}
                            {transpose !== 0 && <Badge className="text-sm sm:text-base">{transposedKey}</Badge>}
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {activeTab !== 'pdfs' && (
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
                    )}
                    {activeTab === 'pdfs' && song.pdfLinks && song.pdfLinks.length > 1 && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">Variação:</span>
                            <div className="flex gap-1">
                                {song.pdfLinks.map((pdf, idx) => (
                                    <Button 
                                        key={idx} 
                                        variant={activePdfIndex === idx ? 'default' : 'outline'} 
                                        size="sm" 
                                        className="h-8 text-xs"
                                        onClick={() => setActivePdfIndex(idx)}
                                    >
                                        {pdf.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
             </div>
        </header>

      <main className="flex-grow min-h-0 relative">
        {activeTab === 'pdfs' && song.pdfLinks?.[activePdfIndex] ? (
            <div className="w-full h-full flex flex-col items-center bg-muted/20">
                <div className="w-full flex justify-end p-2 gap-2">
                    <Button variant="secondary" size="sm" asChild>
                        <a href={song.pdfLinks[activePdfIndex].url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2"/>
                            Abrir no Drive
                        </a>
                    </Button>
                </div>
                <iframe 
                    src={convertGoogleDriveUrl(song.pdfLinks[activePdfIndex].url)} 
                    className="w-full h-full border-none flex-grow"
                    allow="autoplay"
                />
            </div>
        ) : (
            <ScrollArea className="h-full" viewportRef={scrollViewportRef}>
                <div className="p-4 sm:p-8 pb-28" style={{ fontSize: `${fontSize}rem` }}>
                    {activeTab === 'lyrics' ? (
                        <pre className="whitespace-pre-wrap font-body" style={{lineHeight: '1.75'}}>
                        {song.lyrics || 'Nenhuma letra disponível.'}
                        </pre>
                    ) : (
                        <ChordDisplay chordsText={song.chords || 'Nenhuma cifra disponível.'} transposeBy={transpose} />
                    )}
                </div>
            </ScrollArea>
        )}
        
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
      </main>


      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Essa ação não pode ser desfeita. Isso excluirá permanentemente a música da biblioteca.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
