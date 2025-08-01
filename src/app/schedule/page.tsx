
'use client';
import { useSchedule } from '@/context/schedule-context';
import { ScheduleView } from '@/components/schedule-view';
import { startOfWeek, endOfWeek, isWithinInterval, format, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Schedule, MonthlySchedule } from '@/types';
import { useEffect, useState } from 'react';

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

        if (assignments.dirigente_manha && assignments.dirigente_manha[0]) {
            schedules.push({
                id: `s-manha-${sunday.getTime()}`,
                name: `${getShortDay(dateManha)}. Manhã`,
                date: dateManha,
                leaderId: assignments.dirigente_manha[0],
                preacherId: assignments.pregacao_manha?.[0] || null,
                team: team,
                playlist: ms.playlist_manha || []
            });
        }

        // Culto de Domingo - Noite
        const dateNoite = new Date(sunday);
        dateNoite.setHours(19, 0, 0, 0);

        if (assignments.dirigente_noite && assignments.dirigente_noite[0]) {
            schedules.push({
                id: `s-noite-${sunday.getTime()}`,
                name: `${getShortDay(dateNoite)}. Noite`,
                date: dateNoite,
                leaderId: assignments.dirigente_noite[0],
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
  const [weeklySchedules, setWeeklySchedules] = useState<Schedule[]>([]);
  
  useEffect(() => {
    const allSchedules = transformMonthlyToSchedule(monthlySchedules, songs);

    const today = new Date();
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 }); // Sunday

    const filteredSchedules = allSchedules.filter(schedule => 
      isWithinInterval(schedule.date, { start: startOfThisWeek, end: endOfThisWeek })
    );

    setWeeklySchedules(filteredSchedules);

  }, [monthlySchedules, songs]);


  return (
    <div className="p-4 md:p-6">
      <ScheduleView initialSchedules={weeklySchedules} members={members} songs={songs} />
    </div>
  );
}
