
'use server';
import { put, list, del, head } from '@vercel/blob';
import {
  members as initialMembers,
  songs as initialSongs,
  monthlySchedules as initialMonthlySchedules,
} from './data';
import type { Member, Song, MonthlySchedule } from '@/types';

// Define keys for Vercel Blob (which are filenames)
const KEYS = {
  MEMBERS: 'members.json',
  SONGS: 'songs.json',
  SCHEDULES: 'monthlySchedules.json',
  INITIALIZED: 'db_initialized.flag',
};

async function initializeDatabase() {
  try {
    await head(KEYS.INITIALIZED);
  } catch (error: any) {
    if (error.status === 404) {
      console.log('Database not initialized. Seeding with initial data...');
      await Promise.all([
        saveMembers(initialMembers),
        saveSongs(initialSongs),
        saveMonthlySchedules(initialMonthlySchedules),
        put(KEYS.INITIALIZED, 'true', { access: 'public' }),
      ]);
      console.log('Database seeded successfully.');
    } else {
        throw error;
    }
  }
}

// Ensure the database is initialized on startup
initializeDatabase().catch(console.error);

// --- Helper Functions ---
async function fetchData<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const blob = await list({ prefix: key, limit: 1 });
    if (blob.blobs.length > 0) {
      const response = await fetch(blob.blobs[0].url);
      if (!response.ok) { // Check for HTTP errors
          console.error(`Failed to fetch ${key}, status: ${response.status}`);
          return defaultValue;
      }
      return await response.json();
    }
    return defaultValue;
  } catch (error) {
    console.error(`Failed to fetch ${key}:`, error);
    return defaultValue;
  }
}

async function saveData<T>(key: string, data: T): Promise<void> {
    try {
        await put(key, JSON.stringify(data, null, 2), { 
            access: 'public',
            contentType: 'application/json',
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
