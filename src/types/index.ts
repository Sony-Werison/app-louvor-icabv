export type Member = {
  id: string;
  name: string;
  avatar: string;
  role: string;
  email: string;
  phone: string;
};

export type Song = {
  id: string;
  title: string;
  artist: string;
  key: string;
  youtubeUrl?: string;
};

export type Schedule = {
  id: string;
  name: string;
  date: Date;
  leaderId: string;
  playlist: string[]; // array of song ids
};
