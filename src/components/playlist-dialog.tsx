
'use client';

import type { Schedule, Song, SongCategory } from '@/types';
import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { X, Music, GripVertical, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

interface PlaylistDialogProps {
  schedule: Schedule;
  allSongs: Song[];
  onSave: (scheduleId: string, newPlaylist: string[]) => void;
  onOpenChange: (open: boolean) => void;
}

const songCategories: SongCategory[] = ['Louvor', 'Hino', 'Infantil'];
const filterCategories: ('all' | SongCategory)[] = ['all', ...songCategories];
const categoryLabels: Record<'all' | SongCategory, string> = {
  all: 'Todas',
  Louvor: 'Louvor',
  Hino: 'Hino',
  Infantil: 'Infantil'
}


export function PlaylistDialog({ schedule, allSongs, onSave, onOpenChange }: PlaylistDialogProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [currentPlaylist, setCurrentPlaylist] = useState<string[]>(schedule.playlist);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | SongCategory>('all');
  
  const handleSave = () => {
    onSave(schedule.id, currentPlaylist);
    setIsOpen(false);
  };

  const handleCheckedChange = (songId: string, checked: boolean | 'indeterminate') => {
    setCurrentPlaylist(prev => 
      checked ? [...prev, songId] : prev.filter(id => id !== songId)
    );
  };
  
  const songsInPlaylist = useMemo(() => 
    currentPlaylist.map(id => allSongs.find(song => song.id === id)).filter((s): s is Song => !!s),
    [currentPlaylist, allSongs]
  );

  const availableSongs = useMemo(() => 
    allSongs.filter(song => 
      !currentPlaylist.includes(song.id) &&
      (activeCategory === 'all' || song.category === activeCategory) &&
      (song.title.toLowerCase().includes(searchTerm.toLowerCase()) || song.artist.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [allSongs, currentPlaylist, searchTerm, activeCategory]
  );
  
  const groupedAvailableSongs = useMemo(() => 
    songCategories.reduce((acc, category) => {
      const filtered = availableSongs.filter(song => song.category === category);
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
      return acc;
    }, {} as Record<SongCategory, Song[]>),
  [availableSongs]);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); setIsOpen(open); }}>
      <DialogContent className="max-w-none w-full h-full sm:h-[90vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="p-4 border-b">
           <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                  <DialogTitle className="text-lg sm:text-xl font-bold">Gerenciar Repertório</DialogTitle>
                  <p className="text-sm text-muted-foreground">{schedule.name}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="shrink-0">
                  <X/>
              </Button>
           </div>
        </DialogHeader>
        
        <main className="flex-grow min-h-0">
            <Tabs defaultValue="available" className="flex flex-col h-full">
            <div className="px-4 pt-4 pb-2 border-b">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="available">Adicionar Músicas</TabsTrigger>
                    <TabsTrigger value="selected">Repertório Selecionado ({songsInPlaylist.length})</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="available" className="flex-grow flex flex-col min-h-0 mt-0">
                <div className="px-4 py-2 border-b flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar por título ou artista..." 
                            className="pl-10" 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                     <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as any)}>
                        <TabsList className="grid w-full grid-cols-4 sm:w-auto">
                           {filterCategories.map(cat => (
                                <TabsTrigger key={cat} value={cat} className="text-xs sm:text-sm">{categoryLabels[cat]}</TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>
                <ScrollArea className="flex-grow p-4">
                    <Accordion type="multiple" defaultValue={songCategories} className="w-full">
                        {Object.entries(groupedAvailableSongs).map(([category, songs]) => (
                            <AccordionItem value={category} key={category}>
                                <AccordionTrigger className="text-base font-semibold">{category} ({songs.length})</AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-4 pt-2">
                                        {songs.map(song => (
                                            <div key={song.id} className="flex items-center space-x-3">
                                                <Checkbox 
                                                    id={`song-${song.id}`} 
                                                    onCheckedChange={(checked) => handleCheckedChange(song.id, checked)}
                                                    checked={currentPlaylist.includes(song.id)}
                                                />
                                                <Label htmlFor={`song-${song.id}`} className="flex flex-col cursor-pointer flex-grow">
                                                    <span>{song.title}</span>
                                                    <span className="text-sm text-muted-foreground">{song.artist}</span>
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </ScrollArea>
            </TabsContent>
            <TabsContent value="selected" className="flex-grow mt-0">
                <ScrollArea className="h-full p-4">
                {songsInPlaylist.length > 0 ? (
                    <div className="space-y-2">
                    {songsInPlaylist.map((song, index) => (
                        <div 
                            key={song.id} 
                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <GripVertical className="h-5 w-5 text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing"/>
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
                        <p className="text-sm">Volte para a aba "Adicionar Músicas" para montar o repertório.</p>
                    </div>
                )}
                </ScrollArea>
            </TabsContent>
            </Tabs>
        </main>
        
        <DialogFooter className="p-4 border-t">
          <Button variant="outline" onClick={() => { setIsOpen(false); onOpenChange(false); }}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar e Fechar</Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
