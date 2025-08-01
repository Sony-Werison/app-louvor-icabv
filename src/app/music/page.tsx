
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
import type { Song } from '@/types';
import { SongBulkEditDialog, BulkEditData } from '@/components/song-bulk-edit-dialog';
import type { ParsedTxtSong } from '@/components/song-import-txt-dialog';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function MusicPage() {
  const { songs, addOrUpdateSongs, addSong, importSongsFromTxt, removeSongs, updateSongs } = useSchedule();
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

  const handleBulkUpdate = (data: BulkEditData) => {
    updateSongs(selectedSongIds, data);
    setIsBulkEditing(false);
    setSelectedSongIds([]);
  }

  const handleTxtImportSave = (data: { toCreate: ParsedTxtSong[], toUpdate: ParsedTxtSong[]}) => {
    importSongsFromTxt(data.toCreate, data.toUpdate);
    setIsImportingTxt(false);
  };


  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 sm:mb-8 gap-4">
        <div/>
        {can('edit:songs') && (
            <TooltipProvider>
                <div className="flex gap-2 flex-wrap justify-end">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button onClick={() => setIsImporting(true)} size="sm" variant="outline">
                                <Upload className="mr-2 h-4 w-4"/>
                                CSV
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Importar de CSV</p>
                        </TooltipContent>
                    </Tooltip>
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <Button onClick={() => setIsImportingTxt(true)} size="sm" variant="outline">
                                <FileText className="mr-2 h-4 w-4"/>
                                TXT
                            </Button>
                        </TooltipTrigger>
                         <TooltipContent>
                            <p>Importar de TXT</p>
                        </TooltipContent>
                    </Tooltip>
                    <Button onClick={() => setIsFormOpen(true)} size="sm" className="sm:size-auto">
                        <Plus className="mr-2 h-4 w-4"/>
                        Nova Música
                    </Button>
                </div>
            </TooltipProvider>
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
            onSave={handleTxtImportSave}
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
          onSave={handleBulkUpdate}
          songCount={selectedSongIds.length}
        />
      )}
    </div>
  );
}
