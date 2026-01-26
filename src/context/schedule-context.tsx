
'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import type { MonthlySchedule, Member, Song, BackupData } from '@/types';
import { subMonths } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { initialMembers, initialSongs, initialMonthlySchedules, scheduleColumns } from './initial-data';

// Helper to get data from localStorage
const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const storedValue = localStorage.getItem(key);
  if (storedValue) {
    try {
      return JSON.parse(storedValue, (k, v) => {
        // Reviver function to convert ISO strings back to Date objects
        if (k === 'date' && typeof v === 'string' && v.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/)) {
          return new Date(v);
        }
        return v;
      });
    } catch (e) {
      console.error(`Error parsing localStorage key "${key}":`, e);
      return defaultValue;
    }
  }
  return defaultValue;
};

// Helper to set data to localStorage
const setInStorage = <T,>(key: string, value: T) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
};


interface ScheduleContextType {
  monthlySchedules: MonthlySchedule[];
  members: Member[];
  songs: Song[];
  scheduleColumns: typeof scheduleColumns;
  addSchedule: (date: Date) => void;
  removeSchedule: (date: Date) => void;
  updateSchedule: (date: Date, updates: Partial<Omit<MonthlySchedule, 'date'>>) => void;
  updateSchedulePlaylist: (scheduleId: string, playlist: string[]) => void;
  saveMember: (member: Member) => void;
  removeMember: (memberId: string) => void;
  addSong: (songData: Omit<Song, 'id'>) => void;
  updateSong: (songId: string, updates: Partial<Song>) => void;
  removeSong: (songId: string) => void;
  removeSongs: (songIds: string[]) => void;
  addOrUpdateSongs: (songs: Song[]) => void;
  importSongsFromTxt: (songsToCreate: Omit<Song, 'id'>[], songsToUpdate: Omit<Song, 'id'>[]) => void;
  updateSongs: (songIds: string[], updates: Partial<Pick<Song, 'category' | 'artist' | 'key' | 'chords' | 'isNew'>>) => void;
  exportData: () => BackupData;
  importData: (data: BackupData) => void;
  clearAllData: () => void;
  isLoading: boolean;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
  const [members, setMembers] = useState<Member[]>(() => getFromStorage('members', initialMembers));
  const [rawSongs, setRawSongs] = useState<Song[]>(() => getFromStorage('songs', initialSongs));
  const [monthlySchedules, setMonthlySchedules] = useState<MonthlySchedule[]>(() => getFromStorage('monthlySchedules', initialMonthlySchedules));
  const [isLoading, setIsLoading] = useState(true);

