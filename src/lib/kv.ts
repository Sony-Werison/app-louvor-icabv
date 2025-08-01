
'use server';
import { kv } from '@vercel/kv';
import {
  members as initialMembers,
  songs as initialSongs,
  monthlySchedules as initialMonthlySchedules,
} from './data';
import type { Member, Song, MonthlySchedule } from '@/types';

// Define keys for KV store
const KEYS = {
  MEMBERS: 'members',
  SONGS: 'songs',
  SCHEDULES: 'monthlySchedules',
  INITIALIZED: 'db_initialized',
};

async function initializeDatabase() {
  const isInitialized = await kv.get(KEYS.INITIALIZED);
  if (!isInitialized) {
    console.log('Database not initialized. Seeding with initial data...');
    // Serialize dates to string before storing
    const schedulesToStore = initialMonthlySchedules.map(s => ({
        ...s,
        date: s.date.toISOString(),
    }));

    await Promise.all([
      kv.set(KEYS.MEMBERS, initialMembers),
      kv.set(KEYS.SONGS, initialSongs),
      kv.set(KEYS.SCHEDULES, schedulesToStore),
      kv.set(KEYS.INITIALIZED, true),
    ]);
    console.log('Database seeded successfully.');
  }
}

// Ensure the database is initialized on startup
initializeDatabase().catch(console.error);

// --- Data Fetching Functions ---

export async function fetchMembers(): Promise<Member[]> {
  const members = await kv.get<Member[]>(KEYS.MEMBERS);
  return members || [];
}

export async function fetchSongs(): Promise<Song[]> {
  const songs = await kv.get<Song[]>(KEYS.SONGS);
  return songs || [];
}

export async function fetchMonthlySchedules(): Promise<MonthlySchedule[]> {
  const schedules = await kv.get<any[]>(KEYS.SCHEDULES);
  if (!schedules) return [];
  // Deserialize dates from string
  return schedules.map(s => ({ ...s, date: new Date(s.date) }));
}

// --- Data Mutation Functions ---

export async function saveMembers(members: Member[]): Promise<void> {
  await kv.set(KEYS.MEMBERS, members);
}

export async function saveSongs(songs: Song[]): Promise<void> {
  await kv.set(KEYS.SONGS, songs);
}

export async function saveMonthlySchedules(schedules: MonthlySchedule[]): Promise<void> {
  // Serialize dates to string before storing
  const schedulesToStore = schedules.map(s => ({
    ...s,
    date: s.date.toISOString(),
  }));
  await kv.set(KEYS.SCHEDULES, schedulesToStore);
}
