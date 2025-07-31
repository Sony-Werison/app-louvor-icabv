
'use client';

import { useSchedule } from '@/context/schedule-context';
import { MusicLibrary } from '@/components/music-library';

export default function MusicPage() {
  const { songs } = useSchedule();

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-3xl sm:text-4xl font-headline font-bold mb-6 sm:mb-8">Músicas</h1>
      <MusicLibrary songs={songs} />
    </div>
  );
}
