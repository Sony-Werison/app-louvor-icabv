

'use client';
import { useSchedule } from '@/context/schedule-context';
import { ScheduleView } from '@/components/schedule-view';
import { ReminderCard } from '@/components/reminder-card';
import { startOfWeek, endOfWeek, isWithinInterval, format, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Schedule, MonthlySchedule } from '@/types';
import { useEffect, useState, useMemo } from 'react';

const transformMonthlyToSchedule = (monthlySchedules: MonthlySchedule[], songs: any[]): Schedule[] => {
    let schedules: Schedule[] = [];
    monthlySchedules.forEach(ms => {
        // We only care about Sundays for the actual service schedules
        if (getDay(ms.date) !== 0) {
            return;
        }

        const sunday = new Date(ms.date);
        sunday.setHours(0,0,0,0);
        
        const assignments = ms.assignments || {};

        const team = {
            multimedia: assignments.multimedia || [],
        };

        const getShortDay = (date: Date) => {
            const dayName = format(date, 'EEEE', { locale: ptBR });
            return dayName.charAt(0).toUpperCase() + dayName.slice(1, 3);
        }
        
        // Culto de Domingo - Manhã
        const dateManha = new Date(sunday);
        dateManha.setHours(10, 0, 0, 0);

        if (assignments.abertura_manha && assignments.abertura_manha[0]) {
            schedules.push({
                id: `s-manha-${sunday.getTime()}`,
                name: ms.name_manha || `${getShortDay(dateManha)}. Manhã`,
                date: dateManha,
                leaderId: assignments.abertura_manha[0],
                preacherId: assignments.pregacao_manha?.[0] || null,
                team: team,
                playlist: ms.playlist_manha || []
            });
        }

        // Culto de Domingo - Noite
        const dateNoite = new Date(sunday);
        dateNoite.setHours(19, 0, 0, 0);

        if (assignments.abertura_noite && assignments.abertura_noite[0]) {
            schedules.push({
                id: `s-noite-${sunday.getTime()}`,
                name: ms.name_noite || `${getShortDay(dateNoite)}. Noite`,
                date: dateNoite,
                leaderId: assignments.abertura_noite[0],
                preacherId: assignments.pregacao_noite?.[0] || null,
                team: team,
                playlist: ms.playlist_noite || []
            });
        }
    });

    return schedules;
}


export default function SchedulePage() {
  const { monthlySchedules, members, songs } = useSchedule();
  const [relevantSchedules, setRelevantSchedules] = useState<Schedule[]>([]);
  
  useEffect(() => {
    const allSchedules = transformMonthlyToSchedule(monthlySchedules, songs);

    const today = new Date();
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
    
    const featuredSchedules = monthlySchedules
        .filter(ms => ms.isFeatured)
        .flatMap(ms => transformMonthlyToSchedule([ms], songs));

    const weeklySchedules = allSchedules.filter(schedule => 
      isWithinInterval(schedule.date, { start: startOfThisWeek, end: endOfThisWeek })
    );
    
    const combinedSchedules = [...weeklySchedules];
    featuredSchedules.forEach(fs => {
        if (!combinedSchedules.some(cs => cs.id === fs.id)) {
            combinedSchedules.push(fs);
        }
    });
    
    combinedSchedules.sort((a, b) => a.date.getTime() - b.date.getTime());

    setRelevantSchedules(combinedSchedules);

  }, [monthlySchedules, songs]);

  const schedulesWithEmptyPlaylists = useMemo(() => 
    relevantSchedules.filter(schedule => schedule.playlist.length === 0)
  , [relevantSchedules]);
  
  const weeklyRepeatedSongIds = useMemo(() => {
    const songCounts = new Map<string, number>();
    relevantSchedules.forEach(s => {
        s.playlist.forEach(songId => {
            songCounts.set(songId, (songCounts.get(songId) || 0) + 1);
        });
    });
    
    const repeated = new Set<string>();
    for (const [songId, count] of songCounts.entries()) {
        if (count > 1) {
            repeated.add(songId);
        }
    }
    return repeated;
  }, [relevantSchedules]);


  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-xl font-headline font-bold">Aberturas em Destaque</h1>
      
      {schedulesWithEmptyPlaylists.length > 0 && (
          <ReminderCard schedules={schedulesWithEmptyPlaylists} members={members} />
      )}
      
      <ScheduleView 
        initialSchedules={relevantSchedules} 
        members={members} 
        songs={songs} 
        weeklyRepeatedSongIds={weeklyRepeatedSongIds}
      />
    </div>
  );
}



