
'use client';

import type { Song, SongCategory } from '@/types';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MusicLibraryProps {
  songs: Song[];
}

const categories: (SongCategory | 'all')[] = ['all', 'Louvor', 'Hino', 'Infantil'];
const categoryLabels: Record<SongCategory | 'all', string> = {
  all: 'Todas',
  Louvor: 'Louvores',
  Hino: 'Hinos',
  Infantil: 'Infantis'
}

export function MusicLibrary({ songs }: MusicLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<SongCategory | 'all'>('all');
  const router = useRouter();

  const filteredSongs = songs.filter(
    (song) =>
      (activeCategory === 'all' || song.category === activeCategory) &&
      (song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleRowClick = (songId: string) => {
    router.push(`/music/${songId}`);
  };

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
        <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as any)}>
            <TabsList className="grid w-full grid-cols-4 sm:w-auto sm:grid-cols-4">
                {categories.map(cat => (
                   <TabsTrigger key={cat} value={cat} className="text-xs sm:text-sm">{categoryLabels[cat]}</TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead className="hidden sm:table-cell">Artista</TableHead>
              <TableHead className="hidden md:table-cell">Categoria</TableHead>
              <TableHead className="text-center">Tom</TableHead>
              <TableHead className="hidden lg:table-cell text-center">Trimestre</TableHead>
              <TableHead className="hidden lg:table-cell text-center">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSongs.length > 0 ? (
              filteredSongs.map((song) => (
                <TableRow key={song.id} onClick={() => handleRowClick(song.id)} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <div>{song.title}</div>
                    <div className="text-muted-foreground text-xs sm:hidden">{song.artist}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden sm:table-cell">{song.artist}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary">{song.category}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{song.key}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-center text-muted-foreground">
                    {song.timesPlayedQuarterly ?? 0}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-center text-muted-foreground">
                    {song.timesPlayedTotal ?? 0}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Nenhuma música encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
