'use client';

import { useState, useMemo } from 'react';
import { useSchedule } from '@/context/schedule-context';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlaylistDialog } from '@/components/playlist-dialog';
import { PlaylistViewer } from '@/components/playlist-viewer';
import { ListMusic, Music, Trash2, Eye, Podcast, Plus, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import type { Schedule } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

export default function RehearsalPage() {
  const { rehearsalPlaylist, updateRehearsalPlaylist, songs } = useSchedule();
  const router = useRouter();
  const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = useState(false);
  const [isPlaylistViewerOpen, setIsPlaylistViewerOpen] = useState(false);

  const playlistSongs = useMemo(() => 
    rehearsalPlaylist.map(id => songs.find(s => s.id === id)).filter((s): s is any => !!s)
  , [rehearsalPlaylist, songs]);

  const rehearsalSchedule: Schedule = {
    id: 'rehearsal',
    name: 'Ensaio do Ministério',
    date: new Date(),
    leaderId: 'rehearsal-host', // Permite que qualquer um gerencie o ensaio
    preacherId: null,
    playlist: rehearsalPlaylist,
  };

  const handlePlaylistSave = (_id: string, newPlaylist: string[]) => {
    updateRehearsalPlaylist(newPlaylist);
    setIsPlaylistDialogOpen(false);
  };

  const handleClearPlaylist = () => {
    updateRehearsalPlaylist([]);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold flex items-center gap-2">
            <Music className="text-primary" />
            Ensaio
          </h1>
          <p className="text-muted-foreground text-sm">
            Monte um repertório provisório para ensaiar. Esta lista não fica salva no histórico.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            {playlistSongs.length > 0 && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Limpar
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Limpar Repertório de Ensaio?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Isso removerá todas as músicas da lista temporária de ensaio.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearPlaylist}>Confirmar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
            <Button onClick={() => setIsPlaylistDialogOpen(true)} size="sm" className="flex-1 sm:flex-none">
                <Plus className="mr-2 h-4 w-4" />
                Montar Lista
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Repertório Atual</CardTitle>
          <CardDescription>
            {playlistSongs.length} música(s) selecionada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {playlistSongs.length > 0 ? (
            <div className="space-y-4">
              <div className="divide-y border rounded-md overflow-hidden bg-muted/10">
                {playlistSongs.map((song, index) => (
                  <div key={`${song.id}-${index}`} className="p-3 flex items-center justify-between bg-card">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-muted-foreground w-5 text-center">{index + 1}</span>
                      <div>
                        <p className="font-medium text-sm">{song.title}</p>
                        <p className="text-xs text-muted-foreground">{song.artist}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button className="w-full sm:w-auto" onClick={() => setIsPlaylistViewerOpen(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar Cifras
                </Button>
                <div className="relative w-full sm:w-auto group">
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={() => router.push('/sala-ao-vivo?scheduleId=rehearsal')}>
                        <Podcast className="mr-2 h-4 w-4" />
                        Abrir Sala ao Vivo
                    </Button>
                    <Badge variant="outline" className="absolute -top-3 -right-2 bg-background text-[10px] px-1 h-4 border-amber-500 text-amber-500 pointer-events-none group-hover:scale-110 transition-transform">
                        <Sparkles className="h-2.5 w-2.5 mr-1" />
                        Beta
                    </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <ListMusic className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-medium">Nenhuma música no ensaio</p>
              <p className="text-sm">Clique em "Montar Lista" para começar seu ensaio.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {isPlaylistDialogOpen && (
        <PlaylistDialog 
          schedule={rehearsalSchedule}
          allSongs={songs}
          onSave={handlePlaylistSave}
          onOpenChange={setIsPlaylistDialogOpen}
        />
      )}

      {isPlaylistViewerOpen && (
        <PlaylistViewer 
          schedule={rehearsalSchedule}
          songs={songs}
          onOpenChange={setIsPlaylistViewerOpen}
        />
      )}
    </div>
  );
}
