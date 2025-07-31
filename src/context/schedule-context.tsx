'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
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
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
  const [monthlySchedules, setMonthlySchedules] = useState<MonthlySchedule[]>(initialMonthlySchedules);
  const [members] = useState<Member[]>(initialMembers);
  const [songs] = useState<Song[]>(initialSongs);
  const [scheduleColumns] = useState<ScheduleColumn[]>(initialScheduleColumns);

  const addSchedule = (date: Date) => {
    const newSchedule: MonthlySchedule = {
      date,
      assignments: scheduleColumns.reduce((acc, col) => {
        acc[col.id] = col.isMulti ? [null, null] : [null];
        return acc;
      }, {} as Record<string, (string | null)[]>),
    };
    setMonthlySchedules(prev => [...prev, newSchedule]);
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
    // This is more complex as it involves transforming the monthly schedule.
    // For now, we'll leave this as a placeholder for a more robust implementation if needed.
    console.log("Updating playlist for schedule:", scheduleId, playlist);
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
