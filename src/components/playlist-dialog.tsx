
'use client';

import type { Schedule, Song, SongCategory } from '@/types';
import { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
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
import { X, Music, GripVertical, Search, ArrowDownUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { cn } from '@/lib/utils';


interface PlaylistDialogProps {
  schedule: Schedule;
  allSongs: Song[];
  onSave: (scheduleId: string, newPlaylist: string[]) => void;
  onOpenChange: (open: boolean) => void;
}

type SortKey = 'title' | 'quarterly' | 'total';
type SortDirection = 'asc' | 'desc';

const songCategories: SongCategory[] = ['Louvor', 'Hino', 'Infantil'];
const filterCategories: ('all' | SongCategory)[] = ['all', ...songCategories];
const categoryLabels: Record<'all' | SongCategory, string> = {
  all: 'Todas',
  Louvor: 'Louvor',
  Hino: 'Hino',
  Infantil: 'Infantil'
}

const getQuarterlyColorClass = (count: number = 0) => {
    if (count > 4) return 'bg-destructive/40';
    if (count > 2) return 'bg-destructive/20';
    if (count > 0) return 'bg-destructive/10';
    return 'bg-transparent';
}

const getTotalColorClass = (count: number = 0) => {
    if (count > 40) return 'bg-destructive/40';
    if (count > 25) return 'bg-destructive/20';
    if (count > 10) return 'bg-destructive/10';
    return 'bg-transparent';
}

export function PlaylistDialog({ schedule, allSongs, onSave, onOpenChange }: PlaylistDialogProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [currentPlaylist, setCurrentPlaylist] = useState<string[]>(schedule.playlist);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | SongCategory>('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'title', direction: 'asc' });

  const handleSave = () => {
    onSave(schedule.id, currentPlaylist);
    setIsOpen(false);
  };

  const handleCheckedChange = (songId: string, checked: boolean | 'indeterminate') => {
    setCurrentPlaylist(prev => 
      checked ? [...prev, songId] : prev.filter(id => id !== songId)
    );
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(currentPlaylist);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setCurrentPlaylist(items);
  };

  const handleSort = (key: SortKey) => {
    const isNumeric = key === 'quarterly' || key === 'total';
    let newDirection: SortDirection = 'asc';

    if (sortConfig.key === key) {
      newDirection = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      newDirection = isNumeric ? 'desc' : 'asc';
    }
    setSortConfig({ key, direction: newDirection });
  };
  
  const songsInPlaylist = useMemo(() => 
    currentPlaylist.map(id => allSongs.find(song => song.id === id)).filter((s): s is Song => !!s),
    [currentPlaylist, allSongs]
  );

  const availableSongs = useMemo(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const sortedSongs = [...allSongs].sort((a, b) => {
        const { key, direction } = sortConfig;
        const dir = direction === 'asc' ? 1 : -1;

        switch (key) {
            case 'quarterly':
                return ((a.timesPlayedQuarterly ?? 0) - (b.timesPlayedQuarterly ?? 0)) * dir;
            case 'total':
                return ((a.timesPlayedTotal ?? 0) - (b.timesPlayedTotal ?? 0)) * dir;
            case 'title':
            default:
                return a.title.localeCompare(b.title) * dir;
        }
    });

    return sortedSongs.filter(song => 
      !currentPlaylist.includes(song.id) &&
      (activeCategory === 'all' || song.category === activeCategory) &&
      (song.title.toLowerCase().includes(lowercasedSearchTerm) || 
       song.artist.toLowerCase().includes(lowercasedSearchTerm) ||
       (song.lyrics || '').toLowerCase().includes(lowercasedSearchTerm))
    )
  },[allSongs, currentPlaylist, searchTerm, activeCategory, sortConfig]);
  
  const groupedAvailableSongs = useMemo(() => 
    songCategories.reduce((acc, category) => {
      const filtered = availableSongs.filter(song => song.category === category);
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
      return acc;
    }, {} as Record<SongCategory, Song[]>),
  [availableSongs]);
  
  const hasChords = (song: Song) => song.chords && song.chords.includes('[');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); setIsOpen(open); }}>
      <DialogContent className="max-w-none w-full h-full sm:h-[90vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="p-4 border-b shrink-0 relative flex-row items-center justify-center">
            <DialogTitle className="text-base sm:text-lg font-bold text-center">
                Gerenciar Repertório - <span className="text-muted-foreground font-medium">{schedule.name}</span>
            </DialogTitle>
           <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="shrink-0 absolute top-1/2 right-3 -translate-y-1/2 h-8 w-8">
              <X className="h-5 w-5"/>
           </Button>
        </DialogHeader>
        
        <Tabs defaultValue="available" className="flex-grow min-h-0 flex flex-col">
            <div className="px-4 pt-2 pb-2 border-b shrink-0">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="available">Adicionar Músicas</TabsTrigger>
                    <TabsTrigger value="selected">Selecionadas ({songsInPlaylist.length})</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="available" className="flex-grow flex flex-col min-h-0 mt-0">
                <div className="px-4 py-3 border-b flex flex-col gap-3 shrink-0">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar por título, artista ou letra..." 
                            className="pl-10 h-10" 
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
                 <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 px-4 py-2 border-b text-xs font-medium text-muted-foreground shrink-0">
                    <button onClick={() => handleSort('title')} className="flex items-center gap-1 text-left">
                        Música 
                        {sortConfig.key === 'title' && <ArrowDownUp className="h-3 w-3" />}
                    </button>
                    <button onClick={() => handleSort('quarterly')} className="w-20 text-center flex items-center justify-center gap-1">
                        Trimestre
                        {sortConfig.key === 'quarterly' && <ArrowDownUp className="h-3 w-3" />}
                    </button>
                    <button onClick={() => handleSort('total')} className="w-20 text-center flex items-center justify-center gap-1">
                        Total
                        {sortConfig.key === 'total' && <ArrowDownUp className="h-3 w-3" />}
                    </button>
                </div>
                <ScrollArea className="flex-grow">
                    <Accordion type="multiple" defaultValue={songCategories} className="w-full">
                        {Object.entries(groupedAvailableSongs).map(([category, songs]) => (
                            <AccordionItem value={category} key={category} className="border-b-0">
                                <AccordionTrigger className="text-base font-semibold px-4 py-3 hover:no-underline bg-muted/50 border-b">
                                    {category} ({songs.length})
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="divide-y divide-border">
                                        {songs.map(song => (
                                            <Label 
                                                htmlFor={`song-${song.id}`} 
                                                key={song.id} 
                                                className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-3 p-4 pl-3 cursor-pointer hover:bg-accent/50"
                                            >
                                                <Checkbox 
                                                    id={`song-${song.id}`} 
                                                    onCheckedChange={(checked) => handleCheckedChange(song.id, checked)}
                                                    checked={currentPlaylist.includes(song.id)}
                                                />
                                                <div>
                                                  <div className="font-medium flex items-center gap-2">
                                                    {hasChords(song) && <Music className="h-3 w-3 text-muted-foreground" />}
                                                    <span>{song.title}</span>
                                                  </div>
                                                  <div className="text-sm text-muted-foreground">{song.artist}</div>
                                                </div>
                                                <div className={cn("text-center font-medium p-2 rounded-md transition-colors w-20", getQuarterlyColorClass(song.timesPlayedQuarterly))}>
                                                    {song.timesPlayedQuarterly ?? 0}
                                                </div>
                                                 <div className={cn("text-center font-medium p-2 rounded-md transition-colors w-20", getTotalColorClass(song.timesPlayedTotal))}>
                                                    {song.timesPlayedTotal ?? 0}
                                                </div>
                                            </Label>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </ScrollArea>
            </TabsContent>
            <TabsContent value="selected" className="flex-grow mt-0 flex flex-col min-h-0">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="playlist">
                      {(provided) => (
                        <ScrollArea 
                          className="h-full flex-grow p-4"
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                        >
                          {songsInPlaylist.length > 0 ? (
                              <div className="space-y-2">
                              {songsInPlaylist.map((song, index) => (
                                <Draggable key={song.id} draggableId={song.id} index={index}>
                                  {(provided) => (
                                    <div 
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted bg-card"
                                    >
                                      <div className="flex items-center gap-3 overflow-hidden">
                                        <div {...provided.dragHandleProps}>
                                          <GripVertical className="h-5 w-5 text-muted-foreground shrink-0"/>
                                        </div>
                                        <div className="truncate">
                                            <p className="font-medium truncate">{song.title}</p>
                                            <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                                        </div>
                                      </div>
                                      <Button variant="ghost" size="icon" onClick={() => handleCheckedChange(song.id, false)} className="shrink-0">
                                          <X className="h-4 w-4"/>
                                      </Button>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                              </div>
                          ) : (
                              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                  <Music className="w-10 h-10 mb-2"/>
                                  <p>Nenhuma música selecionada</p>
                                  <p className="text-sm">Volte para a aba "Adicionar Músicas" para montar o repertório.</p>
                              </div>
                          )}
                        </ScrollArea>
                      )}
                    </Droppable>
                </DragDropContext>
            </TabsContent>
        </Tabs>
        
        <DialogFooter className="p-3 border-t shrink-0 flex-row justify-center gap-2">
          <Button variant="outline" onClick={() => { setIsOpen(false); onOpenChange(false); }} className="w-full">Cancelar</Button>
          <Button onClick={handleSave} className="w-full">Salvar</Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
