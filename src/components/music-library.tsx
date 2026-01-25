'use client';

import type { Song, SongCategory } from '@/types';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Trash2, Edit, Music, ArrowDownUp } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
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
import { useIsMobile } from '@/hooks/use-is-mobile';


interface MusicLibraryProps {
  songs: Song[];
  onSongsDelete: (songIds: string[]) => void;
  onSelectionChange: (songIds: string[]) => void;
  onBulkEdit: () => void;
  isReadOnly?: boolean;
}

const categories: (SongCategory | 'all')[] = ['all', 'Louvor', 'Hino', 'Infantil'];
const categoryLabels: Record<SongCategory | 'all', string> = {
  all: 'Todas',
  Louvor: 'Louvores',
  Hino: 'Hinos',
  Infantil: 'Infantis'
}

type QuickFilter = 'all' | 'new' | 'with_chords';
const quickFilters: QuickFilter[] = ['all', 'new', 'with_chords'];
const quickFilterLabels: Record<QuickFilter, string> = {
  all: 'Todas',
  new: 'Novas',
  with_chords: 'Com Cifras'
};


type SortKey = 'title' | 'artist' | 'category' | 'key' | 'timesPlayedQuarterly';
type SortDirection = 'asc' | 'desc';

const getQuarterlyColorClass = (count: number = 0) => {
    if (count > 4) return 'bg-destructive/40';
    if (count > 2) return 'bg-destructive/20';
    if (count > 0) return 'bg-destructive/10';
    return 'bg-transparent';
}

