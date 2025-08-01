
'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSchedule } from '@/context/schedule-context';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, Plus, Minus, ZoomIn, ZoomOut, Turtle, Rabbit, Play, Pause, FileText, Music } from 'lucide-react';
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
import { cn } from '@/lib/utils';

const MIN_FONT_SIZE = 0.8;
const MAX_FONT_SIZE = 2.5;
const FONT_STEP = 0.1;
const DEFAULT_FONT_SIZE = 1.25;
const MIN_SPEED = 1;
const MAX_SPEED = 10;


export default function SongDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { songs, updateSong, removeSong } = useSchedule();
  const [isEditing, setIsEditing] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [transpose, setTranspose] = useState(0);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [activeTab, setActiveTab] = useState<'lyrics' | 'chords'>('lyrics');
  
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(5);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { can } = useAuth();

  const songId = params.id as string;
  const song = songs.find((s) => s.id === songId);

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
    <div className="h-[calc(100vh-var(--header-height))] flex flex-col" style={{'--header-height': '7rem'} as React.CSSProperties}>
        <header className="flex-shrink-0 bg-background/95 backdrop-blur-sm z-20 border-b">
             <div className="h-14 flex items-center justify-between px-2 sm:px-4">
                <Button variant="outline" size="sm" onClick={() => router.push('/music')}>
                    <ArrowLeft className="mr-2" />
                    Voltar
                </Button>
                <div className="flex flex-col items-center">
                    <h1 className="font-headline font-bold text-base sm:text-lg truncate leading-tight">{song.title}</h1>
                    <span className="text-sm text-muted-foreground">{song.artist}</span>
                </div>
                {can('edit:songs') ? (
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                            <Edit className="mr-2" />
                            Editar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setIsAlertOpen(true)}>
                            <Trash2 className="mr-2" />
                            Excluir
                        </Button>
                    </div>
                ) : <div className="w-24"/>}
             </div>
             <div className="h-14 flex items-center justify-center px-2 sm:px-4 gap-2 py-2 border-t">
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
                
                 <div className="flex items-center gap-2">
                    {song.key && <Badge variant="secondary" className="text-sm sm:text-base">{song.key}</Badge>}
                    {transpose !== 0 && activeTab === 'chords' && <Badge className="text-sm sm:text-base">{transposedKey}</Badge>}
                </div>
             </div>
        </header>

      <main className="flex-grow min-h-0 relative">
        <ScrollArea className="h-full" viewportRef={scrollViewportRef}>
            <div className="p-4 sm:p-8 pb-28" style={{ fontSize: `${fontSize}rem` }}>
                 {activeTab === 'lyrics' ? (
                    <pre className="whitespace-pre-wrap font-body" style={{lineHeight: '1.75', whiteSpace: 'pre-wrap'}}>
                    {song.lyrics || 'Nenhuma letra disponível.'}
                    </pre>
                ) : (
                    <ChordDisplay chordsText={song.chords || 'Nenhuma cifra disponível.'} transposeBy={transpose} />
                )}
            </div>
        </ScrollArea>
        
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
      </main>


      {isAlertOpen && (
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
      )}
    </div>
  );
}
