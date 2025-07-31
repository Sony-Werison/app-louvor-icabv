'use client';

import type { Song } from '@/types';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

interface MusicLibraryProps {
  songs: Song[];
}

export function MusicLibrary({ songs }: MusicLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const filteredSongs = songs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleRowClick = (songId: string) => {
    router.push(`/music/${songId}`);
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por título ou artista..."
          className="pl-10 w-full md:w-1/2 lg:w-1/3"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Artista</TableHead>
              <TableHead className="text-center">Tom</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSongs.length > 0 ? (
              filteredSongs.map((song) => (
                <TableRow key={song.id} onClick={() => handleRowClick(song.id)} className="cursor-pointer">
                  <TableCell className="font-medium">{song.title}</TableCell>
                  <TableCell className="text-muted-foreground">{song.artist}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{song.key}</Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
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
