
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
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator } from './ui/dropdown-menu';
import { cn } from '@/lib/utils';


interface PlaylistDialogProps {
  schedule: Schedule;
  allSongs: Song[];
  onSave: (scheduleId: string, newPlaylist: string[]) => void;
  onOpenChange: (open: boolean) => void;
}

type SortOrder = 'title_asc' | 'quarterly_desc' | 'quarterly_asc' | 'total_desc' | 'total_asc';

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
  const [sortOrder, setSortOrder] = useState<SortOrder>('title_asc');
  
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
  
  const songsInPlaylist = useMemo(() => 
    currentPlaylist.map(id => allSongs.find(song => song.id === id)).filter((s): s is Song => !!s),
    [currentPlaylist, allSongs]
  );

  const availableSongs = useMemo(() => {
    const sortedSongs = [...allSongs].sort((a, b) => {
        switch (sortOrder) {
            case 'quarterly_desc':
                return (b.timesPlayedQuarterly ?? 0) - (a.timesPlayedQuarterly ?? 0);
            case 'quarterly_asc':
                return (a.timesPlayedQuarterly ?? 0) - (b.timesPlayedQuarterly ?? 0);
            case 'total_desc':
                return (b.timesPlayedTotal ?? 0) - (a.timesPlayedTotal ?? 0);
            case 'total_asc':
                return (a.timesPlayedTotal ?? 0) - (b.timesPlayedTotal ?? 0);
            case 'title_asc':
            default:
                return a.title.localeCompare(b.title);
        }
    });

    return sortedSongs.filter(song => 
      !currentPlaylist.includes(song.id) &&
      (activeCategory === 'all' || song.category === activeCategory) &&
      (song.title.toLowerCase().includes(searchTerm.toLowerCase()) || song.artist.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  },[allSongs, currentPlaylist, searchTerm, activeCategory, sortOrder]);
  
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
        <DialogHeader className="p-4 border-b shrink-0">
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
        
        <Tabs defaultValue="available" className="flex-grow min-h-0 flex flex-col">
            <div className="px-4 pt-4 pb-2 border-b shrink-0">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="available">Adicionar Músicas</TabsTrigger>
                    <TabsTrigger value="selected">Selecionadas ({songsInPlaylist.length})</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="available" className="flex-grow flex flex-col min-h-0 mt-0">
                <div className="px-4 py-2 border-b flex flex-col sm:flex-row gap-2 shrink-0">
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto">
                                <ArrowDownUp className="mr-2 h-4 w-4" />
                                Ordenar
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                            <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
                                <DropdownMenuRadioItem value="title_asc">Padrão (A-Z)</DropdownMenuRadioItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioItem value="quarterly_desc">Mais Tocadas (Trimestre)</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="quarterly_asc">Menos Tocadas (Trimestre)</DropdownMenuRadioItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioItem value="total_desc">Mais Tocadas (Total)</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="total_asc">Menos Tocadas (Total)</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                 <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-3 px-4 py-2 border-b text-xs font-medium text-muted-foreground shrink-0">
                    <div className="w-5"></div>
                    <div>Música</div>
                    <div className="text-center w-16">Trimestre</div>
                    <div className="text-center w-16">Total</div>
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
                                                  <div className="font-medium">{song.title}</div>
                                                  <div className="text-sm text-muted-foreground">{song.artist}</div>
                                                </div>
                                                <div className={cn("text-center font-medium p-2 rounded-md transition-colors w-16", getQuarterlyColorClass(song.timesPlayedQuarterly))}>
                                                    {song.timesPlayedQuarterly ?? 0}
                                                </div>
                                                <div className={cn("text-center font-medium p-2 rounded-md transition-colors w-16", getTotalColorClass(song.timesPlayedTotal))}>
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
        
        <DialogFooter className="p-4 border-t shrink-0">
          <Button variant="outline" onClick={() => { setIsOpen(false); onOpenChange(false); }}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar e Fechar</Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
