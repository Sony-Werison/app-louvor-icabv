
import type { Member, Song, MonthlySchedule, ScheduleColumn } from '@/types';
import { Mic, BookUser, Tv } from 'lucide-react';

export const scheduleColumns: ScheduleColumn[] = [
  { id: 'abertura_manha', label: 'Abertura Manhã', icon: Mic, role: 'Abertura' },
  { id: 'pregacao_manha', label: 'Pregação Manhã', icon: BookUser, role: 'Pregação' },
  { id: 'abertura_noite', label: 'Abertura Noite', icon: Mic, role: 'Abertura' },
  { id: 'pregacao_noite', label: 'Pregação Noite', icon: BookUser, role: 'Pregação' },
  { id: 'multimedia', label: 'Multimídia', icon: Tv, role: 'Multimídia', isMulti: true },
];

export const initialMembers: Member[] = [
  { id: '1', name: 'João Silva', roles: ['Abertura', 'Multimídia'], email: 'joao@example.com', phone: '5511999991111' },
  { id: '2', name: 'Maria Souza', roles: ['Abertura'], email: 'maria@example.com', phone: '5511999992222' },
  { id: '3', name: 'Carlos Pereira', roles: ['Pregação'], email: 'carlos@example.com', phone: '5511999993333' },
  { id: '4', name: 'Ana Costa', roles: ['Multimídia'], email: 'ana@example.com', phone: '5511999994444' },
  { id: '5', name: 'Pastor Ricardo', roles: ['Pregação', 'Convidado'], email: 'ricardo@example.com', phone: '5511999995555' },
];

export const initialSongs: Song[] = [
  { id: 's1', title: 'Grande é o Senhor', artist: 'Adhemar de Campos', key: 'G', category: 'Louvor', isNew: false, lyrics: 'Grande é o Senhor e mui digno de louvor...', chords: '[G]Grande é o Senhor e [C]mui digno de louvor...' },
  { id: 's2', title: 'Agnus Dei', artist: 'Michael W. Smith', key: 'A', category: 'Louvor', isNew: false, lyrics: 'Aleluia, Aleluia, para o nosso Deus...', chords: '[A]Aleluia, Alelu[D]ia, para o [F#m]nosso [E]Deus...' },
  { id: 's3', title: 'Porque Ele Vive', artist: 'Harpa Cristã', key: 'C', category: 'Hino', isNew: false, lyrics: 'Porque Ele vive, posso crer no amanhã...', chords: '[C]Porque Ele vive, [G]posso crer no a[Am]manhã...' },
  { id: 's4', title: 'Soldado do Rei', artist: 'Turma do Printy', key: 'D', category: 'Infantil', isNew: true, lyrics: 'Sou um soldado do Rei, e luto pela verdade...', chords: '[D]Sou um soldado do [G]Rei, e [A]luto pela ver[D]dade...' },
];

const today = new Date();
const currentDay = today.getDay(); // 0 for Sunday, 1 for Monday, etc.
const daysUntilSunday = (7 - currentDay) % 7;

const firstEventDate = new Date(today);
// Set to the next Sunday
firstEventDate.setDate(today.getDate() + daysUntilSunday);
if (firstEventDate <= today) { // if today is sunday, this will be today, so add 7 days to get next sunday
    firstEventDate.setDate(firstEventDate.getDate() + 7);
}
firstEventDate.setHours(0, 0, 0, 0);


const secondEventDate = new Date(firstEventDate);
secondEventDate.setDate(firstEventDate.getDate() + 7);

export const initialMonthlySchedules: MonthlySchedule[] = [
  {
    id: 'ms1',
    date: firstEventDate,
    assignments: {
      'abertura_manha': ['1'],
      'pregacao_manha': ['3'],
      'abertura_noite': ['2'],
      'pregacao_noite': ['5'],
      'multimedia': ['4', null],
    },
    playlist_manha: ['s1', 's2'],
    playlist_noite: ['s3'],
    name_manha: 'Domingo Manhã',
    name_noite: 'Domingo Noite',
    isFeatured: true,
  },
  {
    id: 'ms2',
    date: secondEventDate,
    assignments: {
      'abertura_manha': ['2'],
      'pregacao_manha': ['5'],
      'abertura_noite': ['1'],
      'pregacao_noite': ['3'],
      'multimedia': ['4', null],
    },
    playlist_manha: ['s2', 's3'],
    playlist_noite: ['s1'],
    name_manha: 'Domingo Manhã',
    name_noite: 'Domingo Noite',
  }
];
