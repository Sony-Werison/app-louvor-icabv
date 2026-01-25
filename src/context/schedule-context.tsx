'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import type { MonthlySchedule, Member, Song, ScheduleColumn, SongCategory, MemberRole } from '@/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, Timestamp, where, query } from 'firebase/firestore';
import { setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useAuth } from './auth-context';
import { subMonths } from 'date-fns';

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
  updateSongs: (songIds: string[], updates: Partial<Pick<Song, 'category' | 'artist' | 'key' | 'chords' | 'isNew'>>) => void;
  isLoading: boolean;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

// Hardcoded for now, would be in a DB in a real app
const initialScheduleColumns: ScheduleColumn[] = [
    { id: 'abertura_manha', label: 'Abertura Manhã', role: 'Abertura' },
    { id: 'pregacao_manha', label: 'Pregação Manhã', role: 'Pregação' },
    { id: 'abertura_noite', label: 'Abertura Noite', role: 'Abertura' },
    { id: 'pregacao_noite', label: 'Pregação Noite', role: 'Pregação' },
    { id: 'multimedia', label: 'Multimídia', isMulti: true, role: 'Multimídia' },
];

export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
  const firestore = useFirestore();
  const { user, userId } = useAuth();

  const membersCollection = useMemoFirebase(() => collection(firestore, 'members'), [firestore]);
  const songsCollection = useMemoFirebase(() => collection(firestore, 'songs'), [firestore]);

  const schedulesQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(collection(firestore, 'schedules'), where('participantIds', 'array-contains', userId));
  }, [firestore, userId]);
  

  const { data: membersData, isLoading: loadingMembers } = useCollection<Member>(membersCollection);
  const { data: songsData, isLoading: loadingSongs } = useCollection<Song>(songsCollection);
  const { data: schedulesData, isLoading: loadingSchedules } = useCollection<Omit<MonthlySchedule, 'date'> & {date: Timestamp}>(schedulesQuery);

  const monthlySchedules = useMemo(() => {
    if (!schedulesData) return [];
    return schedulesData.map(s => ({
      ...s,
      date: s.date.toDate(),
    }));
  }, [schedulesData]);

  const members = useMemo(() => membersData || [], [membersData]);
  const rawSongs = useMemo(() => songsData || [], [songsData]);

  const songs = useMemo(() => {
    const today = new Date();
    const threeMonthsAgo = subMonths(today, 3);
    const quarterlyPlayCounts = new Map<string, number>();
    const totalPlayCounts = new Map<string, number>();

    monthlySchedules.forEach(schedule => {
        const scheduleDate = new Date(schedule.date);
        const playlists = [schedule.playlist_manha, schedule.playlist_noite].filter(Boolean) as string[][];

        playlists.forEach(playlist => {
            playlist.forEach(songId => {
                totalPlayCounts.set(songId, (totalPlayCounts.get(songId) || 0) + 1);
                if (scheduleDate >= threeMonthsAgo) {
                    quarterlyPlayCounts.set(songId, (quarterlyPlayCounts.get(songId) || 0) + 1);
                }
            });
        });
    });
    
    return rawSongs.map(song => ({
        ...song,
        timesPlayedQuarterly: (quarterlyPlayCounts.get(song.id) || 0) + (song.timesPlayedQuarterly || 0),
        timesPlayedTotal: (totalPlayCounts.get(song.id) || 0) + (song.timesPlayedTotal || 0)
    }));
  }, [rawSongs, monthlySchedules]);

  const isLoading = loadingMembers || loadingSongs || loadingSchedules;

  const addSchedule = (date: Date) => {
    if (!user) return;
    const newSchedule: Omit<MonthlySchedule, 'id'> = {
      date: Timestamp.fromDate(date),
      assignments: {},
      participantIds: [user.uid],
      members: {
        [user.uid]: 'admin'
      }
    };
    addDocumentNonBlocking(collection(firestore, 'schedules'), newSchedule);
  };

  const removeSchedule = (date: Date) => {
    const schedule = monthlySchedules.find(s => s.date.getTime() === date.getTime());
    if (schedule) {
      deleteDocumentNonBlocking(doc(firestore, 'schedules', schedule.id));
    }
  };

  const updateSchedule = (date: Date, updates: Partial<Omit<MonthlySchedule, 'date'>>) => {
    const schedule = monthlySchedules.find(s => s.date.getTime() === date.getTime());
    if (schedule) {
      const finalUpdates = { ...updates };

      if (updates.assignments) {
        const currentAdmins = Object.entries(schedule.members || {})
          .filter(([, role]) => role === 'admin')
          .map(([uid]) => uid);
        
        const allAssignedIds = Object.values(updates.assignments).flat().filter(id => id !== null) as string[];
        
        const newMembersMap: Record<string, 'admin' | 'participant'> = {};
        currentAdmins.forEach(uid => { newMembersMap[uid] = 'admin'; });
        allAssignedIds.forEach(uid => {
          if (!newMembersMap[uid]) {
            newMembersMap[uid] = 'participant';
          }
        });

        finalUpdates.members = newMembersMap;
        finalUpdates.participantIds = Object.keys(newMembersMap);
      }

      const scheduleRef = doc(firestore, 'schedules', schedule.id);
      updateDocumentNonBlocking(scheduleRef, finalUpdates);
    }
  };
  
  const updateSchedulePlaylist = (scheduleId: string, playlist: string[]) => {
    const [type, ...timestampParts] = scheduleId.replace('s-', '').split('-');
    const timestamp = parseInt(timestampParts.join('-'), 10);
    
    const schedule = monthlySchedules.find(s => s.date.getTime() === timestamp);
    if(schedule) {
        const fieldToUpdate = type === 'manha' ? 'playlist_manha' : 'playlist_noite';
        updateDocumentNonBlocking(doc(firestore, 'schedules', schedule.id), { [fieldToUpdate]: playlist });
    }
  };

  const addMember = (memberData: Omit<Member, 'id'>) => {
    addDocumentNonBlocking(collection(firestore, 'members'), memberData);
  };

  const updateMember = (memberId: string, updates: Partial<Member>) => {
    updateDocumentNonBlocking(doc(firestore, 'members', memberId), updates);
  };

  const removeMember = (memberId: string) => {
     deleteDocumentNonBlocking(doc(firestore, 'members', memberId));
     // This part is more complex with Firestore and might need a batch write or cloud function
     // For now, we leave assigned members as stale references that won't resolve.
  };
  
  const addSong = (songData: Omit<Song, 'id'>) => {
    addDocumentNonBlocking(collection(firestore, 'songs'), songData);
  };

  const updateSong = (songId: string, updates: Partial<Song>) => {
    updateDocumentNonBlocking(doc(firestore, 'songs', songId), updates);
  };

  const removeSong = (songId: string) => {
    removeSongs([songId]);
  };
  
  const removeSongs = async (songIds: string[]) => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    songIds.forEach(id => {
      batch.delete(doc(firestore, 'songs', id));
    });
    
    // Also remove from playlists (this is a client-side heavy operation)
    // A cloud function would be better for this at scale.
    monthlySchedules.forEach(schedule => {
        let changed = false;
        const newPlaylistManha = schedule.playlist_manha?.filter(id => !songIds.includes(id));
        const newPlaylistNoite = schedule.playlist_noite?.filter(id => !songIds.includes(id));
        
        if (newPlaylistManha && newPlaylistManha.length !== (schedule.playlist_manha?.length || 0)) {
            changed = true;
        }
        if (newPlaylistNoite && newPlaylistNoite.length !== (schedule.playlist_noite?.length || 0)) {
            changed = true;
        }
        if (changed) {
            batch.update(doc(firestore, 'schedules', schedule.id), {
                playlist_manha: newPlaylistManha,
                playlist_noite: newPlaylistNoite,
            });
        }
    });

    await batch.commit();
  };

  const addOrUpdateSongs = async (songsToUpdate: Song[]) => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    songsToUpdate.forEach(song => {
        const docRef = doc(firestore, 'songs', song.id);
        batch.update(docRef, { 
            timesPlayedQuarterly: song.timesPlayedQuarterly, 
            timesPlayedTotal: song.timesPlayedTotal 
        });
    });
    await batch.commit();
  };

  const importSongsFromTxt = async (songsToCreate: Omit<Song, 'id'>[], songsToUpdate: Omit<Song, 'id'>[]) => {
      if (!firestore) return;
      const batch = writeBatch(firestore);
      
      songsToCreate.forEach(songData => {
          const newDocRef = doc(collection(firestore, 'songs'));
          batch.set(newDocRef, songData);
      });

      songsToUpdate.forEach(songData => {
          const existing = rawSongs.find(s => s.title.toLowerCase() === songData.title.toLowerCase() && s.artist.toLowerCase() === songData.artist.toLowerCase());
          if (existing) {
              batch.update(doc(firestore, 'songs', existing.id), { lyrics: songData.lyrics });
          }
      });

      await batch.commit();
  }

  const updateSongs = async (songIds: string[], updates: Partial<Pick<Song, 'category' | 'artist' | 'key' | 'chords' | 'isNew'>>) => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    songIds.forEach(id => {
        batch.update(doc(firestore, 'songs', id), updates);
    });
    await batch.commit();
  };


  return (
    <ScheduleContext.Provider value={{ 
      monthlySchedules, 
      members, 
      songs, 
      scheduleColumns: initialScheduleColumns,
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
                <p className="text-muted-foreground">Carregando dados...</p>
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
