
'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback } from 'react';
import type { MonthlySchedule, Member, Song, BackupData, ImportSelections } from '@/types';
import { subMonths } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { scheduleColumns } from './initial-data';


interface ScheduleContextType {
  monthlySchedules: MonthlySchedule[];
  members: Member[];
  songs: Song[];
  scheduleColumns: typeof scheduleColumns;
  addSchedule: (date: Date) => Promise<void>;
  removeSchedule: (id: string) => Promise<void>;
  updateSchedule: (id: string, updates: Partial<Omit<MonthlySchedule, 'id'>>) => Promise<void>;
  updateSchedulePlaylist: (scheduleId: string, playlist: string[]) => Promise<void>;
  saveMember: (member: Member, avatarFile?: File | null) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  addSong: (songData: Omit<Song, 'id'>) => Promise<void>;
  updateSong: (songId: string, updates: Partial<Song>) => Promise<void>;
  removeSong: (songId: string) => Promise<void>;
  removeSongs: (songIds: string[]) => Promise<void>;
  addOrUpdateSongs: (songs: Song[]) => Promise<void>;
  importSongsFromTxt: (songsToCreate: Omit<Song, 'id'>[], songsToUpdate: Omit<Song, 'id'>[]) => Promise<void>;
  updateSongs: (songIds: string[], updates: Partial<Pick<Song, 'category' | 'artist' | 'key' | 'chords' | 'isNew'>>) => Promise<void>;
  exportData: () => Promise<BackupData>;
  importData: (data: BackupData, selections: ImportSelections) => Promise<void>;
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

