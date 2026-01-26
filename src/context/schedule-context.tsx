'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import type { MonthlySchedule, Member, Song, BackupData } from '@/types';
import { subMonths } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { initialMembers, initialSongs, initialMonthlySchedules, scheduleColumns } from './initial-data';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';


interface ScheduleContextType {
  monthlySchedules: MonthlySchedule[];
  members: Member[];
  songs: Song[];
  scheduleColumns: typeof scheduleColumns;
  addSchedule: (date: Date) => Promise<void>;
  removeSchedule: (date: Date) => Promise<void>;
  updateSchedule: (date: Date, updates: Partial<Omit<MonthlySchedule, 'date'>>) => Promise<void>;
  updateSchedulePlaylist: (scheduleId: string, playlist: string[]) => Promise<void>;
  saveMember: (member: Member) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  addSong: (songData: Omit<Song, 'id'>) => Promise<void>;
  updateSong: (songId: string, updates: Partial<Song>) => Promise<void>;
  removeSong: (songId: string) => Promise<void>;
  removeSongs: (songIds: string[]) => Promise<void>;
  addOrUpdateSongs: (songs: Song[]) => Promise<void>;
  importSongsFromTxt: (songsToCreate: Omit<Song, 'id'>[], songsToUpdate: Omit<Song, 'id'>[]) => Promise<void>;
  updateSongs: (songIds: string[], updates: Partial<Pick<Song, 'category' | 'artist' | 'key' | 'chords' | 'isNew'>>) => Promise<void>;
  exportData: () => Promise<BackupData>;
  importData: (data: BackupData) => Promise<void>;
  clearAllData: () => Promise<void>;
  isLoading: boolean;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [rawSongs, setRawSongs] = useState<Song[]>([]);
  const [monthlySchedules, setMonthlySchedules] = useState<MonthlySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [membersRes, songsRes, schedulesRes] = await Promise.all([
          supabase.from('members').select('*'),
          supabase.from('songs').select('*'),
          supabase.from('monthly_schedules').select('*'),
        ]);

        if (membersRes.error) throw membersRes.error;
        if (songsRes.error) throw songsRes.error;
        if (schedulesRes.error) throw schedulesRes.error;

        setMembers(membersRes.data || []);
        setRawSongs(songsRes.data || []);
        
