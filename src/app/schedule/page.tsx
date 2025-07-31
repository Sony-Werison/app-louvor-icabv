import { members, songs, monthlySchedules } from '@/lib/data';
import { ScheduleView } from '@/components/schedule-view';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import type { Schedule } from '@/types';


const transformMonthlyToSchedule = (monthlySchedules: any[], songs: any[]): Schedule[] => {
    let schedules: Schedule[] = [];
    monthlySchedules.forEach(ms => {
        const saturday = new Date(ms.date);
        saturday.setHours(0,0,0,0);
        
        // Culto de Domingo - Manhã
        const dateManha = new Date(saturday);
        dateManha.setDate(dateManha.getDate() + 1); // Sunday
        dateManha.setHours(10,0,0,0);

        schedules.push({
            id: `s-manha-${saturday.getTime()}`,
            name: 'Culto de Dom. - Manhã',
            date: dateManha,
            leaderId: ms.assignments.dirigente_manha?.[0] || '',
            team: {
                ...ms.assignments,
                dirigente_manha: ms.assignments.dirigente_manha || [],
                pregacao_manha: ms.assignments.pregacao_manha || [],
                multimedia: ms.assignments.multimedia || [],
            },
            playlist: songs.slice(0, 3).map(s => s.id) // Dummy playlist
        });

        // Culto de Domingo - Noite
        const dateNoite = new Date(saturday);
        dateNoite.setDate(dateNoite.getDate() + 1); // Sunday
        dateNoite.setHours(19,0,0,0);
        schedules.push({
            id: `s-noite-${saturday.getTime()}`,
            name: 'Culto de Dom. - Noite',
            date: dateNoite,
            leaderId: ms.assignments.dirigente_noite?.[0] || '',
            team: {
                 ...ms.assignments,
                dirigente_noite: ms.assignments.dirigente_noite || [],
                pregacao_noite: ms.assignments.pregacao_noite || [],
                multimedia: ms.assignments.multimedia || [],
            },
            playlist: songs.slice(3, 6).map(s => s.id) // Dummy playlist
        });
    });

    return schedules;
}


export default function SchedulePage() {
  const allMembers = members;
  const allSongs = songs;

  const allSchedules = transformMonthlyToSchedule(monthlySchedules, allSongs);

  const today = new Date();
  const startOfThisWeek = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
  const endOfThisWeek = endOfWeek(today, { weekStartsOn: 0 }); // Saturday

  const weeklySchedules = allSchedules.filter(schedule => 
    isWithinInterval(schedule.date, { start: startOfThisWeek, end: endOfThisWeek })
  );

  return (
    <div className="p-4 md:p-8">
      <ScheduleView initialSchedules={weeklySchedules} members={allMembers} songs={allSongs} />
    </div>
  );
}