export function MusicLibrary({ songs, onSongsDelete, onSelectionChange, onBulkEdit, isReadOnly = false }: MusicLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<SongCategory | 'all'>('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'title', direction: 'asc' });
  const router = useRouter();
  const isMobile = useIsMobile();

  const handleSort = (key: SortKey) => {
    const isNumeric = key === 'timesPlayedQuarterly';
    let newDirection: SortDirection = 'asc';

    if (sortConfig.key === key) {
      newDirection = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      newDirection = isNumeric ? 'desc' : 'asc';
    }
    setSortConfig({ key, direction: newDirection });
  };

  const hasChords = (song: Song) => song.chords && song.chords.includes('[');

  const categoryCounts = useMemo(() => {
    const counts: Record<SongCategory | 'all', number> = {
      all: songs.length,
      Louvor: 0,
      Hino: 0,
      Infantil: 0,
    };
    songs.forEach(song => {
      if (song.category && counts[song.category] !== undefined) {
        counts[song.category]++;
      }
    });
    return counts;
  }, [songs]);

  const filteredSongs = useMemo(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();

    const applyFilters = (song: Song) => {
        if (activeCategory !== 'all' && song.category !== activeCategory) return false;

        if (quickFilter === 'new' && !song.isNew) return false;
        if (quickFilter === 'with_chords' && !hasChords(song)) return false;
        
        return true;
    };


    if (!lowercasedSearchTerm) {
        const filtered = songs.filter(applyFilters);

        return [...filtered].sort((a, b) => {
            const { key, direction } = sortConfig;
            const dir = direction === 'asc' ? 1 : -1;
            const aVal = a[key] ?? (typeof a[key] === 'number' ? 0 : '');
            const bVal = b[key] ?? (typeof b[key] === 'number' ? 0 : '');
            if (key === 'timesPlayedQuarterly') {
                return ((aVal as number) - (bVal as number)) * dir;
            }
            return (aVal as string).localeCompare(bVal as string) * dir;
        });
    }

    const searchResults = songs
        .map(song => {
            const titleMatch = song.title.toLowerCase().includes(lowercasedSearchTerm);
            const artistMatch = song.artist.toLowerCase().includes(lowercasedSearchTerm);
            const lyricsMatch = (song.lyrics || '').toLowerCase().includes(lowercasedSearchTerm);
            
            const relevance = titleMatch || artistMatch ? 1 : (lyricsMatch ? 2 : 0);
            
            return { song, relevance };
        })
        .filter(({ song, relevance }) => 
            relevance > 0 && applyFilters(song)
        );

    searchResults.sort((a, b) => {
        if (a.relevance !== b.relevance) {
            return a.relevance - b.relevance;
        }

        const { key, direction } = sortConfig;
        const dir = direction === 'asc' ? 1 : -1;
        const aVal = a.song[key] ?? (typeof a.song[key] === 'number' ? 0 : '');
        const bVal = b.song[key] ?? (typeof b.song[key] === 'number' ? 0 : '');

        if (key === 'timesPlayedQuarterly') {
            return ((aVal as number) - (bVal as number)) * dir;
        }
        return (aVal as string).localeCompare(bVal as string) * dir;
    });

    return searchResults.map(item => item.song);
  }, [songs, activeCategory, searchTerm, sortConfig, quickFilter]);

  useEffect(() => {
    onSelectionChange(selectedSongs);
  }, [selectedSongs, onSelectionChange]);
  
  const handleRowClick = (songId: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[role="checkbox"]') || (e.target as HTMLElement).closest('button')) {
      return;
    }
    router.push(`/music/${songId}`);
  };

  const toggleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked) {
      setSelectedSongs(filteredSongs.map(s => s.id));
    } else {
      setSelectedSongs([]);
    }
  }
  
  const toggleSongSelection = (songId: string) => {
    setSelectedSongs(prev => 
      prev.includes(songId) 
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    );
  }

  const handleDeleteSelected = () => {
    onSongsDelete(selectedSongs);
    setSelectedSongs([]);
    setIsAlertOpen(false);
  }
  
  const SortableHeader = ({ sortKey, label, className }: {sortKey: SortKey, label: string, className?: string}) => (
      <Button variant="ghost" onClick={() => handleSort(sortKey)} className={cn("px-2 py-1 h-auto -ml-2", className)}>
        {label}
        {sortConfig.key === sortKey && <ArrowDownUp className="ml-2 h-3 w-3" />}
      </Button>
  );

  const isAllFilteredSelected = selectedSongs.length > 0 && selectedSongs.length === filteredSongs.length && filteredSongs.length > 0;
  const isAnyFilteredSelected = selectedSongs.length > 0;
  const isIndeterminate = isAnyFilteredSelected && !isAllFilteredSelected;
  const showFilters = !(isMobile && searchTerm);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por título, artista ou letra..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {showFilters && (
            <div className="flex flex-col sm:flex-row gap-2">
            <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as any)}>
                <TabsList className="grid w-full grid-cols-4 sm:w-auto h-auto">
                {categories.map((cat) => (
                    <TabsTrigger
                    key={cat}
                    value={cat}
                    className="text-xs sm:text-sm flex flex-col sm:flex-row sm:gap-1.5 py-1.5 h-auto"
                    >
                    <span className="sm:hidden text-xs text-muted-foreground/80 font-mono pb-1">
                        {categoryCounts[cat]}
                    </span>
                    <span>{categoryLabels[cat]}</span>
                    <span className="hidden sm:inline text-xs text-muted-foreground/80 font-mono">
                        ({categoryCounts[cat]})
                    </span>
                    </TabsTrigger>
                ))}
                </TabsList>
            </Tabs>
            <Tabs value={quickFilter} onValueChange={(value) => setQuickFilter(value as any)}>
                <TabsList className="grid w-full h-10 grid-cols-3 sm:w-auto">
                    {quickFilters.map(filter => (
                        <TabsTrigger key={filter} value={filter} className="text-xs sm:text-sm">{quickFilterLabels[filter]}</TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
            </div>
        )}
      </div>

      <div className="h-10">
        {selectedSongs.length > 0 && !isReadOnly && (
          <div className="flex justify-between items-center bg-muted/50 p-2 rounded-lg">
            <span className="text-sm font-medium">{selectedSongs.length} música(s) selecionada(s)</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onBulkEdit}>
                  <Edit className="mr-2 h-4 w-4"/>
                  Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setIsAlertOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4"/>
                  Excluir
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {!isReadOnly && (
                <TableHead className="w-12">
                  <Checkbox 
                    checked={isAllFilteredSelected || (isIndeterminate ? 'indeterminate' : false)} 
                    onCheckedChange={toggleSelectAll} 
                    aria-label="Selecionar todas as músicas visíveis"
                    disabled={filteredSongs.length === 0}
                  />
                </TableHead>
              )}
              <TableHead>
                 <SortableHeader sortKey="title" label="Título" />
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                <SortableHeader sortKey="artist" label="Artista" />
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <SortableHeader sortKey="category" label="Categoria" />
              </TableHead>
              <TableHead className="hidden sm:table-cell text-center">
                 <SortableHeader sortKey="key" label="Tom" />
              </TableHead>
              <TableHead className="w-24 text-center">
                 <SortableHeader sortKey="timesPlayedQuarterly" label="Trimestre" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSongs.length > 0 ? (
              filteredSongs.map((song) => (
                <TableRow 
                  key={song.id} 
                  onClick={(e) => handleRowClick(song.id, e)} 
                  className="cursor-pointer"
                  data-state={selectedSongs.includes(song.id) ? 'selected' : ''}
                >
                  {!isReadOnly && (
                    <TableCell>
                      <Checkbox 
                        checked={selectedSongs.includes(song.id)}
                        onCheckedChange={() => toggleSongSelection(song.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Selecionar ${song.title}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {hasChords(song) && <Music className="h-3 w-3 text-muted-foreground" />}
                      <span>{song.title}</span>
                      {song.isNew && <Badge variant="outline" className="border-green-500 text-green-500">Nova</Badge>}
                    </div>
                    <div className="text-muted-foreground text-xs sm:hidden ml-5">{song.artist}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden sm:table-cell">{song.artist}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary">{song.category}</Badge>
                  </TableCell>
                  <TableCell className="text-center hidden sm:table-cell">
                    <Badge variant="outline">{song.key}</Badge>
                  </TableCell>
                  <TableCell className={cn("text-center font-medium p-1 text-xs", getQuarterlyColorClass(song.timesPlayedQuarterly))}>
                      {song.timesPlayedQuarterly ?? 0}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isReadOnly ? 5 : 6} className="h-24 text-center">
                  Nenhuma música encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

       <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Essa ação não pode ser desfeita. Isso excluirá permanentemente {selectedSongs.length} música(s) da biblioteca e de todos os repertórios.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSelected}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
