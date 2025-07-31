import { songs } from '@/lib/data';
import { MusicLibrary } from '@/components/music-library';

export default function MusicPage() {
  const allSongs = songs;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-3xl sm:text-4xl font-headline font-bold mb-6 sm:mb-8">Músicas</h1>
      <MusicLibrary songs={allSongs} />
    </div>
  );
}
