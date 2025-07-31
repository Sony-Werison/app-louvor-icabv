import type { Member, Song, MonthlySchedule, ScheduleColumn } from '@/types';
import { Tv, Sun, Moon, BookUser } from 'lucide-react';
import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, startOfWeek, endOfWeek, previousSaturday, isSaturday } from 'date-fns';

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
  { 
    id: 's1', 
    title: 'Quão Grande É o Meu Deus', 
    artist: 'Soraya Moraes', 
    key: 'G',
    lyrics: `Com esplendor de um rei
Em majestade e luz
Faz a Terra se alegrar
Faz a Terra se alegrar

Ele é a própria luz
E as trevas vão fugir
Tremer com a Sua voz
Tremer com a Sua voz

Quão grande é o meu Deus
Cantarei quão grande é o meu Deus
E todos hão de ver
Quão grande é o meu Deus

Por gerações Ele é
O tempo está em Suas mãos
O início e o fim
O início e o fim

Três se formam em um
Filho, Espírito e Pai
Cordeiro e leão
Cordeiro e leão

Quão grande é o meu Deus
Cantarei quão grande é o meu Deus
E todos hão de ver
Quão grande é o meu Deus

Sobre todo nome é o Seu
Tu és digno do louvor
Eu cantarei quão grande é o meu Deus`,
    chords: `[Intro] G C Em D

[G]Com esplendor de um [C]rei
Em majestade e [Em]luz
Faz a Terra se alegrar[D]
Faz a Terra se alegrar

[G]Ele é a própria [C]luz
E as trevas vão fu[Em]gir
Tremer com a Sua [D]voz
Tremer com a Sua voz

Quão [G]grande é o meu Deus
Canta[C]rei quão grande é o meu Deus
E [Em]todos hão de ver
Quão [D]grande é o meu [G]Deus`
  },
  { 
    id: 's2', 
    title: 'Oceans (Where Feet May Fail)', 
    artist: 'Hillsong United', 
    key: 'D',
    lyrics: `You call me out upon the waters
The great unknown where feet may fail
And there I find You in the mystery
In oceans deep, my faith will stand

And I will call upon Your name
And keep my eyes above the waves
When oceans rise, my soul will rest in Your embrace
For I am Yours and You are mine

Your grace abounds in deepest waters
Your sovereign hand will be my guide
Where feet may fail and fear surrounds me
You've never failed and You won't start now

So I will call upon Your name
And keep my eyes above the waves
When oceans rise, my soul will rest in Your embrace
For I am Yours and You are mine

Spirit lead me where my trust is without borders
Let me walk upon the waters
Wherever You would call me
Take me deeper than my feet could ever wander
And my faith will be made stronger
In the presence of my Savior`,
    chords: `[Intro] Bm A D G

[Bm]You call me [A/C#]out upon the [D]waters
The great un[G]known where [D]feet may [A]fail
[Bm]And there I [A/C#]find You in the [D]mystery
In [G]oceans [D]deep, my [A]faith will stand

And [G]I will call u[D]pon Your [A]name
And [G]keep my eyes a[D]bove the [A]waves
When oceans [G]rise, my [D]soul will rest in [A]Your embrace
For [G]I am [A]Yours and [Bm]You are mine`
  },
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

const getWeekends = (date: Date): Date[] => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const days = eachDayOfInterval({ start, end });
    // Retorna todos os sábados e domingos
    return days.filter(day => getDay(day) === 6 || getDay(day) === 0);
};

const generateInitialSchedules = (): MonthlySchedule[] => {
    const today = new Date();
    const monthsToGenerate = [addMonths(today, -1), today, addMonths(today, 1), addMonths(today, 2)];
    let allWeekends: Date[] = [];
  
    monthsToGenerate.forEach(month => {
      allWeekends.push(...getWeekends(month));
    });
    
    const uniqueDates = Array.from(new Set(allWeekends.map(d => d.toISOString().split('T')[0])))
      .map(dateStr => {
        const date = new Date(dateStr);
        return new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
      })
      .sort((a,b) => a.getTime() - b.getTime());

    const preachers = members.filter(m => m.role === 'Preletor');
    const leaders = members.filter(m => m.role.includes('Líder') || m.role.includes('Vocal'));
    const musicians = members.filter(m => !m.role.includes('Preletor'));

    if (preachers.length === 0) preachers.push(members[0]);
    if (leaders.length === 0) leaders.push(members[0]);
    if (musicians.length < 2) musicians.push(...members.slice(0, 2));


    return uniqueDates.map((date, index) => {
        const isSunday = getDay(date) === 0;

        const leaderMorning = leaders[index % leaders.length];
        const leaderNight = leaders[(index + 1) % leaders.length];
        const preacherMorning = preachers[index % preachers.length];
        const preacherNight = preachers[(index + 1) % preachers.length];
        const multimedia1 = musicians[index % musicians.length];
        const multimedia2 = musicians[(index + 2) % musicians.length];
        
        // Only populate assignments for Sundays
        const assignments = isSunday ? {
                'dirigente_manha': [leaderMorning.id],
                'pregacao_manha': [preacherMorning.id],
                'dirigente_noite': [leaderNight.id],
                'pregacao_noite': [preacherNight.id],
                'multimedia': [multimedia1.id, multimedia2.id],
            } : {};

        return {
            date: date,
            assignments,
        }
    });
};


export const monthlySchedules: MonthlySchedule[] = generateInitialSchedules();

    