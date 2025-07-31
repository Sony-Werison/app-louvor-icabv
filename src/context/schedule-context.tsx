'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { MonthlySchedule, Member, Song, ScheduleColumn } from '@/types';
import { 
  members as initialMembers, 
  songs as initialSongs, 
  scheduleColumns as initialScheduleColumns,
  monthlySchedules as initialMonthlySchedules 
} from '@/lib/data';

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
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
  const [monthlySchedules, setMonthlySchedules] = useState<MonthlySchedule[]>(initialMonthlySchedules);
  const [members] = useState<Member[]>(initialMembers);
  const [songs, setSongs] = useState<Song[]>(initialSongs);
  const [scheduleColumns] = useState<ScheduleColumn[]>(initialScheduleColumns);

  const addSchedule = (date: Date) => {
    const newSchedule: MonthlySchedule = {
      date,
      assignments: {},
    };
    setMonthlySchedules(prev => [...prev, newSchedule].sort((a,b) => a.date.getTime() - b.date.getTime()));
  };

  const removeSchedule = (date: Date) => {
    setMonthlySchedules(prev => prev.filter(s => s.date.getTime() !== date.getTime()));
  };

  const updateSchedule = (date: Date, updates: Partial<Omit<MonthlySchedule, 'date'>>) => {
    setMonthlySchedules(prev => 
      prev.map(s => (s.date.getTime() === date.getTime() ? { ...s, ...updates } : s))
    );
  };
  
  const updateSchedulePlaylist = (scheduleId: string, playlist: string[]) => {
    const [type, timestampStr] = scheduleId.replace('s-', '').split('-');
    const timestamp = parseInt(timestampStr, 10);

    setMonthlySchedules(prevSchedules => {
        return prevSchedules.map(schedule => {
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
    });
  };

  const updateSong = (songId: string, updates: Partial<Song>) => {
    setSongs(prev => prev.map(s => s.id === songId ? { ...s, ...updates } : s));
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
    }}>
      {children}
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