        const parsedSchedules = (schedulesRes.data || []).map(s => ({
            ...s,
            date: new Date(s.date),
        }));
        setMonthlySchedules(parsedSchedules);

      } catch (error: any) {
        console.error("Error fetching data from Supabase:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível conectar ao banco de dados. Usando dados de exemplo.",
          variant: "destructive"
        });
        setMembers(initialMembers);
        setRawSongs(initialSongs);
        setMonthlySchedules(initialMonthlySchedules);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const songs = useMemo(() => {
    const today = new Date();
    const threeMonthsAgo = subMonths(today, 3);
    const quarterlyPlayCounts = new Map<string, number>();

    monthlySchedules.forEach(schedule => {
        const scheduleDate = new Date(schedule.date);
        const playlists = [schedule.playlist_manha, schedule.playlist_noite].filter(Boolean) as string[][];

        playlists.forEach(playlist => {
            playlist.forEach(songId => {
                if (scheduleDate >= threeMonthsAgo) {
                    quarterlyPlayCounts.set(songId, (quarterlyPlayCounts.get(songId) || 0) + 1);
                }
            });
        });
    });
    
    return rawSongs.map(song => ({
        ...song,
        timesPlayedQuarterly: quarterlyPlayCounts.get(song.id) || 0,
    }));
  }, [rawSongs, monthlySchedules]);


  const addSchedule = async (date: Date) => {
    const newScheduleData = {
      date: date.toISOString(),
      assignments: {},
    };
    const { data, error } = await supabase.from('monthly_schedules').insert(newScheduleData).select().single();
    if (error) {
        toast({ title: 'Erro ao adicionar data', variant: 'destructive'});
        console.error(error);
        return;
    }
    if (data) {
        const newSchedule = { ...data, date: new Date(data.date) };
        setMonthlySchedules(prev => [...prev, newSchedule].sort((a,b) => a.date.getTime() - b.date.getTime()));
    }
  };

  const removeSchedule = async (date: Date) => {
    const scheduleToRemove = monthlySchedules.find(s => s.date.getTime() === date.getTime());
    if (!scheduleToRemove) return;

    const { error } = await supabase.from('monthly_schedules').delete().eq('id', scheduleToRemove.id);
    if (error) {
        toast({ title: 'Erro ao remover data', variant: 'destructive'});
        console.error(error);
        return;
    }
    setMonthlySchedules(prev => prev.filter(s => s.id !== scheduleToRemove.id));
  };

  const updateSchedule = async (date: Date, updates: Partial<Omit<MonthlySchedule, 'date'>>) => {
    const scheduleToUpdate = monthlySchedules.find(s => s.date.getTime() === date.getTime());
    if (!scheduleToUpdate) return;
    
     const { error } = await supabase.from('monthly_schedules').update(updates).eq('id', scheduleToUpdate.id);
     if (error) {
        toast({ title: 'Erro ao atualizar escala', variant: 'destructive'});
        console.error(error);
        return;
    }
     setMonthlySchedules(prev => prev.map(s => s.id === scheduleToUpdate.id ? { ...s, ...updates } : s));
  };
  
  const updateSchedulePlaylist = async (scheduleId: string, playlist: string[]) => {
    const [type, ...timestampParts] = scheduleId.replace('s-', '').split('-');
    const timestampStr = timestampParts.join('-');
    const timestamp = parseInt(timestampStr, 10);
    
    const dateObj = new Date(timestamp);
    const date = new Date(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate());

    const scheduleToUpdate = monthlySchedules.find(s => s.date.getTime() === date.getTime());
    if (!scheduleToUpdate) return;

    const fieldToUpdate = type === 'manha' ? 'playlist_manha' : 'playlist_noite';
    const { error } = await supabase.from('monthly_schedules').update({ [fieldToUpdate]: playlist }).eq('id', scheduleToUpdate.id);

    if (error) {
      toast({ title: 'Erro ao atualizar repertório', variant: 'destructive'});
      console.error(error);
      return;
    }

    setMonthlySchedules(prev => prev.map(s => s.id === scheduleToUpdate.id ? { ...s, [fieldToUpdate]: playlist } : s));
  };

  const saveMember = async (member: Member) => {
    const { data, error } = await supabase.from('members').upsert(member).select().single();
    if(error){
        toast({ title: 'Erro ao salvar membro', variant: 'destructive'});
        console.error(error);
        return;
    }
    if(data){
        setMembers(prev => {
            const existingIndex = prev.findIndex(m => m.id === data.id);
            if (existingIndex > -1) {
                const newMembers = [...prev];
                newMembers[existingIndex] = data;
                return newMembers;
            }
            return [...prev, data];
        });
    }
  }

  const removeMember = async (memberId: string) => {
     const { error } = await supabase.from('members').delete().eq('id', memberId);
     if(error){
        toast({ title: 'Erro ao remover membro', variant: 'destructive'});
        return;
     }
     setMembers(prev => prev.filter(m => m.id !== memberId));
  };
  
  const addSong = async (songData: Omit<Song, 'id'>) => {
    const { data, error } = await supabase.from('songs').insert(songData).select().single();
    if (error) {
        toast({ title: 'Erro ao adicionar música', variant: 'destructive'});
        console.error(error);
        return;
    }
    if(data){
        setRawSongs(prev => [...prev, data]);
    }
  };

  const updateSong = async (songId: string, updates: Partial<Song>) => {
    const { data, error } = await supabase.from('songs').update(updates).eq('id', songId).select().single();
    if(error){
        toast({ title: 'Erro ao atualizar música', variant: 'destructive'});
        console.error(error);
        return;
    }
    if(data){
        setRawSongs(prev => prev.map(s => s.id === songId ? data : s));
    }
  };
  
  const removeSongs = async (songIds: string[]) => {
    const { error } = await supabase.from('songs').delete().in('id', songIds);
    if(error){
        toast({ title: 'Erro ao remover músicas', variant: 'destructive'});
        return;
    }
    setRawSongs(prev => prev.filter(s => !songIds.includes(s.id)));
  };

  const removeSong = async (songId: string) => removeSongs([songId]);

  const addOrUpdateSongs = async (songsToUpdate: Song[]) => {
    toast({ title: 'Função não implementada', description: 'A importação de CSV precisa ser adaptada para o Supabase.' });
  };

  const importSongsFromTxt = async (songsToCreate: Omit<Song, 'id'>[], songsToUpdate: Omit<Song, 'id'>[]) => {
      const createPromises = supabase.from('songs').insert(songsToCreate);
      const updatePromises = songsToUpdate.map(songData => 
        supabase.from('songs').update({ lyrics: songData.lyrics }).match({ title: songData.title, artist: songData.artist })
      );

      const [createRes, ...updateRes] = await Promise.all([createPromises, ...updatePromises]);
      
      let hadError = false;
      if(createRes.error) {
          console.error("Error creating songs:", createRes.error);
          hadError = true;
      }
      updateRes.forEach(res => {
          if(res.error){
              console.error("Error updating song:", res.error);
              hadError = true;
          }
      });

      if(hadError) {
          toast({ title: 'Erro ao importar de TXT', description: 'Algumas músicas podem não ter sido importadas.', variant: 'destructive'});
      } else {
          toast({ title: 'Importação de TXT concluída!'});
      }

      const songsRes = await supabase.from('songs').select('*');
      if (songsRes.data) setRawSongs(songsRes.data);
  }

  const updateSongs = async (songIds: string[], updates: Partial<Pick<Song, 'category' | 'artist' | 'key' | 'chords' | 'isNew'>>) => {
    const { error } = await supabase.from('songs').update(updates).in('id', songIds);
      if (error) {
          toast({ title: 'Erro ao atualizar músicas', variant: 'destructive'});
          console.error(error);
          return;
      }
      setRawSongs(prev => prev.map(song => songIds.includes(song.id) ? { ...song, ...updates } : song));
  };

 const exportData = async (): Promise<BackupData> => {
    setIsLoading(true);
    try {
        const [membersRes, songsRes, schedulesRes] = await Promise.all([
            supabase.from('members').select('*'),
            supabase.from('songs').select('*'),
            supabase.from('monthly_schedules').select('*'),
        ]);

        if (membersRes.error) throw membersRes.error;
        if (songsRes.error) throw songsRes.error;
        if (schedulesRes.error) throw schedulesRes.error;

        const backupData: BackupData = {
            members: membersRes.data || [],
            songs: songsRes.data || [],
            monthlySchedules: (schedulesRes.data || []).map(s => ({
                ...s,
                date: new Date(s.date).toISOString(),
            })),
            exportDate: new Date().toISOString(),
        };

        return backupData;

    } catch (error: any) {
        console.error("Export error:", error);
        toast({ title: 'Erro ao Exportar', description: 'Não foi possível gerar o backup.', variant: 'destructive'});
        throw error;
    } finally {
        setIsLoading(false);
    }
  };


  const importData = async (data: BackupData) => {
    setIsLoading(true);
    toast({ title: 'Iniciando importação...', description: 'Limpando dados antigos...' });

    try {
      // 1. Clear existing data
      const { error: clearSchedulesError } = await supabase.from('monthly_schedules').delete().neq('id', uuidv4());
      if (clearSchedulesError) throw clearSchedulesError;

      const { error: clearSongsError } = await supabase.from('songs').delete().neq('id', uuidv4());
      if (clearSongsError) throw clearSongsError;
      
      const { error: clearMembersError } = await supabase.from('members').delete().neq('id', uuidv4());
      if (clearMembersError) throw clearMembersError;

      toast({ title: 'Iniciando importação...', description: 'Inserindo novos dados...' });

      // 2. Insert new data
      const { error: membersError } = await supabase.from('members').insert(data.members);
      if (membersError) throw membersError;

      const songsToInsert = data.songs.map(({ timesPlayedQuarterly, ...rest }) => rest);
      const { error: songsError } = await supabase.from('songs').insert(songsToInsert);
      if (songsError) throw songsError;

      const schedulesToInsert = data.monthlySchedules.map(s => ({
        ...s,
        date: new Date(s.date).toISOString()
      }));
      const { error: schedulesError } = await supabase.from('monthly_schedules').insert(schedulesToInsert);
      if (schedulesError) throw schedulesError;

      toast({ title: 'Importação Concluída!', description: 'Os dados foram restaurados com sucesso. A página será recarregada.'});
      
      setTimeout(() => {
          window.location.reload();
      }, 2000);

    } catch (error: any) {
        console.error("Import error:", error);
        toast({ title: 'Erro na Importação', description: `Falha ao restaurar backup: ${error.message}`, variant: 'destructive'});
    } finally {
        setIsLoading(false);
    }
  };


  const clearAllData = async () => {
    setIsLoading(true);
    toast({ title: 'Limpando todos os dados...', description: 'Isso pode levar um momento.' });

    try {
        const { error: clearSchedulesError } = await supabase.from('monthly_schedules').delete().neq('id', uuidv4());
        if (clearSchedulesError) throw clearSchedulesError;

        const { error: clearSongsError } = await supabase.from('songs').delete().neq('id', uuidv4());
        if (clearSongsError) throw clearSongsError;
        
        const { error: clearMembersError } = await supabase.from('members').delete().neq('id', uuidv4());
        if (clearMembersError) throw clearMembersError;

        toast({ title: 'Dados Apagados!', description: 'Todos os dados foram removidos com sucesso. A página será recarregada.'});
        
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    } catch (error: any) {
        console.error("Clear data error:", error);
        toast({ title: 'Erro ao Limpar Dados', description: `Não foi possível apagar os dados: ${error.message}`, variant: 'destructive'});
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <ScheduleContext.Provider value={{ 
      monthlySchedules, 
      members, 
      songs, 
      scheduleColumns,
      addSchedule,
      removeSchedule,
      updateSchedule,
      updateSchedulePlaylist,
      saveMember,
      removeMember,
      addSong,
      updateSong,
      removeSong,
      removeSongs,
      addOrUpdateSongs,
      importSongsFromTxt,
      updateSongs,
      exportData,
      importData,
      clearAllData,
      isLoading,
    }}>
      {isLoading ? (
          <div className="flex items-center justify-center h-screen bg-background">
              <p className="text-muted-foreground">Carregando dados...</p>
          </div>
      ) : children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};
