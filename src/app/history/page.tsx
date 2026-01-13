
'use client';

import { useSchedule } from '@/context/schedule-context';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, History as HistoryIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Song, MonthlySchedule } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

type PlayedSong = {
  date: Date;
  eventName: string;
  song: Song;
};

export default function HistoryPage() {
  const { monthlySchedules, songs } = useSchedule();
  const [searchTerm, setSearchTerm] = useState('');

  const playedSongsHistory = useMemo(() => {
    const history: PlayedSong[] = [];
    const songMap = new Map(songs.map(s => [s.id, s]));

    monthlySchedules.forEach(schedule => {
      const date = new Date(schedule.date);
      const dayName = format(date, 'EEE', { locale: ptBR });

      if (schedule.playlist_manha && schedule.playlist_manha.length > 0) {
        schedule.playlist_manha.forEach(songId => {
          const song = songMap.get(songId);
          if (song) {
            history.push({
              date,
              eventName: schedule.name_manha || `${dayName}. Manhã`,
              song,
            });
          }
        });
      }
      if (schedule.playlist_noite && schedule.playlist_noite.length > 0) {
        schedule.playlist_noite.forEach(songId => {
          const song = songMap.get(songId);
          if (song) {
            history.push({
              date,
              eventName: schedule.name_noite || `${dayName}. Noite`,
              song,
            });
          }
        });
      }
    });

    return history.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [monthlySchedules, songs]);
  
  const filteredHistory = useMemo(() => {
    if (!searchTerm) {
      return playedSongsHistory;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return playedSongsHistory.filter(played => 
      played.song.title.toLowerCase().includes(lowercasedSearchTerm) ||
      played.song.artist.toLowerCase().includes(lowercasedSearchTerm) ||
      played.eventName.toLowerCase().includes(lowercasedSearchTerm)
    );
  }, [playedSongsHistory, searchTerm]);

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-5rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 sm:mb-8 gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por música, artista ou evento..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border flex-grow flex flex-col min-h-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Data</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Música</TableHead>
                <TableHead className="hidden sm:table-cell">Artista</TableHead>
              </TableRow>
            </TableHeader>
          </Table>
          <ScrollArea className="flex-grow">
            <Table>
                <TableBody>
                    {filteredHistory.length > 0 ? (
                    filteredHistory.map((item, index) => (
                        <TableRow key={index}>
                        <TableCell className="w-[150px] text-muted-foreground text-xs">
                            {format(item.date, 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="font-medium">{item.eventName}</TableCell>
                        <TableCell>{item.song.title}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{item.song.artist}</TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                         {searchTerm ? 'Nenhum resultado encontrado.' : 'Nenhum histórico de músicas para exibir.'}
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
            </Table>
          </ScrollArea>
      </div>
    </div>
  );
}
