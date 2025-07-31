'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSchedule } from '@/context/schedule-context';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SongEditForm } from '@/components/song-edit-form';
import { ChordDisplay } from '@/components/chord-display';

export default function SongDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { songs, updateSong } = useSchedule();
  const [isEditing, setIsEditing] = useState(false);

  const songId = params.id as string;
  const song = songs.find((s) => s.id === songId);

  if (!song) {
    return (
      <div className="p-4 md:p-8 text-center">
        <h2 className="text-2xl font-bold">Música não encontrada</h2>
        <Button onClick={() => router.push('/music')} className="mt-4">
          <ArrowLeft className="mr-2" />
          Voltar para a Biblioteca
        </Button>
      </div>
    );
  }

  const handleSave = (updatedSong: any) => {
    updateSong(songId, updatedSong);
    setIsEditing(false);
  };
  
  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => router.push('/music')}>
          <ArrowLeft className="mr-2" />
          Voltar
        </Button>
        <Button onClick={() => setIsEditing(!isEditing)}>
          <Edit className="mr-2" />
          {isEditing ? 'Cancelar Edição' : 'Editar'}
        </Button>
      </div>

      {isEditing ? (
        <SongEditForm song={song} onSave={handleSave} onCancel={() => setIsEditing(false)} />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="font-headline font-bold text-3xl">{song.title}</CardTitle>
                <p className="text-muted-foreground text-lg">{song.artist}</p>
              </div>
              <Badge variant="secondary" className="text-base">{song.key}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="lyrics" className="mt-4">
              <TabsList>
                <TabsTrigger value="lyrics">Letra</TabsTrigger>
                <TabsTrigger value="chords">Cifras</TabsTrigger>
              </TabsList>
              <TabsContent value="lyrics" className="mt-4">
                <pre className="whitespace-pre-wrap font-body text-base leading-relaxed p-4 bg-muted/50 rounded-md">
                  {song.lyrics || 'Nenhuma letra disponível.'}
                </pre>
              </TabsContent>
              <TabsContent value="chords" className="mt-4 p-4 bg-muted/50 rounded-md">
                <ChordDisplay chordsText={song.chords || 'Nenhuma cifra disponível.'} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    