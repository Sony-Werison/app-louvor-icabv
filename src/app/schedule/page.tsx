'use client';
import { useSchedule } from '@/context/schedule-context';
import { ScheduleView } from '@/components/schedule-view';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import type { Schedule, MonthlySchedule } from '@/types';

const transformMonthlyToSchedule = (monthlySchedules: MonthlySchedule[], songs: any[]): Schedule[] => {
    let schedules: Schedule[] = [];
    monthlySchedules.forEach(ms => {
        const saturday = new Date(ms.date);
        saturday.setHours(0,0,0,0);
        
        const assignments = ms.assignments || {};

        const team = {
            multimedia: assignments.multimedia || [],
        };
        
        // Culto de Domingo - Manhã
        const dateManha = new Date(saturday);
        dateManha.setDate(dateManha.getDate() + 1); // Sunday
        dateManha.setHours(10, 0, 0, 0);

        if (assignments.dirigente_manha && assignments.dirigente_manha[0]) {
            schedules.push({
                id: `s-manha-${saturday.getTime()}`,
                name: 'Culto de Dom. - Manhã',
                date: dateManha,
                leaderId: assignments.dirigente_manha[0],
                preacherId: assignments.pregacao_manha?.[0] || null,
                team: team,
                playlist: songs.slice(0, 3).map(s => s.id) // Dummy playlist
            });
        }

        // Culto de Domingo - Noite
        const dateNoite = new Date(saturday);
        dateNoite.setDate(dateNoite.getDate() + 1); // Sunday
        dateNoite.setHours(19, 0, 0, 0);

        if (assignments.dirigente_noite && assignments.dirigente_noite[0]) {
            schedules.push({
                id: `s-noite-${saturday.getTime()}`,
                name: 'Culto de Dom. - Noite',
                date: dateNoite,
                leaderId: assignments.dirigente_noite[0],
                preacherId: assignments.pregacao_noite?.[0] || null,
                team: team,
                playlist: songs.slice(3, 6).map(s => s.id) // Dummy playlist
            });
        }
    });

    return schedules;
}


export default function SchedulePage() {
  const { monthlySchedules, members, songs } = useSchedule();
  
  const allSchedules = transformMonthlyToSchedule(monthlySchedules, songs);

  const today = new Date();
  const startOfThisWeek = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
  const endOfThisWeek = endOfWeek(today, { weekStartsOn: 0 }); // Saturday

  const weeklySchedules = allSchedules.filter(schedule => 
    isWithinInterval(schedule.date, { start: startOfThisWeek, end: endOfThisWeek })
  );

  return (
    <div className="p-4 md:p-8">
      <ScheduleView initialSchedules={weeklySchedules} members={members} songs={songs} />
    </div>
  );
}
