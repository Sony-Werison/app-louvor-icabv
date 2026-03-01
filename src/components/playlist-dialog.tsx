
'use client';

import type { Schedule, Song, SongCategory } from '@/types';
import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { X, Music, Search, ArrowDownUp, ArrowUp, ArrowDown, AlertTriangle, Eye, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from './ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Badge } from './ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/context/auth-context';
import { useSchedule } from '@/context/schedule-context';


interface PlaylistDialogProps {
  schedule: Schedule;
  allSongs: Song[];
  onSave: (scheduleId: string, newPlaylist: string[]) => void;
  onOpenChange: (open: boolean) => void;
  repeatedSongIds?: Set<string>;
}

type SortKey = 'title' | 'quarterly';
type SortDirection = 'asc' | 'desc';

const songCategories: SongCategory[] = ['Louvor', 'Hino', 'Infantil'];
const filterCategories: ('all' | SongCategory)[] = ['all', ...songCategories];
const categoryLabels: Record<'all' | SongCategory, string> = {
  all: 'Todas',
  Louvor: 'Louvor',
  Hino: 'Hino',
  Infantil: 'Infantil'
}

type QuickFilter = 'all' | 'new' | 'with_chords';
const quickFilters: QuickFilter[] = ['all', 'new', 'with_chords'];
const quickFilterLabels: Record<QuickFilter, string> = {
  all: 'Todas',
  new: 'Novas',
  with_chords: 'Com Cifras'
};


const getQuarterlyColorClass = (count: number = 0) => {
    if (count > 4) return 'bg-destructive/40';
    if (count > 2) return 'bg-destructive/20';
    if (count > 0) return 'bg-destructive/10';
    return 'bg-transparent';
}

export function PlaylistDialog({ schedule, allSongs, onSave, onOpenChange, repeatedSongIds = new Set() }: PlaylistDialogProps) {
  const { can } = useAuth();
  const { updateSong } = useSchedule();
  const [isOpen, setIsOpen] = useState(true);
  const [currentPlaylist, setCurrentPlaylist] = useState<string[]>(schedule.playlist);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | SongCategory>('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'title', direction: 'asc' });
  const [duplicatedInCurrent, setDuplicatedInCurrent] = useState<Set<string>>(new Set());
  const [songToPreview, setSongToPreview] = useState<Song | null>(null);
  const [songToLink, setSongToLink] = useState<Song | null>(null);
  const [tempLinks, setTempLinks] = useState<{ name: string, url: string }[]>([]);
  const isMobile = useIsMobile();

  const isAdmin = can('edit:songs');

  useEffect(() => {
    const counts = new Map<string, number>();
    currentPlaylist.forEach(id => {
      counts.set(id, (counts.get(id) || 0) + 1);
    });
    const duplicates = new Set<string>();
    for (const [id, count] of counts.entries()) {
      if (count > 1) {
        duplicates.add(id);
      }
    }
    setDuplicatedInCurrent(duplicates);
  }, [currentPlaylist]);


  const handleSave = () => {
    onSave(schedule.id, currentPlaylist);
    setIsOpen(false);
  };

  const handleCheckedChange = (songId: string, checked: boolean | 'indeterminate') => {
    setCurrentPlaylist(prev => 
      checked ? [...prev, songId] : prev.filter(id => id !== songId)
    );
  };

  const handleMoveSong = (index: number, direction: 'up' | 'down') => {
    const newPlaylist = [...currentPlaylist];
    const [song] = newPlaylist.splice(index, 1);
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    newPlaylist.splice(newIndex, 0, song);
    setCurrentPlaylist(newPlaylist);
  };

  const handleSort = (key: SortKey) => {
    const isNumeric = key === 'quarterly';
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
  
  const hasChords = (song: Song) => {
    return !!(song.pdfLinks && song.pdfLinks.length > 0);
  };

  const availableSongs = useMemo(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();

    const songsToFilter = allSongs.filter(song => !currentPlaylist.includes(song.id));
    
    const applyFilters = (song: Song) => {
        if (activeCategory !== 'all' && song.category !== activeCategory) return false;
        if (quickFilter === 'new' && !song.isNew) return false;
        if (quickFilter === 'with_chords' && !hasChords(song)) return false;
        return true;
    };

    if (!lowercasedSearchTerm) {
        const filtered = songsToFilter.filter(applyFilters);
        return [...filtered].sort((a, b) => {
            const { key, direction } = sortConfig;
            const dir = direction === 'asc' ? 1 : -1;
            switch (key) {
                case 'quarterly': return ((a.timesPlayedQuarterly ?? 0) - (b.timesPlayedQuarterly ?? 0)) * dir;
                case 'title': default: return a.title.localeCompare(b.title) * dir;
            }
        });
    }

    const searchResults = songsToFilter
        .map(song => {
            const titleMatch = song.title.toLowerCase().includes(lowercasedSearchTerm);
            const artistMatch = song.artist.toLowerCase().includes(lowercasedSearchTerm);
            const lyricsMatch = (song.lyrics || '').toLowerCase().includes(lowercasedSearchTerm);
            
            const relevance = titleMatch || artistMatch ? 1 : (lyricsMatch ? 2 : 0);
            
            return { song, relevance };
        })
        .filter(({ song, relevance }) => relevance > 0 && applyFilters(song));
        
    searchResults.sort((a, b) => {
        if (a.relevance !== b.relevance) {
            return a.relevance - b.relevance;
        }

        const { key, direction } = sortConfig;
        const dir = direction === 'asc' ? 1 : -1;
        switch (key) {
            case 'quarterly': return ((a.song.timesPlayedQuarterly ?? 0) - (b.song.timesPlayedQuarterly ?? 0)) * dir;
            case 'title': default: return a.song.title.localeCompare(b.song.title) * dir;
        }
    });

    return searchResults.map(item => item.song);
  },[allSongs, currentPlaylist, searchTerm, activeCategory, sortConfig, quickFilter]);
  
  const groupedAvailableSongs = useMemo(() => 
    songCategories.reduce((acc, category) => {
      const filtered = availableSongs.filter(song => song.category === category);
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
      return acc;
    }, {} as Record<SongCategory, Song[]>),
  [availableSongs]);
  
  const isRepeated = (songId: string) => repeatedSongIds.has(songId) || duplicatedInCurrent.has(songId);
  const showFilters = !(isMobile && searchTerm);

  const handleOpenLinkEditor = (song: Song) => {
    setSongToLink(song);
    setTempLinks(song.pdfLinks ? [...song.pdfLinks] : []);
  }

  const handleSaveLinks = async () => {
    if (songToLink) {
        await updateSong(songToLink.id, { pdfLinks: tempLinks });
        setSongToLink(null);
    }
  }

  const removeTempLink = (index: number) => {
    setTempLinks(prev => prev.filter((_, i) => i !== index));
  }

  const addTempLink = () => {
    setTempLinks(prev => [...prev, { name: '', url: '' }]);
  }

  const updateTempLink = (index: number, field: 'name' | 'url', value: string) => {
    setTempLinks(prev => prev.map((link, i) => i === index ? { ...link, [field]: value } : link));
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); setIsOpen(open); }}>
      <DialogContent className="max-w-none w-full h-full sm:h-[90vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="p-4 border-b shrink-0">
            <DialogTitle className="text-base sm:text-lg font-bold text-center">
                Gerenciar Repertório - <span className="text-muted-foreground font-medium">{schedule.name}</span>
            </DialogTitle>
             <DialogDescription className="text-center">
                Adicione, remova e reordene as músicas do repertório.
            </DialogDescription>
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
                    {showFilters && (
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as any)}>
                                <TabsList className="grid w-full grid-cols-4 sm:w-auto">
                                {filterCategories.map(cat => (
                                        <TabsTrigger key={cat} value={cat} className="text-xs sm:text-sm">{categoryLabels[cat]}</TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                            <Tabs value={quickFilter} onValueChange={(v) => setQuickFilter(v as any)}>
                                <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                                {quickFilters.map(filter => (
                                        <TabsTrigger key={filter} value={filter} className="text-xs sm:text-sm">{quickFilterLabels[filter]}</TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                        </div>
                    )}
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
                    <div className="w-24" />
                </div>
                <ScrollArea className="flex-grow">
                    <TooltipProvider>
                    <Accordion type="multiple" defaultValue={songCategories} className="w-full">
                        {Object.entries(groupedAvailableSongs).map(([category, songs]) => (
                            <AccordionItem value={category} key={category} className="border-b-0">
                                <AccordionTrigger className="text-base font-semibold px-4 py-3 hover:no-underline bg-muted/50 border-b">
                                    {category} ({songs.length})
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="divide-y divide-border">
                                        {songs.map(song => (
                                            <div key={song.id} className="group grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-3 p-4 pl-3 hover:bg-accent/50">
                                                <Checkbox 
                                                    id={`song-${song.id}`} 
                                                    onCheckedChange={(checked) => handleCheckedChange(song.id, checked)}
                                                    checked={currentPlaylist.includes(song.id)}
                                                />
                                                <Label htmlFor={`song-${song.id}`} className="cursor-pointer">
                                                  <div className="font-medium flex items-center gap-2">
                                                    <span>{song.title}</span>
                                                    {hasChords(song) && <Music className="h-3 w-3 text-primary opacity-70" />}
                                                    {song.isNew && <Badge variant="outline" className="border-green-500 text-green-500 h-4 text-[10px] px-1">Nova</Badge>}
                                                    {isRepeated(song.id) && (
                                                      <Tooltip>
                                                        <TooltipTrigger>
                                                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                          <p>Essa música já está em outro repertório no mesmo dia.</p>
                                                        </TooltipContent>
                                                      </Tooltip>
                                                    )}
                                                  </div>
                                                  <div className="text-sm text-muted-foreground">{song.artist}</div>
                                                </Label>
                                                <div className={cn("text-center font-medium p-2 rounded-md transition-colors w-20", getQuarterlyColorClass(song.timesPlayedQuarterly))}>
                                                    {song.timesPlayedQuarterly ?? 0}
                                                </div>
                                                <div className="flex items-center gap-1 w-24 justify-end">
                                                    {isAdmin && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        handleOpenLinkEditor(song);
                                                                    }}
                                                                >
                                                                    <LinkIcon className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Editar Link de Cifra</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setSongToPreview(song);
                                                                }}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Pré-visualizar Letra</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                    </TooltipProvider>
                </ScrollArea>
            </TabsContent>
            <TabsContent value="selected" className="flex-grow mt-0 flex flex-col min-h-0">
                <ScrollArea className="h-full flex-grow p-4">
                  {songsInPlaylist.length > 0 ? (
                      <div className="space-y-2">
                      <AnimatePresence>
                      {songsInPlaylist.map((song, index) => (
                        <motion.div 
                          key={`${song.id}-${index}`}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          className="grid grid-cols-[auto_1fr_auto] items-center gap-2 p-2 rounded-md hover:bg-muted bg-card border"
                        >
                           <div className="flex items-center gap-3">
                                <div className="flex flex-col shrink-0">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleMoveSong(index, 'up')}
                                        disabled={index === 0}
                                        className="h-6 w-6"
                                    >
                                        <ArrowUp className="h-4 w-4"/>
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleMoveSong(index, 'down')}
                                        disabled={index === songsInPlaylist.length - 1}
                                        className="h-6 w-6"
                                    >
                                        <ArrowDown className="h-4 w-4"/>
                                    </Button>
                                </div>
                                <span className="text-sm font-bold text-muted-foreground w-5 text-center shrink-0">{index + 1}</span>
                           </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                     {isRepeated(song.id) && (
                                      <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Música repetida no mesmo dia.</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    <p className="font-medium truncate">{song.title}</p>
                                    {hasChords(song) && <Music className="h-3 w-3 text-primary opacity-70" />}
                                    {song.isNew && <Badge variant="outline" className="border-green-500 text-green-500 h-4 text-[10px] px-1">Nova</Badge>}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                            </div>

                          <div className="flex items-center gap-1">
                              {isAdmin && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    onClick={() => handleOpenLinkEditor(song)}
                                >
                                    <LinkIcon className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => {
                                      const newPlaylist = [...currentPlaylist];
                                      newPlaylist.splice(index, 1);
                                      setCurrentPlaylist(newPlaylist);
                                  }}
                                  className="shrink-0 h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                              >
                                  <X className="h-4 w-4"/>
                              </Button>
                          </div>
                        </motion.div>
                      ))}
                      </AnimatePresence>
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
        
        <DialogFooter className="p-3 border-t shrink-0 flex-row justify-center gap-2">
          <Button variant="outline" onClick={() => { setIsOpen(false); onOpenChange(false); }} className="w-full">Cancelar</Button>
          <Button onClick={handleSave} className="w-full">Salvar</Button>
        </DialogFooter>

        {songToPreview && (
            <Dialog open={!!songToPreview} onOpenChange={(isOpen) => !isOpen && setSongToPreview(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{songToPreview.title}</DialogTitle>
                        <DialogDescription>{songToPreview.artist}</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh]">
                        <pre className="whitespace-pre-wrap font-body text-sm py-4">
                            {songToPreview.lyrics || 'Nenhuma letra disponível.'}
                        </pre>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        )}

        {songToLink && (
            <Dialog open={!!songToLink} onOpenChange={(isOpen) => !isOpen && setSongToLink(null)}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Editar Links de Cifra</DialogTitle>
                        <DialogDescription>
                            Adicione links do Google Drive ou Docs para <strong>{songToLink.title}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">Links Externos</Label>
                            <Button variant="outline" size="sm" onClick={addTempLink}>
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar
                            </Button>
                        </div>
                        <ScrollArea className="max-h-60 border rounded-md p-3">
                            <div className="space-y-3">
                                {tempLinks.map((link, index) => (
                                    <div key={index} className="flex gap-2 items-start bg-muted/20 p-2 rounded-lg relative group/link">
                                        <div className="grid flex-1 gap-2">
                                            <Input 
                                                placeholder="Nome (ex: Cifra Completa)" 
                                                className="h-8 text-xs" 
                                                value={link.name} 
                                                onChange={e => updateTempLink(index, 'name', e.target.value)}
                                            />
                                            <Input 
                                                placeholder="URL (Google Drive / Docs)" 
                                                className="h-8 text-xs" 
                                                value={link.url} 
                                                onChange={e => updateTempLink(index, 'url', e.target.value)}
                                            />
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-destructive opacity-0 group-hover/link:opacity-100 transition-opacity" 
                                            onClick={() => removeTempLink(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {tempLinks.length === 0 && (
                                    <p className="text-center text-xs text-muted-foreground py-4">Nenhum link cadastrado.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSongToLink(null)}>Cancelar</Button>
                        <Button onClick={handleSaveLinks}>Salvar Links</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
