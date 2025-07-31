import { members, schedules, songs } from '@/lib/data';
import { ScheduleView } from '@/components/schedule-view';

export default function SchedulePage() {
  // In a real app, you would fetch this data from an API
  const allSchedules = schedules;
  const allMembers = members;
  const allSongs = songs;

  return (
    <div className="p-4 md:p-8">
      <ScheduleView initialSchedules={allSchedules} members={allMembers} songs={allSongs} />
    </div>
  );
}
