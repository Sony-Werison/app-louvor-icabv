import type { Member, Song, Schedule } from '@/types';

export const members: Member[] = [
  { id: '1', name: 'João Silva', avatar: 'https://i.pravatar.cc/150?u=joao', role: 'Líder de Louvor, Vocal', email: 'joao.silva@example.com', phone: '(11) 98765-4321' },
  { id: '2', name: 'Maria Oliveira', avatar: 'https://i.pravatar.cc/150?u=maria', role: 'Vocal, Violão', email: 'maria.oliveira@example.com', phone: '(11) 91234-5678' },
  { id: '3', name: 'Pedro Santos', avatar: 'https://i.pravatar.cc/150?u=pedro', role: 'Guitarra', email: 'pedro.santos@example.com', phone: '(11) 95555-1234' },
  { id: '4', name: 'Ana Costa', avatar: 'https://i.pravatar.cc/150?u=ana', role: 'Teclado', email: 'ana.costa@example.com', phone: '(11) 94444-5678' },
  { id: '5', name: 'Lucas Souza', avatar: 'https://i.pravatar.cc/150?u=lucas', role: 'Bateria', email: 'lucas.souza@example.com', phone: '(11) 93333-8765' },
  { id: '6', name: 'Carla Pereira', avatar: 'https://i.pravatar.cc/150?u=carla', role: 'Baixo', email: 'carla.pereira@example.com', phone: '(11) 92222-4321' },
];

export const songs: Song[] = [
  { id: 's1', title: 'Quão Grande É o Meu Deus', artist: 'Soraya Moraes', key: 'G' },
  { id: 's2', title: 'Oceans (Where Feet May Fail)', artist: 'Hillsong United', key: 'D' },
  { id: 's3', title: 'Amazing Grace', artist: 'Chris Tomlin', key: 'G' },
  { id: 's4', title: 'Te Agradeço', artist: 'Diante do Trono', key: 'A' },
  { id: 's5', title: 'What a Beautiful Name', artist: 'Hillsong Worship', key: 'D' },
  { id: 's6', title: 'Grandes Coisas', artist: 'Fernandinho', key: 'C' },
  { id: 's7', title: 'Aquieta Minh\'alma', artist: 'Ministério Zoe', key: 'Em' },
  { id: 's8', title: 'Reckless Love', artist: 'Cory Asbury', key: 'F#m' },
  { id: 's9', title: '10,000 Reasons (Bless the Lord)', artist: 'Matt Redman', key: 'G' },
  { id: 's10', title: 'Em Teus Braços', artist: 'Laura Souguellis', key: 'C' },
];

export const schedules: Schedule[] = [
  {
    id: 'e1',
    name: 'Culto de Domingo - Manhã',
    date: new Date(new Date(new Date().setDate(new Date().getDate() + 3)).setHours(10, 0, 0, 0)),
    leaderId: '1',
    team: [
      { memberId: '1', instrument: 'Vocal' },
      { memberId: '2', instrument: 'Guitar' },
      { memberId: '4', instrument: 'Keyboard' },
      { memberId: '5', instrument: 'Drums' },
      { memberId: '6', instrument: 'Bass' },
    ],
    playlist: ['s1', 's2', 's3'],
  },
  {
    id: 'e2',
    name: 'Culto de Domingo - Noite',
    date: new Date(new Date(new Date().setDate(new Date().getDate() + 3)).setHours(19, 0, 0, 0)),
    leaderId: '2',
    team: [
      { memberId: '2', instrument: 'Vocal' },
      { memberId: '3', instrument: 'Guitar' },
      { memberId: '4', instrument: 'Keyboard' },
      { memberId: '5', instrument: 'Drums' },
    ],
    playlist: ['s4', 's5', 's6'],
  },
  {
    id: 'e3',
    name: 'Ensaio de Sábado',
    date: new Date(new Date(new Date().setDate(new Date().getDate() + 9)).setHours(16, 0, 0, 0)),
    leaderId: '1',
    team: [
        { memberId: '1', instrument: 'Vocal' },
        { memberId: '3', instrument: 'Guitar' },
        { memberId: '4', instrument: 'Keyboard' },
        { memberId: '5', instrument: 'Drums' },
        { memberId: '6', instrument: 'Bass' },
    ],
    playlist: [],
  },
];
