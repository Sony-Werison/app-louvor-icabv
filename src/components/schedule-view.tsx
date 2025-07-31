'use client';

import type { Schedule, Member, Song } from '@/types';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlaylistDialog } from '@/components/playlist-dialog';
import { ListMusic, MoreVertical, Edit, Trash2, Plus } from 'lucide-react';
import { ScheduleFormDialog } from './schedule-form-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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


interface ScheduleViewProps {
  initialSchedules: Schedule[];
  members: Member[];
  songs: Song[];
}

export function ScheduleView({ initialSchedules, members, songs }: ScheduleViewProps) {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [scheduleToEdit, setScheduleToEdit] = useState<Schedule | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = useState(false);

  const handlePlaylistSave = (scheduleId: string, newPlaylist: string[]) => {
    setSchedules(currentSchedules =>
      currentSchedules.map(s =>
        s.id === scheduleId ? { ...s, playlist: newPlaylist } : s
      )
    );
    setIsPlaylistDialogOpen(false);
    setSelectedSchedule(null);
  };
  
  const handleFormSave = (scheduleData: Omit<Schedule, 'id' | 'playlist'> & { id?: string }) => {
    if (scheduleData.id) {
      // Edit
      setSchedules(schedules.map(s => s.id === scheduleData.id ? {...s, ...scheduleData} : s));
    } else {
      // Add
      const newSchedule: Schedule = {
        ...scheduleData,
        id: `s${Date.now()}`,
        playlist: [],
      };
      setSchedules([...schedules, newSchedule]);
    }
    setIsFormOpen(false);
    setScheduleToEdit(null);
  }

  const handleAddNew = () => {
    setScheduleToEdit(null);
    setIsFormOpen(true);
  }

  const handleEdit = (schedule: Schedule) => {
    setScheduleToEdit(schedule);
    setIsFormOpen(true);
  }
  
  const handleDeleteClick = (schedule: Schedule) => {
    setScheduleToDelete(schedule);
    setIsAlertOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (scheduleToDelete) {
      setSchedules(schedules.filter((s) => s.id !== scheduleToDelete.id));
      setIsAlertOpen(false);
      setScheduleToDelete(null);
    }
  };
  
  const handleOpenPlaylist = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsPlaylistDialogOpen(true);
  }

  const getMemberById = (id: string) => members.find(m => m.id === id);
  const getSongById = (id: string) => songs.find(s => s.id === id);
  const getMemberInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-headline font-bold">Próximas Reuniões</h1>
        <Button onClick={handleAddNew}>
            <Plus className="mr-2" />
            Nova Reunião
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {schedules.map((schedule) => {
          const leader = getMemberById(schedule.leaderId);
          const playlistSongs = schedule.playlist.map(getSongById).filter((s): s is Song => !!s);

          return (
            <Card key={schedule.id} className="flex flex-col relative">
              <CardHeader>
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleEdit(schedule)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClick(schedule)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Excluir</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="font-headline font-bold text-2xl pr-8">
                  {schedule.name}
                </CardTitle>
                <CardDescription>
                  {schedule.date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-6">
                {leader && (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={leader.avatar} alt={leader.name} />
                      <AvatarFallback>{getMemberInitial(leader.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-sm text-muted-foreground">Dirigente</span>
                      <p className="font-semibold">{leader.name}</p>
                    </div>
                  </div>
                )}

                <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2"><ListMusic className="w-4 h-4"/>Repertório</h3>
                    {playlistSongs.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            {playlistSongs.map(song => (
                                <li key={song.id}>{song.title} - <span className="opacity-80">{song.artist}</span></li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">Nenhuma música selecionada.</p>
                    )}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => handleOpenPlaylist(schedule)} className="w-full">
                  <ListMusic className="mr-2 h-4 w-4" />
                  Gerenciar Repertório
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      
      {isPlaylistDialogOpen && selectedSchedule && (
        <PlaylistDialog
          schedule={selectedSchedule}
          allSongs={songs}
          onSave={handlePlaylistSave}
          onOpenChange={() => { setIsPlaylistDialogOpen(false); setSelectedSchedule(null); }}
        />
      )}

      {isFormOpen && (
        <ScheduleFormDialog
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSave={handleFormSave}
          schedule={scheduleToEdit}
          members={members}
        />
      )}

      {isAlertOpen && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Essa ação não pode ser desfeita. Isso excluirá permanentemente a reunião.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteConfirm}>Continuar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
