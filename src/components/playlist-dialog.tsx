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
import { X, Music, GripVertical } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

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

  useEffect(() => {
    setIsOpen(true);
    setCurrentPlaylist(schedule.playlist);
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
  
  const songsInPlaylist = currentPlaylist.map(id => allSongs.find(song => song.id === id)).filter((s): s is Song => !!s);
  const availableSongs = allSongs.filter(song => !currentPlaylist.includes(song.id));
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); setIsOpen(open); }}>
      <DialogContent className="max-w-md h-[90vh] sm:h-[80vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="font-headline font-bold text-xl sm:text-2xl">
            Gerenciar Repertório - {schedule.name}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Selecione e ordene as músicas para este culto.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="available" className="flex-grow flex flex-col min-h-0 mt-4">
          <TabsList className="grid w-full grid-cols-2 shrink-0">
            <TabsTrigger value="available">Disponíveis ({availableSongs.length})</TabsTrigger>
            <TabsTrigger value="selected">Selecionadas ({songsInPlaylist.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="available" className="flex-grow rounded-md border mt-2 min-h-0">
             <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                {availableSongs.map(song => (
                    <div key={song.id} className="flex items-center space-x-3">
                    <Checkbox 
                        id={`song-${song.id}`} 
                        onCheckedChange={(checked) => handleCheckedChange(song.id, checked)}
                        checked={currentPlaylist.includes(song.id)}
                    />
                    <Label htmlFor={`song-${song.id}`} className="flex flex-col cursor-pointer">
                        <span>{song.title}</span>
                        <span className="text-sm text-muted-foreground">{song.artist}</span>
                    </Label>
                    </div>
                ))}
                </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="selected" className="flex-grow rounded-md border mt-2 min-h-0">
            <ScrollArea className="h-full p-4">
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
                        <div className="flex items-center gap-2 overflow-hidden">
                            <GripVertical className="h-5 w-5 text-muted-foreground shrink-0"/>
                            <div className="truncate">
                                <p className="font-medium truncate">{song.title}</p>
                                <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleCheckedChange(song.id, false)} className="shrink-0">
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
          </TabsContent>
        </Tabs>

        <DialogFooter className="shrink-0 pt-4">
          <Button variant="outline" onClick={() => { setIsOpen(false); onOpenChange(false); }}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}