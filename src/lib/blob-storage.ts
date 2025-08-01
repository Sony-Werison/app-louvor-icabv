
'use server';
import { put, list, del, head } from '@vercel/blob';
import {
  songs as initialSongs,
  monthlySchedules as initialMonthlySchedules,
  members as initialMembers
} from './data';
import type { Member, Song, MonthlySchedule } from '@/types';

// Define keys for Vercel Blob (which are filenames)
const KEYS = {
  MEMBERS: 'members.json',
  SONGS: 'songs.json',
  SCHEDULES: 'monthlySchedules.json',
};

// --- Helper Functions ---
async function fetchData<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const blob = await head(key);
    const response = await fetch(blob.url);
     if (!response.ok) { 
          console.error(`Failed to fetch ${key}, status: ${response.status}`);
          // This might happen if the blob exists but is not accessible. Return default.
          return defaultValue;
      }
    return await response.json();
  } catch (error: any) {
    // If the blob does not exist (404), create it with default data.
    if (error?.status === 404) {
      console.log(`Blob ${key} not found. Seeding with initial data.`);
      await saveData(key, defaultValue);
      return defaultValue;
    }
    // For any other error, log it and return the default value.
    console.error(`Failed to fetch ${key}:`, error);
    return defaultValue;
  }
}

async function saveData<T>(key: string, data: T): Promise<void> {
    try {
        await put(key, JSON.stringify(data, null, 2), { 
            access: 'public',
            contentType: 'application/json',
            addRandomSuffix: false, // Ensure consistent filename
        });
    } catch (error) {
         console.error(`Failed to save ${key}:`, error);
    }
}


// --- Data Fetching Functions ---

export async function fetchMembers(): Promise<Member[]> {
  const members = await fetchData<Member[]>(KEYS.MEMBERS, initialMembers);
  return members || [];
}

export async function fetchSongs(): Promise<Song[]> {
  const songs = await fetchData<Song[]>(KEYS.SONGS, initialSongs);
  return songs || [];
}

export async function fetchMonthlySchedules(): Promise<MonthlySchedule[]> {
  const schedules = await fetchData<any[]>(KEYS.SCHEDULES, initialMonthlySchedules);
  if (!schedules) return [];
  // Deserialize dates from string
  return schedules.map(s => ({ ...s, date: new Date(s.date) }));
}

// --- Data Mutation Functions ---

export async function saveMembers(members: Member[]): Promise<void> {
  await saveData(KEYS.MEMBERS, members);
}

export async function saveSongs(songs: Song[]): Promise<void> {
  await saveData(KEYS.SONGS, songs);
}

export async function saveMonthlySchedules(schedules: MonthlySchedule[]): Promise<void> {
  // Serialize dates to string before storing
  const schedulesToStore = schedules.map(s => ({
    ...s,
    date: s.date.toISOString(),
  }));
  await saveData(KEYS.SCHEDULES, schedulesToStore);
}
