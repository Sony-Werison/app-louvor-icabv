
export type MemberRole = 'Dirigente' | 'Pregador' | 'Multimídia';

export type Member = {
  id: string;
  name: string;
  avatar: string;
  role: MemberRole;
  email: string;
  phone: string;
};

export type Song = {
  id: string;
  title: string;
  artist: string;
  key: string;
  youtubeUrl?: string;
  lyrics?: string;
  chords?: string;
};

export type Schedule = {
  id: string;
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
};

export type MonthlySchedule = {
  date: Date;
  assignments: Record<string, (string | null)[]>; // columnId -> memberId[]
  playlist_manha?: string[];
  playlist_noite?: string[];
};
