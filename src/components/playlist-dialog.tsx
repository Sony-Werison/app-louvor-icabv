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
import { X, Music, GripVertical, ListMusic } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface PlaylistDialogProps {
  schedule: Schedule;
  allSongs: Song[];
  onSave: (scheduleId: string, newPlaylist: string[]) => void;
  onOpenChange: (open: boolean) => void;
}

export function PlaylistDialog({ schedule, allSongs, onSave, onOpenChange }: PlaylistDialogProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [currentPlaylist, setCurrentPlaylist] = useState<string[]>(schedule.playlist);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [activeSong, setActiveSong] = useState<string | null>(null);


  useEffect(() => {
    setIsOpen(true);
    setCurrentPlaylist(schedule.playlist);
  }, [schedule]);

  const handleSave = () => {
    onSave(schedule.id, currentPlaylist);
    setIsOpen(false);
  };

  const handleCheckedChange = (songId: string, checked: boolean | 'indeterminate') => {
    if (checked) {
      setCurrentPlaylist(prev => [...prev, songId]);
    } else {
      setCurrentPlaylist(prev => prev.filter(id => id !== songId));
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
    const element = document.getElementById(`song-content-${songId}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveSong(songId);
    }
  }

  const songsInPlaylist = currentPlaylist.map(id => allSongs.find(song => song.id === id)).filter((s): s is Song => !!s);
  const availableSongs = allSongs.filter(song => !currentPlaylist.includes(song.id));
  
  const ConsolidatedView = ({ type }: { type: 'lyrics' | 'chords' }) => (
    <div className="grid md:grid-cols-[250px_1fr] gap-6 h-full py-4">
        <div className="flex flex-col gap-4 h-full">
            <h3 className="font-semibold text-lg flex items-center gap-2"><ListMusic className="w-5 h-5" /> Repertório</h3>
             <ScrollArea className="flex-grow rounded-md border">
                <div className="p-2 space-y-1">
                    {songsInPlaylist.map((song) => (
                        <Button 
                            key={`shortcut-${song.id}`}
                            variant={activeSong === song.id ? "secondary" : "ghost"}
                            className="w-full justify-start h-auto py-2 px-3 text-left"
                            onClick={() => handleShortcutClick(song.id)}
                        >
                             <div className="flex flex-col">
                                <span>{song.title}</span>
                                <span className="text-xs text-muted-foreground">{song.artist}</span>
                            </div>
                        </Button>
                    ))}
                </div>
            </ScrollArea>
        </div>
         <ScrollArea className="h-full rounded-md border">
            <div className="p-6 space-y-8">
                {songsInPlaylist.map(song => (
                    <div key={`${type}-${song.id}`} id={`song-content-${song.id}`}>
                        <h3 className="font-bold text-xl font-headline">{song.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{song.artist}</p>
                        <pre className={cn("whitespace-pre-wrap text-base leading-relaxed", type === 'lyrics' ? 'font-body': 'font-code')}>
                            {type === 'lyrics' ? (song.lyrics || 'Nenhuma letra disponível.') : (song.chords || 'Nenhuma cifra disponível.')}
                        </pre>
                    </div>
                ))}
            </div>
        </ScrollArea>
    </div>
  );


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); setIsOpen(open); }}>
      <DialogContent className="max-w-4xl grid-rows-[auto,1fr,auto] h-[90vh] sm:h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-headline font-bold text-2xl">
            Gerenciar Repertório - {schedule.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
          </DialogTitle>
          <DialogDescription>
            Selecione, ordene e visualize as músicas para este culto.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="selection" className="flex flex-col overflow-hidden" onValueChange={() => setActiveSong(null)}>
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
            <TabsContent value="lyrics" className="flex-grow overflow-auto mt-2">
                 <ConsolidatedView type="lyrics" />
            </TabsContent>
            <TabsContent value="chords" className="flex-grow overflow-auto mt-2">
                <ConsolidatedView type="chords" />
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
