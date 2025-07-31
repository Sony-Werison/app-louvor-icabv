'use client';

import type { Schedule, Song } from '@/types';
import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { X, Music, GripVertical, ListMusic, Eye, Play, Pause } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ChordDisplay } from './chord-display';
import { Slider } from './ui/slider';

interface PlaylistDialogProps {
  schedule: Schedule;
  allSongs: Song[];
  onSave: (scheduleId: string, newPlaylist: string[]) => void;
  onOpenChange: (open: boolean) => void;
}

const SingleSongView = ({ type, song, songsInPlaylist, onSongSelect, activeSongId }: { 
    type: 'lyrics' | 'chords', 
    song: Song | undefined,
    songsInPlaylist: Song[],
    onSongSelect: (songId: string) => void,
    activeSongId: string | null,
}) => {
    const [isScrolling, setIsScrolling] = useState(false);
    const [scrollSpeed, setScrollSpeed] = useState(50); // From 1 to 100
    const scrollViewportRef = useRef<HTMLDivElement>(null);
    const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
            scrollViewportRef.current.scrollTop = 0; // Reset scroll if at the bottom
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
        }, 151 - (scrollSpeed * 1.5)); // Adjust multiplier for a good speed range
    };

    useEffect(() => {
        // Stop scrolling when song or tab changes
        stopScrolling();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [song, type]);

    useEffect(() => {
        // Cleanup on unmount
        return () => stopScrolling();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleToggleScrolling = () => {
        if (isScrolling) {
            stopScrolling();
        } else {
            startScrolling();
        }
    };
    
    return (
        <div className="grid md:grid-cols-[250px_1fr] gap-6 h-full py-4">
            <div className="flex flex-col gap-4 h-full overflow-hidden">
                <h3 className="font-semibold text-lg flex items-center gap-2 shrink-0"><ListMusic className="w-5 h-5" /> Repertório</h3>
                <ScrollArea className="flex-grow rounded-md border">
                    <div className="p-2 space-y-1">
                        {songsInPlaylist.map((s) => (
                            <Button 
                                key={`shortcut-${s.id}`}
                                variant={activeSongId === s.id ? "secondary" : "ghost"}
                                className="w-full justify-start h-auto py-2 px-3 text-left"
                                onClick={() => onSongSelect(s.id)}
                            >
                                <div className="flex flex-col">
                                    <span>{s.title}</span>
                                    <span className="text-xs text-muted-foreground">{s.artist}</span>
                                </div>
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </div>
            <div className="h-full flex flex-col gap-2 overflow-hidden relative">
                <ScrollArea className="flex-grow rounded-md border" viewportRef={scrollViewportRef}>
                    {song ? (
                    <div className="p-6">
                        <h3 className="font-bold text-xl font-headline">{song.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{song.artist} - (Tom: {song.key})</p>
                        {type === 'lyrics' ? (
                            <pre className="whitespace-pre-wrap font-body text-base leading-relaxed">
                                {song.lyrics || 'Nenhuma letra disponível.'}
                            </pre>
                        ) : (
                            <ChordDisplay chordsText={song.chords || 'Nenhuma cifra disponível.'} />
                        )}
                    </div>
                    ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                        <Eye className="w-12 h-12 mb-4" />
                        <h3 className="text-lg font-semibold">Selecione uma música</h3>
                        <p className="text-sm">Clique em uma música na lista à esquerda para ver os detalhes aqui.</p>
                    </div>
                    )}
                </ScrollArea>
                 {type === 'chords' && (
                    <div className="absolute bottom-4 right-4 z-10">
                        <div className="flex items-center justify-center gap-2 rounded-lg border bg-background/80 p-2 shadow-lg backdrop-blur-sm">
                            <Button variant="ghost" size="icon" onClick={handleToggleScrolling} disabled={!song}>
                                {isScrolling ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                            </Button>
                            <div className="flex items-center gap-2 w-32">
                                <Slider
                                    value={[scrollSpeed]}
                                    onValueChange={(value) => {
                                        setScrollSpeed(value[0]);
                                        if (isScrolling) { // Update speed immediately
                                            stopScrolling();
                                            startScrolling();
                                        }
                                    }}
                                    min={1}
                                    max={100}
                                    step={1}
                                    disabled={!song}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


export function PlaylistDialog({ schedule, allSongs, onSave, onOpenChange }: PlaylistDialogProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [currentPlaylist, setCurrentPlaylist] = useState<string[]>(schedule.playlist);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('selection');

  useEffect(() => {
    setIsOpen(true);
    setCurrentPlaylist(schedule.playlist);
    if (schedule.playlist.length > 0) {
      setActiveSongId(schedule.playlist[0]);
    } else {
      setActiveSongId(null);
    }
  }, [schedule]);

  const handleSave = () => {
    onSave(schedule.id, currentPlaylist);
    setIsOpen(false);
  };

  const handleCheckedChange = (songId: string, checked: boolean | 'indeterminate') => {
    let newPlaylist;
    if (checked) {
      newPlaylist = [...currentPlaylist, songId];
    } else {
      newPlaylist = currentPlaylist.filter(id => id !== songId);
    }
    setCurrentPlaylist(newPlaylist);

    if (activeSongId === songId && !checked) {
        const newActiveIndex = newPlaylist.indexOf(activeSongId);
        setActiveSongId(newPlaylist.length > 0 ? newPlaylist[Math.max(0, newActiveIndex)] : null);
    } else if (!activeSongId && newPlaylist.length > 0) {
      setActiveSongId(newPlaylist[0]);
    }
  };
  
  const handleDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    const playlistItems = [...currentPlaylist];
    const draggedItemContent = playlistItems.splice(dragItem.current, 1)[0];
    playlistItems.splice(dragOverItem.current, 0, draggedItemContent);
    
    dragItem.current = null;
    dragOverItem.current = null;

    setCurrentPlaylist(playlistItems);
  };
  
  const handleShortcutClick = (songId: string) => {
    setActiveSongId(songId);
  }

  const songsInPlaylist = currentPlaylist.map(id => allSongs.find(song => song.id === id)).filter((s): s is Song => !!s);
  const availableSongs = allSongs.filter(song => !currentPlaylist.includes(song.id));
  const activeSong = songsInPlaylist.find(s => s.id === activeSongId);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); setIsOpen(open); }}>
      <DialogContent className="max-w-6xl grid-rows-[auto,1fr,auto] h-[90vh] sm:h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-headline font-bold text-2xl">
            Gerenciar Repertório - {schedule.name}
          </DialogTitle>
          <DialogDescription>
            Selecione, ordene e visualize as músicas para este culto.
          </DialogDescription>
        </DialogHeader>

        <Tabs 
            value={activeTab} 
            onValueChange={(value) => {
                setActiveTab(value);
                if (currentPlaylist.length > 0 && !activeSongId) {
                    setActiveSongId(currentPlaylist[0]);
                }
            }} 
            className="flex flex-col overflow-hidden"
        >
            <TabsList className="shrink-0">
                <TabsTrigger value="selection">Seleção</TabsTrigger>
                <TabsTrigger value="lyrics">Letras</TabsTrigger>
                <TabsTrigger value="chords">Cifras</TabsTrigger>
            </TabsList>

            <TabsContent value="selection" className="flex-grow overflow-auto mt-2">
                <div className="grid md:grid-cols-2 gap-6 py-4 h-full">
                    <div className="flex flex-col gap-4 h-full">
                        <h3 className="font-semibold text-lg">Disponíveis</h3>
                        <ScrollArea className="flex-grow rounded-md border p-4">
                            <div className="space-y-4">
                            {availableSongs.map(song => (
                                <div key={song.id} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`song-${song.id}`} 
                                    onCheckedChange={(checked) => handleCheckedChange(song.id, checked)}
                                    checked={currentPlaylist.includes(song.id)}
                                />
                                <Label htmlFor={`song-${song.id}`} className="flex flex-col">
                                    <span>{song.title}</span>
                                    <span className="text-sm text-muted-foreground">{song.artist}</span>
                                </Label>
                                </div>
                            ))}
                            </div>
                        </ScrollArea>
                    </div>
                    <div className="flex flex-col gap-4 h-full">
                        <h3 className="font-semibold text-lg">Selecionadas</h3>
                        <ScrollArea className="flex-grow rounded-md border p-4">
                        {songsInPlaylist.length > 0 ? (
                            <div className="space-y-2">
                            {songsInPlaylist.map((song, index) => (
                                <div 
                                    key={song.id} 
                                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-grab active:cursor-grabbing"
                                    draggable
                                    onDragStart={() => (dragItem.current = index)}
                                    onDragEnter={() => (dragOverItem.current = index)}
                                    onDragEnd={handleDragSort}
                                    onDragOver={(e) => e.preventDefault()}
                                >
                                    <div className="flex items-center gap-2">
                                        <GripVertical className="h-5 w-5 text-muted-foreground"/>
                                        <div>
                                            <p className="font-medium">{song.title}</p>
                                            <p className="text-sm text-muted-foreground">{song.artist}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleCheckedChange(song.id, false)}>
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <Music className="w-10 h-10 mb-2"/>
                                <p>Nenhuma música selecionada</p>
                            </div>
                        )}
                        </ScrollArea>
                    </div>
                </div>
            </TabsContent>
             <TabsContent value="lyrics" className="flex-grow overflow-hidden mt-2">
                 <SingleSongView 
                    type="lyrics" 
                    song={activeSong} 
                    songsInPlaylist={songsInPlaylist}
                    onSongSelect={handleShortcutClick}
                    activeSongId={activeSongId}
                />
            </TabsContent>
            <TabsContent value="chords" className="flex-grow overflow-hidden mt-2">
                <SingleSongView 
                    type="chords" 
                    song={activeSong} 
                    songsInPlaylist={songsInPlaylist}
                    onSongSelect={handleShortcutClick}
                    activeSongId={activeSongId}
                />
            </TabsContent>
        </Tabs>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={() => { setIsOpen(false); onOpenChange(false); }}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
