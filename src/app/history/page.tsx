
'use client';

import { useSchedule } from '@/context/schedule-context';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search, History as HistoryIcon, User, ListMusic, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Song, Member } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

type HistoryEvent = {
  date: Date;
  eventName: string;
  songs: Song[];
  leader?: Member;
};

export default function HistoryPage() {
  const { monthlySchedules, songs, members } = useSchedule();
  const [searchTerm, setSearchTerm] = useState('');

  const eventsHistory = useMemo(() => {
    const history: HistoryEvent[] = [];
    const songMap = new Map(songs.map(s => [s.id, s]));
    const memberMap = new Map(members.map(m => [m.id, m]));

    monthlySchedules.forEach(schedule => {
      const date = new Date(schedule.date);
      const dayName = format(date, 'EEE', { locale: ptBR });

      if (schedule.playlist_manha && schedule.playlist_manha.length > 0) {
        const eventSongs = schedule.playlist_manha.map(id => songMap.get(id)).filter((s): s is Song => !!s);
        const leaderId = schedule.assignments?.abertura_manha?.[0];
        const leader = leaderId ? memberMap.get(leaderId) : undefined;
        history.push({
          date,
          eventName: schedule.name_manha || `${dayName}. Manhã`,
          songs: eventSongs,
          leader,
        });
      }
      if (schedule.playlist_noite && schedule.playlist_noite.length > 0) {
        const eventSongs = schedule.playlist_noite.map(id => songMap.get(id)).filter((s): s is Song => !!s);
        const leaderId = schedule.assignments?.abertura_noite?.[0];
        const leader = leaderId ? memberMap.get(leaderId) : undefined;
        history.push({
          date,
          eventName: schedule.name_noite || `${dayName}. Noite`,
          songs: eventSongs,
          leader,
        });
      }
    });

    return history.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [monthlySchedules, songs, members]);
  
  const filteredHistory = useMemo(() => {
    if (!searchTerm) {
      return eventsHistory;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return eventsHistory.filter(event => 
      event.eventName.toLowerCase().includes(lowercasedSearchTerm) ||
      event.leader?.name.toLowerCase().includes(lowercasedSearchTerm) ||
      event.songs.some(song => 
        song.title.toLowerCase().includes(lowercasedSearchTerm) ||
        song.artist.toLowerCase().includes(lowercasedSearchTerm)
      )
    );
  }, [eventsHistory, searchTerm]);

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-5rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 sm:mb-8 gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por música, artista, dirigente ou evento..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-grow -mx-4 md:-mx-6 px-4 md:px-6">
        <div className="space-y-4 pb-4">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((event, index) => (
              <Card key={index}>
                <CardHeader className="p-4 border-b">
                   <div className="flex justify-between items-start">
                     <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground"/> 
                            <span className="capitalize">{format(event.date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                        </CardTitle>
                        <Badge variant="outline" className="mt-1">{event.eventName}</Badge>
                     </div>
                      {event.leader && (
                        <div className="flex items-center gap-2 text-sm">
                           <Avatar className="h-6 w-6">
                            <AvatarImage src={event.leader.avatarUrl} alt={event.leader.name} />
                            <AvatarFallback>{event.leader.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{event.leader.name}</span>
                        </div>
                      )}
                   </div>
                </CardHeader>
                <CardContent className="p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm"><ListMusic className="h-4 w-4"/>Repertório</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {event.songs.map(song => (
                            <li key={song.id} className="truncate">{song.title} <span className="text-xs">({song.artist})</span></li>
                        ))}
                    </ul>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground bg-card border rounded-lg">
                <HistoryIcon className="h-10 w-10 mb-2"/>
                <p className="font-medium">
                  {searchTerm ? 'Nenhum resultado encontrado.' : 'Nenhum histórico de músicas para exibir.'}
                </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
