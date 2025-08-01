
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { MonthlySchedule, Member, Song, ScheduleColumn } from '@/types';
import { scheduleColumns as initialScheduleColumns } from '@/lib/data';
import {
  fetchMembers,
  fetchSongs,
  fetchMonthlySchedules,
  saveMembers,
  saveSongs,
  saveMonthlySchedules,
} from '@/lib/blob-storage';

interface ScheduleContextType {
  monthlySchedules: MonthlySchedule[];
  members: Member[];
  songs: Song[];
  scheduleColumns: ScheduleColumn[];
  addSchedule: (date: Date) => void;
  removeSchedule: (date: Date) => void;
  updateSchedule: (date: Date, updates: Partial<Omit<MonthlySchedule, 'date'>>) => void;
  updateSchedulePlaylist: (scheduleId: string, playlist: string[]) => void;
  updateSong: (songId: string, updates: Partial<Song>) => void;
  addOrUpdateSongs: (songsToAdd: Song[]) => void;
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
        setMembers(loadedMembers);
        setSongs(loadedSongs);
        setMonthlySchedules(loadedSchedules);
      } catch (error) {
        console.error("Failed to load data from blob store:", error);
        // Optionally handle error, e.g., show a toast
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

  const updateSong = (songId: string, updates: Partial<Song>) => {
    const newSongs = songs.map(s => s.id === songId ? { ...s, ...updates } : s);
    setSongs(newSongs);
    saveSongs(newSongs);
  };
  
  const addOrUpdateSongs = (songsToAdd: Song[]) => {
    const newSongs = [...songs];
    
    songsToAdd.forEach(song => {
      const existingSongIndex = newSongs.findIndex(s => s.title.toLowerCase() === song.title.toLowerCase());
      if (existingSongIndex > -1) {
        // Update existing song, preserving its ID, but updating frequency
        const existingSong = newSongs[existingSongIndex];
        newSongs[existingSongIndex] = { 
          ...existingSong, 
          timesPlayedQuarterly: song.timesPlayedQuarterly, 
          timesPlayedTotal: song.timesPlayedTotal 
        };
      } else {
        // Add new song
        newSongs.push({ ...song, id: `s${Date.now()}${Math.random()}` });
      }
    });
      
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
      updateSong,
      addOrUpdateSongs,
      isLoading,
    }}>
      {isLoading ? (
          <div className="flex items-center justify-center h-screen">
              <div>Carregando dados...</div>
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
