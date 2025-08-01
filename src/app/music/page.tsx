
'use client';

import { useSchedule } from '@/context/schedule-context';
import { MusicLibrary } from '@/components/music-library';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { SongImportDialog } from '@/components/song-import-dialog';
import { SongImportTxtDialog } from '@/components/song-import-txt-dialog';
import { SongFormDialog } from '@/components/song-form-dialog';
import { Upload, Plus, FileText } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import type { Song, SongCategory } from '@/types';
import { SongBulkEditDialog } from '@/components/song-bulk-edit-dialog';

export default function MusicPage() {
  const { songs, addOrUpdateSongs, addSong, addSongsFromImport, removeSongs, updateSongsCategory } = useSchedule();
  const [isImporting, setIsImporting] = useState(false);
  const [isImportingTxt, setIsImportingTxt] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const { can } = useAuth();

  const handleSaveSong = (songData: Omit<Song, 'id'>) => {
    addSong(songData);
    setIsFormOpen(false);
  }

  const handleBulkUpdateCategory = (category: SongCategory) => {
    updateSongsCategory(selectedSongIds, category);
    setIsBulkEditing(false);
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 sm:mb-8 gap-4">
        <h1 className="text-3xl sm:text-4xl font-headline font-bold">Músicas</h1>
        {can('edit:songs') && (
            <div className="flex gap-2 flex-wrap justify-end">
                <Button onClick={() => setIsImporting(true)} size="sm" variant="outline" className="sm:size-auto">
                    <Upload className="mr-2 h-4 w-4"/>
                    Importar CSV
                </Button>
                <Button onClick={() => setIsImportingTxt(true)} size="sm" variant="outline" className="sm:size-auto">
                    <FileText className="mr-2 h-4 w-4"/>
                    Importar TXT
                </Button>
                <Button onClick={() => setIsFormOpen(true)} size="sm" className="sm:size-auto">
                    <Plus className="mr-2 h-4 w-4"/>
                    Nova Música
                </Button>
            </div>
        )}
      </div>
      <MusicLibrary 
        songs={songs} 
        onSongsDelete={removeSongs} 
        onSelectionChange={setSelectedSongIds}
        onBulkEdit={() => setIsBulkEditing(true)}
        isReadOnly={!can('edit:songs')}
      />

      {isImporting && (
          <SongImportDialog
            isOpen={isImporting}
            onOpenChange={setIsImporting}
            onSave={addOrUpdateSongs}
            existingSongs={songs}
          />
      )}

      {isImportingTxt && (
          <SongImportTxtDialog
            isOpen={isImportingTxt}
            onOpenChange={setIsImportingTxt}
            onSave={addSongsFromImport}
            existingSongs={songs}
          />
      )}
      
      {isFormOpen && (
        <SongFormDialog
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSave={handleSaveSong}
        />
      )}

      {isBulkEditing && (
        <SongBulkEditDialog
          isOpen={isBulkEditing}
          onOpenChange={setIsBulkEditing}
          onSave={handleBulkUpdateCategory}
          songCount={selectedSongIds.length}
        />
      )}
    </div>
  );
}
