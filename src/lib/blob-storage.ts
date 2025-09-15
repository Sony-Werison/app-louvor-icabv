
'use server';
import { put, list, del, head } from '@vercel/blob';
import {
  songs as initialSongs,
  monthlySchedules as initialMonthlySchedules,
  members as initialMembers,
  passwords as initialPasswords,
  whatsappMessage as initialWhatsappMessage,
  shareMessage as initialShareMessage,
} from './data';
import type { Member, Song, MonthlySchedule, Role, LiveState } from '@/types';

// Define keys for Vercel Blob (which are filenames)
const KEYS = {
  MEMBERS: 'members.json',
  SONGS: 'songs.json',
  SCHEDULES: 'monthlySchedules.json',
  PASSWORDS: 'passwords.json',
  WHATSAPP_MESSAGE: 'whatsappMessage.json',
  SHARE_MESSAGE: 'shareMessage.json',
  LIVE_STATE: 'liveState.json',
};

// --- Helper Functions ---
async function fetchData<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const blob = await head(key).catch((error) => {
      if (error.status === 404) {
        return null;
      }
      throw error;
    });

    if (!blob) {
        console.log(`Blob ${key} not found. Seeding with initial data.`);
        await saveData(key, defaultValue);
        return defaultValue;
    }

    const response = await fetch(blob.url);
    if (!response.ok) { 
        console.error(`Failed to fetch ${key}, status: ${response.status}`);
        return defaultValue;
    }
    return await response.json();
  } catch (error: any) {
    console.error(`Failed to fetch or seed ${key}:`, error);
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
  const schedules = await fetchData<any[]>(KEYS.SCHEDULES, initialMonthlySchedules(initialMembers));
  if (!schedules) return [];
  // Deserialize dates from string
  return schedules.map(s => ({ ...s, date: new Date(s.date) }));
}

export async function fetchPasswords(): Promise<Record<Role, string>> {
    return await fetchData<Record<Role, string>>(KEYS.PASSWORDS, initialPasswords);
}

export async function fetchWhatsappMessage(): Promise<string> {
    return await fetchData<string>(KEYS.WHATSAPP_MESSAGE, initialWhatsappMessage);
}

export async function fetchShareMessage(): Promise<string> {
    return await fetchData<string>(KEYS.SHARE_MESSAGE, initialShareMessage);
}

export async function fetchLiveState(): Promise<LiveState | null> {
    try {
        const blob = await head(KEYS.LIVE_STATE);
        const response = await fetch(blob.url);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        return null;
    }
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

export async function savePasswords(passwords: Record<Role, string>): Promise<void> {
    await saveData(KEYS.PASSWORDS, passwords);
}

export async function saveWhatsappMessage(message: string): Promise<void> {
    await saveData(KEYS.WHATSAPP_MESSAGE, message);
}

export async function saveShareMessage(message: string): Promise<void> {
    await saveData(KEYS.SHARE_MESSAGE, message);
}

export async function saveLiveState(state: LiveState): Promise<void> {
    await saveData(KEYS.LIVE_STATE, state);
}
