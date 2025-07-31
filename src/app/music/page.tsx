import { songs } from '@/lib/data';
import { MusicLibrary } from '@/components/music-library';

export default function MusicPage() {
  const allSongs = songs;

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-4xl font-headline font-bold mb-8">Músicas</h1>
      <MusicLibrary songs={allSongs} />
    </div>
  );
}
