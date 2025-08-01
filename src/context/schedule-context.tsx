
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { MonthlySchedule, Member, Song, ScheduleColumn, SongCategory } from '@/types';
import { scheduleColumns as initialScheduleColumns } from '@/lib/data';
import {
  fetchMembers,
  fetchSongs,
  fetchMonthlySchedules,
  saveMembers,
  saveSongs,
  saveMonthlySchedules,
} from '@/lib/blob-storage';
import { getDay } from 'date-fns';

interface ScheduleContextType {
  monthlySchedules: MonthlySchedule[];
  members: Member[];
  songs: Song[];
  scheduleColumns: ScheduleColumn[];
  addSchedule: (date: Date) => void;
  removeSchedule: (date: Date) => void;
  updateSchedule: (date: Date, updates: Partial<Omit<MonthlySchedule, 'date'>>) => void;
  updateSchedulePlaylist: (scheduleId: string, playlist: string[]) => void;
  addMember: (memberData: Omit<Member, 'id'>) => void;
  updateMember: (memberId: string, updates: Partial<Member>) => void;
  removeMember: (memberId: string) => void;
  addSong: (songData: Omit<Song, 'id'>) => void;
  updateSong: (songId: string, updates: Partial<Song>) => void;
  removeSong: (songId: string) => void;
  removeSongs: (songIds: string[]) => void;
  addOrUpdateSongs: (songs: Song[]) => void;
  importSongsFromTxt: (songsToCreate: Omit<Song, 'id'>[], songsToUpdate: Omit<Song, 'id'>[]) => void;
  updateSongs: (songIds: string[], updates: Partial<Pick<Song, 'category' | 'artist' | 'key' | 'chords'>>) => void;
  isLoading: boolean;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
  const [monthlySchedules, setMonthlySchedules] = useState<MonthlySchedule[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [scheduleColumns] = useState<ScheduleColumn[]>(initialScheduleColumns);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from blob storage on initial render
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [loadedMembers, loadedSongs, loadedSchedules] = await Promise.all([
          fetchMembers(),
          fetchSongs(),
          fetchMonthlySchedules(),
        ]);
        
        const correctedSchedules = loadedSchedules.filter(schedule => {
            const day = getDay(schedule.date);
            return day === 0;
        });

        if (correctedSchedules.length !== loadedSchedules.length) {
            await saveMonthlySchedules(correctedSchedules);
        }
        
        setMembers(loadedMembers);
        setSongs(loadedSongs);
        setMonthlySchedules(correctedSchedules);

      } catch (error) {
        console.error("Failed to load data from blob store:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const addSchedule = (date: Date) => {
    const newSchedule: MonthlySchedule = {
      date,
      assignments: {},
    };
    const newSchedules = [...monthlySchedules, newSchedule].sort((a,b) => a.date.getTime() - b.date.getTime());
    setMonthlySchedules(newSchedules);
    saveMonthlySchedules(newSchedules);
  };

  const removeSchedule = (date: Date) => {
    const newSchedules = monthlySchedules.filter(s => s.date.getTime() !== date.getTime());
    setMonthlySchedules(newSchedules);
    saveMonthlySchedules(newSchedules);
  };

  const updateSchedule = (date: Date, updates: Partial<Omit<MonthlySchedule, 'date'>>) => {
    const newSchedules = monthlySchedules.map(s => (s.date.getTime() === date.getTime() ? { ...s, ...updates } : s));
    setMonthlySchedules(newSchedules);
    saveMonthlySchedules(newSchedules);
  };
  
  const updateSchedulePlaylist = (scheduleId: string, playlist: string[]) => {
    const [type, timestampStr] = scheduleId.replace('s-', '').split('-');
    const timestamp = parseInt(timestampStr, 10);

    const newSchedules = monthlySchedules.map(schedule => {
        if (schedule.date.getTime() === timestamp) {
            const newSchedule = { ...schedule };
            if (type === 'manha') {
                newSchedule.playlist_manha = playlist;
            } else if (type === 'noite') {
                newSchedule.playlist_noite = playlist;
            }
            return newSchedule;
        }
        return schedule;
    });
    setMonthlySchedules(newSchedules);
    saveMonthlySchedules(newSchedules);
  };

  const addMember = (memberData: Omit<Member, 'id'>) => {
    const newMember: Member = { ...memberData, id: `m${Date.now()}` };
    const newMembers = [...members, newMember];
    setMembers(newMembers);
    saveMembers(newMembers);
  };

  const updateMember = (memberId: string, updates: Partial<Member>) => {
    const newMembers = members.map(m => m.id === memberId ? { ...m, ...updates } as Member : m);
    setMembers(newMembers);
    saveMembers(newMembers);
  };

  const removeMember = (memberId: string) => {
    const newMembers = members.filter(m => m.id !== memberId);
    setMembers(newMembers);
    saveMembers(newMembers);
    const updatedSchedules = monthlySchedules.map(schedule => {
      const newAssignments = { ...schedule.assignments };
      Object.keys(newAssignments).forEach(columnId => {
        newAssignments[columnId] = newAssignments[columnId].map(id => id === memberId ? null : id);
      });
      return { ...schedule, assignments: newAssignments };
    });
    setMonthlySchedules(updatedSchedules);
    saveMonthlySchedules(updatedSchedules);
  };
  
  const addSong = (songData: Omit<Song, 'id'>) => {
    const newSong: Song = { ...songData, id: `s${Date.now()}` };
    const newSongs = [...songs, newSong];
    setSongs(newSongs);
    saveSongs(newSongs);
  };

  const updateSong = (songId: string, updates: Partial<Song>) => {
    const newSongs = songs.map(s => s.id === songId ? { ...s, ...updates } as Song : s);
    setSongs(newSongs);
    saveSongs(newSongs);
  };

  const removeSong = (songId: string) => {
    removeSongs([songId]);
  };
  
  const removeSongs = (songIds: string[]) => {
    const songIdSet = new Set(songIds);
    const newSongs = songs.filter(s => !songIdSet.has(s.id));
    setSongs(newSongs);
    saveSongs(newSongs);

    const updatedSchedules = monthlySchedules.map(schedule => ({
      ...schedule,
      playlist_manha: schedule.playlist_manha?.filter(id => !songIdSet.has(id)),
      playlist_noite: schedule.playlist_noite?.filter(id => !songIdSet.has(id)),
    }));
    setMonthlySchedules(updatedSchedules);
    saveMonthlySchedules(updatedSchedules);
  };

  const addOrUpdateSongs = (songsToUpdate: Song[]) => {
    const songsToUpdateMap = new Map(songsToUpdate.map(s => [s.id, s]));
    
    const newSongs = songs.map(song => {
      if (songsToUpdateMap.has(song.id)) {
        const updatedSongData = songsToUpdateMap.get(song.id)!;
        return { 
          ...song, 
          timesPlayedQuarterly: updatedSongData.timesPlayedQuarterly, 
          timesPlayedTotal: updatedSongData.timesPlayedTotal 
        };
      }
      return song;
    });
      
    setSongs(newSongs);
    saveSongs(newSongs);
  };

  const importSongsFromTxt = (songsToCreate: Omit<Song, 'id'>[], songsToUpdate: Omit<Song, 'id'>[]) => {
    let newSongs = [...songs];

    // Update existing songs' lyrics
    const updateMap = new Map(songsToUpdate.map(s => [s.title.toLowerCase(), s]));
    newSongs = newSongs.map(existingSong => {
      const newVersion = updateMap.get(existingSong.title.toLowerCase());
      if (newVersion && newVersion.artist.toLowerCase() === existingSong.artist.toLowerCase()) {
        return { ...existingSong, lyrics: newVersion.lyrics };
      }
      return existingSong;
    });

    // Add new songs
    const newSongsToAdd = songsToCreate.map(songData => ({
        ...songData,
        id: `s${Date.now()}${Math.random().toString(36).substring(2, 9)}`
    }));

    newSongs.push(...newSongsToAdd);

    setSongs(newSongs);
    saveSongs(newSongs);
  }

  const updateSongs = (songIds: string[], updates: Partial<Pick<Song, 'category' | 'artist' | 'key' | 'chords'>>) => {
    const songIdSet = new Set(songIds);
    const newSongs = songs.map(s =>
      songIdSet.has(s.id) ? { ...s, ...updates } : s
    );
    setSongs(newSongs);
    saveSongs(newSongs);
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
      addMember,
      updateMember,
      removeMember,
      addSong,
      updateSong,
      removeSong,
      removeSongs,
      addOrUpdateSongs,
      importSongsFromTxt,
      updateSongs,
      isLoading,
    }}>
      {isLoading ? (
          <div className="flex items-center justify-center h-screen bg-background">
              <div className="flex flex-col items-center gap-2">
                <p className="text-muted-foreground">Carregando dados da nuvem...</p>
              </div>
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