  const fetchData = useCallback(async () => {
    if (!supabase) {
      setMembers([]);
      setRawSongs([]);
      setMonthlySchedules([]);
      setIsLoading(false);
      return;
    }
    
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
      })).sort((a,b) => a.date.getTime() - b.date.getTime());
      setMonthlySchedules(parsedSchedules);

    } catch (error: any) {
      console.error("Error fetching data from Supabase:", error);
      toast({ title: 'Erro ao buscar dados', description: `Não foi possível carregar os dados. Verifique a conexão e as configurações do banco de dados. Detalhes: ${error.message}`, variant: 'destructive'});
      setMembers([]);
      setRawSongs([]);
      setMonthlySchedules([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setIsLoading(true);
    fetchData();
  }, [fetchData]);

  const songs = useMemo(() => {
    const today = new Date();
    const threeMonthsAgo = subMonths(today, 3);
    const scheduleQuarterlyCounts = new Map<string, number>();
    const scheduleTotalCounts = new Map<string, number>();

    monthlySchedules.forEach(schedule => {
        const scheduleDate = new Date(schedule.date);
        const playlists = [schedule.playlist_manha, schedule.playlist_noite].filter(Boolean) as string[][];

        playlists.forEach(playlist => {
            playlist.forEach(songId => {
                scheduleTotalCounts.set(songId, (scheduleTotalCounts.get(songId) || 0) + 1);
                if (scheduleDate >= threeMonthsAgo) {
                    scheduleQuarterlyCounts.set(songId, (scheduleQuarterlyCounts.get(songId) || 0) + 1);
                }
            });
        });
    });
    
    return rawSongs.map(song => ({
        ...song,
        timesPlayedQuarterly: (song.timesPlayedQuarterly || 0) + (scheduleQuarterlyCounts.get(song.id) || 0),
        timesPlayedTotal: (song.timesPlayedTotal || 0) + (scheduleTotalCounts.get(song.id) || 0),
    }));
  }, [rawSongs, monthlySchedules]);


  const addSchedule = async (date: Date) => {
    if (!supabase) {
        toast({ title: 'Operação não disponível', description: 'Supabase não está configurado.', variant: 'destructive'});
        return;
    }
    const newScheduleData = {
      id: uuidv4(),
      date: date.toISOString(),
      assignments: {},
      playlist_manha: [],
      playlist_noite: [],
      isFeatured: false,
    };
    const { error } = await supabase.from('monthly_schedules').insert(newScheduleData);
    if (error) {
        toast({ title: 'Falha ao Adicionar Data', description: `A operação foi bloqueada. Verifique as Políticas de Segurança (RLS) da sua tabela no Supabase. Erro: ${error.message}`, variant: 'destructive'});
        console.error(error);
        return;
    }
    await fetchData();
  };

  const removeSchedule = async (id: string) => {
    if (!supabase) {
        toast({ title: 'Operação não disponível', description: 'Supabase não está configurado.', variant: 'destructive'});
        return;
    }
    
    const { error } = await supabase.from('monthly_schedules').delete().eq('id', id);
    if (error) {
        toast({ title: 'Falha ao Remover Data', description: `A operação foi bloqueada. Verifique as Políticas de Segurança (RLS) da sua tabela no Supabase. Erro: ${error.message}`, variant: 'destructive'});
        console.error(error);
        return;
    }
    await fetchData();
  };

  const updateSchedule = async (id: string, updates: Partial<Omit<MonthlySchedule, 'id'>>) => {
    if (!supabase) {
        toast({ title: 'Operação não disponível', description: 'Supabase não está configurado.', variant: 'destructive'});
        return;
    }
    
    const updatePayload: { [key: string]: any } = { ...updates };
    if (updates.date) {
      updatePayload.date = updates.date.toISOString();
    }
    
    const { error } = await supabase
      .from('monthly_schedules')
      .update(updatePayload)
      .eq('id', id);

     if (error) {
        toast({ title: 'Falha ao Salvar Escala', description: `A operação foi bloqueada. Verifique as Políticas de Segurança (RLS) da sua tabela no Supabase. Erro: ${error.message}`, variant: 'destructive'});
        console.error(error);
        return;
    }
    await fetchData();
  };
  
  const updateSchedulePlaylist = async (scheduleId: string, playlist: string[]) => {
    if (!supabase) {
        toast({ title: 'Operação não disponível', description: 'Supabase não está configurado.', variant: 'destructive'});
        return;
    }
    
    const idParts = scheduleId.split('-');
    const type = idParts[1];
    const monthlyScheduleId = idParts.slice(2).join('-');

    if (!monthlyScheduleId || (type !== 'manha' && type !== 'noite')) {
        toast({ title: 'Erro ao salvar repertório', description: 'ID da escala inválido.', variant: 'destructive'});
        return;
    }

    const fieldToUpdate = type === 'manha' ? 'playlist_manha' : 'playlist_noite';
    
    const { error } = await supabase.from('monthly_schedules').update({ [fieldToUpdate]: playlist }).eq('id', monthlyScheduleId);

    if (error) {
      toast({ title: 'Falha ao Atualizar Repertório', description: `A operação foi bloqueada. Verifique as Políticas de Segurança (RLS) da sua tabela no Supabase. Erro: ${error.message}`, variant: 'destructive'});
      console.error(error);
      return;
    }
     await fetchData();
  };

  const saveMember = async (member: Member, avatarFile?: File | null) => {
    if (!supabase) {
        toast({ title: 'Operação não disponível', description: 'Supabase não está configurado.', variant: 'destructive'});
        return;
    }

    let memberDataToSave = { ...member };

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `public/${member.id}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        toast({ title: 'Erro no upload da imagem', description: uploadError.message, variant: 'destructive' });
        console.error(uploadError);
        return;
      }
      
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      memberDataToSave.avatar = urlData.publicUrl ? `${urlData.publicUrl}?t=${new Date().getTime()}` : '';
    }

    const { error } = await supabase.from('members').upsert(memberDataToSave);
    if(error){
        toast({ title: 'Falha ao Salvar Membro', description: `A operação foi bloqueada. Verifique as Políticas de Segurança (RLS) da sua tabela no Supabase. Erro: ${error.message}`, variant: 'destructive'});
        console.error(error);
        return;
    }
    await fetchData();
  }

  const removeMember = async (memberId: string) => {
     if (!supabase) {
        toast({ title: 'Operação não disponível', description: 'Supabase não está configurado.', variant: 'destructive'});
        return;
    }

     const { error } = await supabase.from('members').delete().eq('id', memberId);
     if(error){
        toast({ title: 'Falha ao Remover Membro', description: `A operação foi bloqueada. Verifique as Políticas de Segurança (RLS) da sua tabela no Supabase. Erro: ${error.message}`, variant: 'destructive'});
        return;
     }
     await fetchData();
  };
  
  const addSong = async (songData: Omit<Song, 'id'>) => {
    if (!supabase) {
        toast({ title: 'Operação não disponível', description: 'Supabase não está configurado.', variant: 'destructive'});
        return;
    }
    const newSong = { ...songData, id: uuidv4(), isNew: true };
    const { error } = await supabase.from('songs').insert(newSong);
    if (error) {
        toast({ title: 'Falha ao Adicionar Música', description: `A operação foi bloqueada. Verifique as Políticas de Segurança (RLS) da sua tabela no Supabase. Erro: ${error.message}`, variant: 'destructive'});
        console.error(error);
        return;
    }
    await fetchData();
  };

  const updateSong = async (songId: string, updates: Partial<Song>) => {
    if (!supabase) {
        toast({ title: 'Operação não disponível', description: 'Supabase não está configurado.', variant: 'destructive'});
        return;
    }
    
    const { error } = await supabase.from('songs').update(updates).eq('id', songId);
    
    if(error){
        toast({ title: 'Falha ao Atualizar Música', description: `A operação foi bloqueada. Verifique as Políticas de Segurança (RLS) da sua tabela no Supabase. Erro: ${error.message}`, variant: 'destructive'});
        console.error(error);
        return;
    }
    await fetchData();
  };
  
  const removeSongs = async (songIds: string[]) => {
    if (!supabase) {
        toast({ title: 'Operação não disponível', description: 'Supabase não está configurado.', variant: 'destructive'});
        return;
    }

    const { error } = await supabase.from('songs').delete().in('id', songIds);
    if(error){
        toast({ title: 'Falha ao Remover Músicas', description: `A operação foi bloqueada. Verifique as Políticas de Segurança (RLS) da sua tabela no Supabase. Erro: ${error.message}`, variant: 'destructive'});
        return;
    }
    await fetchData();
  };

  const removeSong = async (songId: string) => removeSongs([songId]);

  const addOrUpdateSongs = async (songsToUpdate: Song[]) => {
    if (!supabase) {
        toast({ title: 'Operação não disponível', description: 'Supabase não está configurado.', variant: 'destructive'});
        return;
    }
    const { error } = await supabase.from('songs').upsert(songsToUpdate, { onConflict: 'title' });
    if (error) {
      toast({ title: 'Falha ao Atualizar Músicas', description: `A operação foi bloqueada. Verifique as Políticas de Segurança (RLS) da sua tabela no Supabase. Erro: ${error.message}`, variant: 'destructive'});
      return;
    }
    await fetchData();
  };

  const importSongsFromTxt = async (songsToCreate: Omit<Song, 'id'>[], songsToUpdate: Omit<Song, 'id'>[]) => {
      if (!supabase) {
        toast({ title: 'Operação não disponível', description: 'Supabase não está configurado.', variant: 'destructive'});
        return;
    }
      const createPromises = supabase.from('songs').insert(songsToCreate.map(s => ({...s, isNew: true})));
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
          toast({ title: 'Erro ao importar de TXT', description: 'Algumas músicas podem não ter sido importadas. Verifique as políticas de segurança (RLS).', variant: 'destructive'});
      } else {
          toast({ title: 'Importação de TXT concluída!'});
      }
      await fetchData();
  }

  const updateSongs = async (songIds: string[], updates: Partial<Pick<Song, 'category' | 'artist' | 'key' | 'chords' | 'isNew'>>) => {
    if (!supabase) {
        toast({ title: 'Operação não disponível', description: 'Supabase não está configurado.', variant: 'destructive'});
        return;
    }
    
    const { error } = await supabase.from('songs').update(updates).in('id', songIds);
      if (error) {
          toast({ title: 'Falha ao Atualizar Músicas', description: `A operação foi bloqueada. Verifique as Políticas de Segurança (RLS) da sua tabela no Supabase. Erro: ${error.message}`, variant: 'destructive'});
          console.error(error);
          return;
      }
      await fetchData();
  };

 const exportData = async (): Promise<BackupData> => {
    if (!supabase) {
        toast({ title: 'Operação não disponível', description: 'Supabase não está configurado.', variant: 'destructive'});
        throw new Error("Supabase not configured");
    }
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


  const importData = async (data: BackupData, selections: ImportSelections) => {
    if (!supabase) {
        toast({ title: 'Operação não disponível', description: 'Supabase não está configurado.', variant: 'destructive'});
        return;
    }
    setIsLoading(true);
    toast({ title: 'Iniciando importação...', description: 'Processando dados selecionados...' });

    try {
      if (selections.monthlySchedules) {
        const { error } = await supabase.from('monthly_schedules').delete().neq('id', uuidv4());
        if (error) throw new Error(`Falha ao limpar escalas: ${error.message}`);
        
        const schedulesToInsert = data.monthlySchedules.map(s => ({
          id: s.id || uuidv4(),
          date: new Date(s.date).toISOString(),
          assignments: s.assignments || {},
          playlist_manha: s.playlist_manha || [],
          playlist_noite: s.playlist_noite || [],
          isFeatured: s.isFeatured || false,
          name_manha: s.name_manha || '',
          name_noite: s.name_noite || '',
        }));

        const { error: insertError } = await supabase.from('monthly_schedules').insert(schedulesToInsert);
        if (insertError) throw new Error(`Falha ao inserir escalas: ${insertError.message}`);
      }

      if (selections.songs) {
        const { error } = await supabase.from('songs').delete().neq('id', uuidv4());
        if (error) throw new Error(`Falha ao limpar músicas: ${error.message}`);
        const { error: insertError } = await supabase.from('songs').insert(data.songs);
        if (insertError) throw new Error(`Falha ao inserir músicas: ${insertError.message}`);
      }
      
      if (selections.members) {
        const { error } = await supabase.from('members').delete().neq('id', uuidv4());
        if (error) throw new Error(`Falha ao limpar membros: ${error.message}`);
        const { error: insertError } = await supabase.from('members').insert(data.members);
        if (insertError) throw new Error(`Falha ao inserir membros: ${insertError.message}`);
      }
      
      toast({ title: 'Importação Concluída!', description: 'Os dados foram restaurados com sucesso. A página será recarregada.'});
      
      setTimeout(() => {
          window.location.reload();
      }, 2000);

    } catch (error: any) {
        console.error("Import error:", error);
        toast({ title: 'Erro na Importação', description: error.message, variant: 'destructive'});
    } finally {
        setIsLoading(false);
    }
  };


  const clearAllData = async () => {
    if (!supabase) {
        toast({ title: 'Operação não disponível', description: 'Supabase não está configurado.', variant: 'destructive'});
        return;
    }
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
      {isLoading && (
          <div className="flex items-center justify-center h-screen bg-background">
              <p className="text-muted-foreground">Carregando dados...</p>
          </div>
      )}
      {!isLoading && children}
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
