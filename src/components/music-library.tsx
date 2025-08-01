
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

type ChordFilter = 'all' | 'with' | 'without';
const chordFilters: ChordFilter[] = ['all', 'with', 'without'];
const chordFilterLabels: Record<ChordFilter, string> = {
  all: 'Todas',
  with: 'Com Cifras',
  without: 'Sem Cifras'
}

type SortKey = 'title' | 'artist' | 'category' | 'key' | 'timesPlayedQuarterly' | 'timesPlayedTotal';
type SortDirection = 'asc' | 'desc';

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

export function MusicLibrary({ songs, onSongsDelete, onSelectionChange, onBulkEdit, isReadOnly = false }: MusicLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<SongCategory | 'all'>('all');
  const [chordFilter, setChordFilter] = useState<ChordFilter>('all');
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'title', direction: 'asc' });
  const router = useRouter();

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
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
    const filtered = songs.filter(
        (song) =>
        (activeCategory === 'all' || song.category === activeCategory) &&
        (song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (chordFilter === 'all' ||
         (chordFilter === 'with' && hasChords(song)) ||
         (chordFilter === 'without' && !hasChords(song))
        )
    );

    return [...filtered].sort((a, b) => {
        const { key, direction } = sortConfig;
        const dir = direction === 'asc' ? 1 : -1;

        const aVal = a[key] ?? (typeof a[key] === 'number' ? 0 : '');
        const bVal = b[key] ?? (typeof b[key] === 'number' ? 0 : '');
        
        if (key === 'timesPlayedQuarterly' || key === 'timesPlayedTotal') {
            return ((aVal as number) - (bVal as number)) * dir;
        }
        
        return (aVal as string).localeCompare(bVal as string) * dir;
    });

  }, [songs, activeCategory, searchTerm, sortConfig, chordFilter]);

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por título ou artista..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as any)}>
            <TabsList className="grid w-full grid-cols-4 sm:w-auto">
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
           <Tabs value={chordFilter} onValueChange={(value) => setChordFilter(value as any)}>
              <TabsList className="grid w-full h-10 grid-cols-3 sm:w-auto">
                  {chordFilters.map(cat => (
                     <TabsTrigger key={cat} value={cat} className="text-xs sm:text-sm">{chordFilterLabels[cat]}</TabsTrigger>
                  ))}
              </TabsList>
          </Tabs>
        </div>
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
              <TableHead className="w-24 text-center">
                  <SortableHeader sortKey="timesPlayedTotal" label="Total" />
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
                  <TableCell className={cn("text-center font-medium p-1 text-xs", getTotalColorClass(song.timesPlayedTotal))}>
                      {song.timesPlayedTotal ?? 0}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isReadOnly ? 6 : 7} className="h-24 text-center">
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

    

    




