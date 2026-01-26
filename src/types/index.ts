

export type Role = 'admin' | 'abertura' | 'viewer';

export type MemberRole = 'Abertura' | 'Pregação' | 'Multimídia' | 'Convidado';
export type SongCategory = 'Hino' | 'Louvor' | 'Infantil';

export type Member = {
  id: string;
  name: string;
  roles: MemberRole[];
  email?: string;
  phone?: string;
};

export type Song = {
  id: string;
  title: string;
  artist: string;
  key: string;
  category: SongCategory;
  isNew?: boolean;
  youtubeUrl?: string;
  lyrics?: string;
  chords?: string;
  timesPlayedQuarterly?: number;
  bpm?: number;
};

export type Schedule = {
  id:string;
  name: string;
  date: Date;
  leaderId: string;
  preacherId: string | null;
  playlist: string[]; // array of song ids
  team?: Record<string, (string | null)[]>; // roleId -> memberId[]
};

export type ScheduleColumn = {
  id: string;
  label: string;
  icon?: React.ElementType;
  isMulti?: boolean;
  role?: MemberRole;
};

export type MonthlySchedule = {
  id: string;
  date: Date;
  assignments: Record<string, (string | null)[]>; // columnId -> memberId[]
  playlist_manha?: string[];
  playlist_noite?: string[];
  isFeatured?: boolean;
  name_manha?: string;
  name_noite?: string;
};

export type LiveState = {
  scheduleId: string;
  hostId: string;
  activeSongId: string | null;
  transpose: number;
  scroll: {
    isScrolling: boolean;
    speed: number;
  };
  metronome: {
    isPlaying: boolean;
    bpm: number;
  };
  lastUpdate: number;
};

// Data format for backup files
// We use string for date because JSON doesn't have a Date type
export type BackupData = {
  members: Member[];
  songs: Song[];
  monthlySchedules: Omit<MonthlySchedule, 'date'> & { date: string }[];
  exportDate: string;
};
