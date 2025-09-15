

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
        const assignments = ms.assignments || {};
        
        const scheduleDate = new Date(ms.date);
        scheduleDate.setHours(0,0,0,0);
        
        const team = {
            multimedia: assignments.multimedia || [],
        };

        const getShortDay = (date: Date) => {
            const dayName = format(date, 'EEEE', { locale: ptBR });
            return dayName.charAt(0).toUpperCase() + dayName.slice(1, 3);
        }
        
        const hasManha = assignments.abertura_manha && assignments.abertura_manha.some(id => !!id);
        const hasNoite = assignments.abertura_noite && assignments.abertura_noite.some(id => !!id);

        // Treat as two separate potential events: morning and night
        if (hasManha) {
            const dateManha = new Date(scheduleDate);
            dateManha.setHours(10, 0, 0, 0);

            schedules.push({
                id: `s-manha-${scheduleDate.getTime()}`,
                name: ms.name_manha || `${getShortDay(dateManha)}. Manhã`,
                date: dateManha,
                leaderId: assignments.abertura_manha![0]!,
                preacherId: assignments.pregacao_manha?.[0] || null,
                team: team,
                playlist: ms.playlist_manha || [],
                icon: 'sun',
            });
        }
        
        if (hasNoite) {
            const dateNoite = new Date(scheduleDate);
            dateNoite.setHours(19, 0, 0, 0);
            
            schedules.push({
                id: `s-noite-${scheduleDate.getTime()}`,
                name: ms.name_noite || `${getShortDay(dateNoite)}. Noite`,
                date: dateNoite,
                leaderId: assignments.abertura_noite![0]!,
                preacherId: assignments.pregacao_noite?.[0] || null,
                team: team,
                playlist: ms.playlist_noite || [],
                icon: 'moon',
            });
        }

        // If no assignments, create a shell for it to appear on the schedule page
        if (!hasManha && !hasNoite) {
             const dateShell = new Date(scheduleDate);
             dateShell.setHours(10,0,0,0); // Default to morning
             schedules.push({
                id: `s-manha-${scheduleDate.getTime()}`, // Default to manha for ID generation
                name: ms.name_manha || `${getShortDay(dateShell)}. Manhã`,
                date: dateShell,
                leaderId: '', // No leader
                preacherId: null,
                team: team,
                playlist: ms.playlist_manha || [],
                icon: 'sun',
            });
        }
    });

    return schedules;
}


export default function SchedulePage() {
  const { monthlySchedules, members, songs, updateSchedule } = useSchedule();
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
    relevantSchedules.filter(schedule => schedule.playlist.length === 0 && schedule.leaderId)
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

  const handleScheduleUpdate = (scheduleId: string, updates: Partial<Schedule>) => {
    const [type, timestampStr] = scheduleId.replace('s-', '').split('-');
    const timestamp = parseInt(timestampStr, 10);
    
    // Create a new Date object ensuring it's treated as UTC then converted to local timezone correctly.
    const dateObj = new Date(timestamp);
    const date = new Date(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate());

    const scheduleToUpdate = monthlySchedules.find(s => s.date.getTime() === date.getTime());

    if (!scheduleToUpdate) {
        console.warn(`Schedule with date ${date} not found for update.`);
        return;
    };
    
    let monthlyUpdate: Partial<Omit<MonthlySchedule, 'date'>> = {};

    if (updates.name !== undefined) {
        monthlyUpdate = type === 'manha' ? { name_manha: updates.name } : { name_noite: updates.name };
    }
    
    if (Object.keys(monthlyUpdate).length > 0) {
        updateSchedule(date, monthlyUpdate);
    }
  }


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
        onScheduleUpdate={handleScheduleUpdate}
      />
    </div>
  );
}

