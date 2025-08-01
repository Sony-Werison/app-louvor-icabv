
'use client';

import { useSchedule } from '@/context/schedule-context';
import { MusicLibrary } from '@/components/music-library';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { SongImportDialog } from '@/components/song-import-dialog';
import { Upload } from 'lucide-react';

export default function MusicPage() {
  const { songs, addOrUpdateSongs } = useSchedule();
  const [isImporting, setIsImporting] = useState(false);

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 sm:mb-8 gap-4">
        <h1 className="text-3xl sm:text-4xl font-headline font-bold">Músicas</h1>
        <Button onClick={() => setIsImporting(true)} size="sm" className="sm:size-auto">
            <Upload className="mr-2 h-4 w-4"/>
            Importar CSV
        </Button>
      </div>
      <MusicLibrary songs={songs} />
      {isImporting && (
          <SongImportDialog
            isOpen={isImporting}
            onOpenChange={setIsImporting}
            onSave={addOrUpdateSongs}
            existingSongs={songs}
          />
      )}
    </div>
  );
}
