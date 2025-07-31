import type { Member, Song, MonthlySchedule, ScheduleColumn } from '@/types';
import { Tv, Sun, Moon, BookUser } from 'lucide-react';
import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths } from 'date-fns';

export const members: Member[] = [
  { id: '1', name: 'João Silva', avatar: 'https://i.pravatar.cc/150?u=joao', role: 'Líder de Louvor, Vocal', email: 'joao.silva@example.com', phone: '(11) 98765-4321' },
  { id: '2', name: 'Maria Oliveira', avatar: 'https://i.pravatar.cc/150?u=maria', role: 'Vocal, Violão', email: 'maria.oliveira@example.com', phone: '(11) 91234-5678' },
  { id: '3', name: 'Pedro Santos', avatar: 'https://i.pravatar.cc/150?u=pedro', role: 'Guitarra', email: 'pedro.santos@example.com', phone: '(11) 95555-1234' },
  { id: '4', name: 'Ana Costa', avatar: 'https://i.pravatar.cc/150?u=ana', role: 'Teclado', email: 'ana.costa@example.com', phone: '(11) 94444-5678' },
  { id: '5', name: 'Lucas Souza', avatar: 'https://i.pravatar.cc/150?u=lucas', role: 'Bateria', email: 'lucas.souza@example.com', phone: '(11) 93333-8765' },
  { id: '6', name: 'Carla Pereira', avatar: 'https://i.pravatar.cc/150?u=carla', role: 'Baixo', email: 'carla.pereira@example.com', phone: '(11) 92222-4321' },
  { id: '7', name: 'Marcella', avatar: 'https://i.pravatar.cc/150?u=marcella', role: 'Vocal', email: 'marcella@example.com', phone: '(11) 98888-1111' },
  { id: '8', name: 'Arthur', avatar: 'https://i.pravatar.cc/150?u=arthur', role: 'Violão', email: 'arthur@example.com', phone: '(11) 98888-2222' },
  { id: '9', name: 'Júlio', avatar: 'https://i.pravatar.cc/150?u=julio', role: 'Bateria', email: 'julio@example.com', phone: '(11) 98888-3333' },
  { id: '10', name: 'Breno', avatar: 'https://i.pravatar.cc/150?u=breno', role: 'Teclado', email: 'breno@example.com', phone: '(11) 98888-4444' },
  { id: '11', name: 'Bruno', avatar: 'https://i.pravatar.cc/150?u=bruno', role: 'Baixo', email: 'bruno@example.com', phone: '(11) 98888-5555' },
  { id: '12', name: 'Werison', avatar: 'https://i.pravatar.cc/150?u=werison', role: 'Vocal', email: 'werison@example.com', phone: '(11) 98888-6666' },
  { id: '13', name: 'Marcos Diogo', avatar: 'https://i.pravatar.cc/150?u=marcos-diogo', role: 'Guitarra', email: 'marcos.diogo@example.com', phone: '(11) 98888-7777' },
  { id: '14', name: 'Welton', avatar: 'https://i.pravatar.cc/150?u=welton', role: 'Vocal', email: 'welton@example.com', phone: '(11) 98888-8888' },
  { id: '15', name: 'Rudinei', avatar: 'https://i.pravatar.cc/150?u=rudinei', role: 'Vocal', email: 'rudinei@example.com', phone: '(11) 98888-9999' },
  { id: '16', name: 'Marcos Morazotti', avatar: 'https://i.pravatar.cc/150?u=marcos-morazotti', role: 'Vocal', email: 'marcos.morazotti@example.com', phone: '(11) 97777-1111' },
  { id: '17', name: 'Ricardo', avatar: 'https://i.pravatar.cc/150?u=ricardo', role: 'Vocal', email: 'ricardo@example.com', phone: '(11) 97777-2222' },
  { id: '18', name: 'Jônatas', avatar: 'https://i.pravatar.cc/150?u=jonatas', role: 'Preletor', email: 'jonatas@example.com', phone: '(11) 97777-3333' },
  { id: '19', name: 'Davi', avatar: 'https://i.pravatar.cc/150?u=davi', role: 'Preletor', email: 'davi@example.com', phone: '(11) 97777-4444' },
  { id: '20', name: 'Rafael', avatar: 'https://i.pravatar.cc/150?u=rafael', role: 'Preletor', email: 'rafael@example.com', phone: '(11) 97777-5555' },
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

export const scheduleColumns: ScheduleColumn[] = [
    { id: 'dirigente_manha', label: 'Dirigente Manhã', icon: Sun },
    { id: 'pregacao_manha', label: 'Pregação Manhã', icon: BookUser },
    { id: 'dirigente_noite', label: 'Dirigente Noite', icon: Moon },
    { id: 'pregacao_noite', label: 'Pregação Noite', icon: BookUser },
    { id: 'multimedia', label: 'Multimídia', icon: Tv, isMulti: true },
];

const generateWeekendDates = (date: Date): Date[] => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const days = eachDayOfInterval({ start, end });
    return days.filter(day => getDay(day) === 6 || getDay(day) === 0); // 6 = Saturday, 0 = Sunday
};


const generateInitialSchedules = (): MonthlySchedule[] => {
    const today = new Date();
    const currentMonthWeekend = generateWeekendDates(today);
    const nextMonthWeekend = generateWeekendDates(addMonths(today, 1));

    const allWeekendDates = [...currentMonthWeekend, ...nextMonthWeekend];
    
    const preachers = members.filter(m => m.role === 'Preletor');
    const leaders = members.filter(m => m.role.includes('Líder') || m.role.includes('Vocal'));
    const musicians = members.filter(m => !m.role.includes('Preletor'));

    return allWeekendDates.map((date, index) => {
        // Skip Sundays for assignment generation as we link them to Saturdays
        if (getDay(date) === 0) {
            return { date, assignments: {} };
        }

        const leaderMorning = leaders[index % leaders.length];
        const leaderNight = leaders[(index + 1) % leaders.length];
        const preacherMorning = preachers[index % preachers.length];
        const preacherNight = preachers[(index + 1) % preachers.length];
        const multimedia1 = musicians[index % musicians.length];
        const multimedia2 = musicians[(index + 1) % musicians.length];
        
        return {
            date: date,
            assignments: {
                'dirigente_manha': [leaderMorning.id],
                'pregacao_manha': [preacherMorning.id],
                'dirigente_noite': [leaderNight.id],
                'pregacao_noite': [preacherNight.id],
                'multimedia': [multimedia1.id, multimedia2.id],
            }
        }
    }).filter(s => s.assignments); // Filter out empty sunday assignments
};


export const monthlySchedules: MonthlySchedule[] = generateInitialSchedules();