  // Persist to localStorage on change
  useEffect(() => setInStorage('members', members), [members]);
  useEffect(() => setInStorage('songs', rawSongs), [rawSongs]);
  useEffect(() => setInStorage('monthlySchedules', monthlySchedules), [monthlySchedules]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

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


  const addSchedule = (date: Date) => {
    const newSchedule: MonthlySchedule = {
      id: uuidv4(),
      date,
      assignments: {},
    };
    setMonthlySchedules(prev => [...prev, newSchedule]);
  };

  const removeSchedule = (date: Date) => {
    setMonthlySchedules(prev => prev.filter(s => s.date.getTime() !== date.getTime()));
  };

  const updateSchedule = (date: Date, updates: Partial<Omit<MonthlySchedule, 'date'>>) => {
     setMonthlySchedules(prev => prev.map(s => s.date.getTime() === date.getTime() ? { ...s, ...updates } : s));
  };
  
  const updateSchedulePlaylist = (scheduleId: string, playlist: string[]) => {
    const [type, ...timestampParts] = scheduleId.replace('s-', '').split('-');
    const timestampStr = timestampParts.join('-');
    const timestamp = parseInt(timestampStr, 10);
    
    setMonthlySchedules(prev => prev.map(s => {
        if (s.date.getTime() === timestamp) {
            const fieldToUpdate = type === 'manha' ? 'playlist_manha' : 'playlist_noite';
            return { ...s, [fieldToUpdate]: playlist };
        }
        return s;
    }))
  };

  const saveMember = (member: Member) => {
      setMembers(prev => {
          const existingIndex = prev.findIndex(m => m.id === member.id);
          if (existingIndex > -1) {
              const newMembers = [...prev];
              newMembers[existingIndex] = member;
              return newMembers;
          }
          return [...prev, member];
      });
  }

  const removeMember = (memberId: string) => {
     setMembers(prev => prev.filter(m => m.id !== memberId));
     // Also clear from assignments
     setMonthlySchedules(prev => prev.map(schedule => {
         const newAssignments = { ...schedule.assignments };
         Object.keys(newAssignments).forEach(key => {
             newAssignments[key] = (newAssignments[key] || []).map(id => id === memberId ? null : id);
         });
         return { ...schedule, assignments: newAssignments };
     }))
  };
  
  const addSong = (songData: Omit<Song, 'id'>) => {
    const newSong: Song = { ...songData, id: uuidv4() };
    setRawSongs(prev => [...prev, newSong]);
  };

  const updateSong = (songId: string, updates: Partial<Song>) => {
    setRawSongs(prev => prev.map(s => s.id === songId ? { ...s, ...updates } : s));
  };
  
  const removeSongs = (songIds: string[]) => {
    setRawSongs(prev => prev.filter(s => !songIds.includes(s.id)));
    // Also remove from playlists
    setMonthlySchedules(prev => prev.map(schedule => ({
        ...schedule,
        playlist_manha: schedule.playlist_manha?.filter(id => !songIds.includes(id)),
        playlist_noite: schedule.playlist_noite?.filter(id => !songIds.includes(id)),
    })));
  };

  const removeSong = (songId: string) => removeSongs([songId]);

  const addOrUpdateSongs = (songsToUpdate: Song[]) => {
    setRawSongs(prevSongs => {
        const updatedSongs = [...prevSongs];
        songsToUpdate.forEach(songToUpdate => {
            const index = updatedSongs.findIndex(s => s.id === songToUpdate.id);
            if (index > -1) {
                updatedSongs[index] = {
                    ...updatedSongs[index],
                    timesPlayedQuarterly: songToUpdate.timesPlayedQuarterly
                };
            }
        });
        return updatedSongs;
    });
  };

  const importSongsFromTxt = (songsToCreate: Omit<Song, 'id'>[], songsToUpdate: Omit<Song, 'id'>[]) => {
      setRawSongs(prev => {
          const newSongs = songsToCreate.map(s => ({ ...s, id: uuidv4() }));
          let updatedSongs = [...prev, ...newSongs];

          songsToUpdate.forEach(songData => {
              const index = updatedSongs.findIndex(s => s.title.toLowerCase() === songData.title.toLowerCase() && s.artist.toLowerCase() === songData.artist.toLowerCase());
              if (index > -1) {
                  updatedSongs[index].lyrics = songData.lyrics;
              }
          });
          return updatedSongs;
      })
  }

  const updateSongs = (songIds: string[], updates: Partial<Pick<Song, 'category' | 'artist' | 'key' | 'chords' | 'isNew'>>) => {
    setRawSongs(prev => prev.map(song => songIds.includes(song.id) ? { ...song, ...updates } : song));
  };

  const exportData = (): BackupData => {
    return {
      members,
      songs: rawSongs,
      monthlySchedules: monthlySchedules.map(({ date, ...rest }) => ({ ...rest, date: date.toISOString() })),
      exportDate: new Date().toISOString(),
    };
  };

  const importData = (data: BackupData) => {
      setMembers(data.members || []);
      setRawSongs(data.songs || []);
      setMonthlySchedules(data.monthlySchedules.map(s => ({...s, date: new Date(s.date) })) || []);
  }

  const clearAllData = () => {
      setMembers([]);
      setRawSongs([]);
      setMonthlySchedules([]);
  }

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
