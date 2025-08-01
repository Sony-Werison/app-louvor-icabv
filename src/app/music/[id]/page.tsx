
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSchedule } from '@/context/schedule-context';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, Plus, Minus, ZoomIn, ZoomOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SongEditForm } from '@/components/song-edit-form';
import { ChordDisplay } from '@/components/chord-display';
import { useAuth } from '@/context/auth-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Song } from '@/types';
import { getTransposedKey } from '@/lib/transpose';

const MIN_FONT_SIZE = 0.8;
const MAX_FONT_SIZE = 2.5;
const FONT_STEP = 0.1;
const DEFAULT_FONT_SIZE = 1.1;


export default function SongDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { songs, updateSong, removeSong } = useSchedule();
  const [isEditing, setIsEditing] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [transpose, setTranspose] = useState(0);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE); // em rem
  const { can } = useAuth();

  const songId = params.id as string;
  const song = songs.find((s) => s.id === songId);

  if (!song) {
    return (
      <div className="p-4 md:p-6 text-center">
        <h2 className="text-2xl font-bold">Música não encontrada</h2>
        <Button onClick={() => router.push('/music')} className="mt-4">
          <ArrowLeft className="mr-2" />
          Voltar para a Biblioteca
        </Button>
      </div>
    );
  }

  const handleSave = (updatedSong: Partial<Song>) => {
    updateSong(songId, updatedSong);
    setIsEditing(false);
  };

  const handleDelete = () => {
    removeSong(songId);
    router.push('/music');
  };

  if (isEditing) {
    return (
        <div className="p-4 md:p-6">
            <SongEditForm
                song={song}
                onSave={handleSave}
                onCancel={() => setIsEditing(false)}
            />
        </div>
    );
  }

  const changeFontSize = (delta: number) => {
    setFontSize(prev => Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, prev + delta)));
  }

  const resetFontSize = () => {
    setFontSize(DEFAULT_FONT_SIZE);
  }

  const transposedKey = getTransposedKey(song.key, transpose);
  const zoomPercentage = Math.round((fontSize / DEFAULT_FONT_SIZE) * 100);
  
  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => router.push('/music')}>
          <ArrowLeft className="mr-2" />
          Voltar
        </Button>
        {can('edit:songs') && (
            <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2" />
                    Editar
                </Button>
                 <Button size="sm" variant="destructive" onClick={() => setIsAlertOpen(true)}>
                    <Trash2 className="mr-2" />
                    Excluir
                </Button>
            </div>
        )}
      </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="font-headline font-bold text-2xl sm:text-3xl">{song.title}</CardTitle>
                <p className="text-muted-foreground text-md sm:text-lg">{song.artist}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm sm:text-base">{song.key}</Badge>
                {transpose !== 0 && <Badge className="text-sm sm:text-base">{transposedKey}</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="lyrics" className="mt-4">
              <div className="flex justify-between items-center border-b flex-wrap gap-2">
                  <TabsList>
                    <TabsTrigger value="lyrics">Letra</TabsTrigger>
                    <TabsTrigger value="chords">Cifras</TabsTrigger>
                  </TabsList>
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeFontSize(-FONT_STEP)} disabled={fontSize <= MIN_FONT_SIZE}>
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" onClick={resetFontSize} className="font-bold w-12 text-center text-sm tabular-nums h-8 px-1">
                            {zoomPercentage}%
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeFontSize(FONT_STEP)} disabled={fontSize >= MAX_FONT_SIZE}>
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setTranspose(transpose - 1)}>
                            <Minus className="h-4 w-4"/>
                        </Button>
                        <div className="flex flex-col items-center w-8">
                            <span className="text-[10px] text-muted-foreground -mb-1">Tom</span>
                            <span className="font-bold text-center text-sm">{transpose > 0 ? `+${transpose}` : transpose}</span>
                        </div>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setTranspose(transpose + 1)}>
                            <Plus className="h-4 w-4"/>
                        </Button>
                    </div>
                  </div>
              </div>
               <div style={{ fontSize: `${fontSize}rem` }}>
                    <TabsContent value="lyrics" className="mt-4">
                        <pre className="whitespace-pre-wrap font-body leading-relaxed p-4 bg-muted/50 rounded-md" style={{lineHeight: '1.75'}}>
                        {song.lyrics || 'Nenhuma letra disponível.'}
                        </pre>
                    </TabsContent>
                    <TabsContent value="chords" className="mt-4 p-4 bg-muted/50 rounded-md">
                        <ChordDisplay chordsText={song.chords || 'Nenhuma cifra disponível.'} transposeBy={transpose} />
                    </TabsContent>
               </div>
            </Tabs>
          </CardContent>
        </Card>

      {isAlertOpen && (
          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                          Essa ação não pode ser desfeita. Isso excluirá permanentemente a música da biblioteca.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
      )}
    </div>
  );
}

