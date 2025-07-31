'use client';

import type { Schedule, Song } from '@/types';
import { useState, useEffect } from 'react';
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
import { Separator } from './ui/separator';
import { X, Music } from 'lucide-react';

interface PlaylistDialogProps {
  schedule: Schedule;
  allSongs: Song[];
  onSave: (scheduleId: string, newPlaylist: string[]) => void;
  onOpenChange: (open: boolean) => void;
}

export function PlaylistDialog({ schedule, allSongs, onSave, onOpenChange }: PlaylistDialogProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [currentPlaylist, setCurrentPlaylist] = useState<string[]>(schedule.playlist);

  useEffect(() => {
    setIsOpen(true);
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

  const songsInPlaylist = allSongs.filter(song => currentPlaylist.includes(song.id));
  const availableSongs = allSongs.filter(song => !currentPlaylist.includes(song.id));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); setIsOpen(open); }}>
      <DialogContent className="max-w-4xl grid-rows-[auto,1fr,auto] h-[90vh] sm:h-auto">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">
            Gerenciar Repertório - {schedule.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
          </DialogTitle>
          <DialogDescription>
            Selecione as músicas para esta escala.
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6 overflow-hidden py-4">
            <div className="flex flex-col gap-4">
                <h3 className="font-semibold text-lg">Disponíveis</h3>
                <ScrollArea className="h-full rounded-md border p-4">
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
            <div className="flex flex-col gap-4">
                <h3 className="font-semibold text-lg">Selecionadas</h3>
                <ScrollArea className="h-full rounded-md border p-4">
                {songsInPlaylist.length > 0 ? (
                    <div className="space-y-2">
                    {songsInPlaylist.map(song => (
                        <div key={song.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                            <div>
                                <p className="font-medium">{song.title}</p>
                                <p className="text-sm text-muted-foreground">{song.artist}</p>
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

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
