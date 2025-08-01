

import type { Member, Song, MonthlySchedule, ScheduleColumn, SongCategory } from '@/types';
import { Tv, Sun, Moon, BookUser } from 'lucide-react';
import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths } from 'date-fns';

export const members: Member[] = [];

export const songs: Song[] = [
  { 
    id: 's1', 
    title: 'Quão Grande É o Meu Deus', 
    artist: 'Soraya Moraes', 
    key: 'G',
    category: 'Louvor',
    timesPlayedQuarterly: 5,
    timesPlayedTotal: 25,
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
    category: 'Louvor',
    timesPlayedQuarterly: 2,
    timesPlayedTotal: 15,
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
  { id: 's3', title: 'Amazing Grace (My Chains Are Gone)', artist: 'Chris Tomlin', key: 'G', category: 'Hino', timesPlayedQuarterly: 1, timesPlayedTotal: 30 },
  { id: 's4', title: 'Te Agradeço', artist: 'Diante do Trono', key: 'A', category: 'Louvor', timesPlayedQuarterly: 3, timesPlayedTotal: 12 },
  { id: 's5', title: 'What a Beautiful Name', artist: 'Hillsong Worship', key: 'D', category: 'Louvor', timesPlayedQuarterly: 4, timesPlayedTotal: 22 },
  { id: 's6', title: 'Grandes Coisas', artist: 'Fernandinho', key: 'C', category: 'Louvor', timesPlayedQuarterly: 6, timesPlayedTotal: 18 },
  { id: 's7', title: 'Aquieta Minh\'alma', artist: 'Ministério Zoe', key: 'Em', category: 'Louvor', timesPlayedQuarterly: 1, timesPlayedTotal: 9 },
  { id: 's8', title: 'Reckless Love', artist: 'Cory Asbury', key: 'F#m', category: 'Louvor', timesPlayedQuarterly: 2, timesPlayedTotal: 11 },
  { id: 's9', title: '10,000 Reasons (Bless the Lord)', artist: 'Matt Redman', key: 'G', category: 'Louvor', timesPlayedQuarterly: 3, timesPlayedTotal: 28 },
  { id: 's10', title: 'Em Teus Braços', artist: 'Laura Souguellis', key: 'C', category: 'Louvor', timesPlayedQuarterly: 0, timesPlayedTotal: 8 },
  { id: 's11', title: 'A Benção', artist: 'Gateway Worship', key: 'B', category: 'Louvor', timesPlayedQuarterly: 7, timesPlayedTotal: 14 },
  { id: 's12', title: 'Rude Cruz', artist: 'Harpa Cristã', key: 'A', category: 'Hino', timesPlayedQuarterly: 0, timesPlayedTotal: 40 },
  { id: 's13', title: 'Três Palavrinhas', artist: 'Turma do Cristãozinho', key: 'C', category: 'Infantil', timesPlayedQuarterly: 8, timesPlayedTotal: 50 },
  { id: 's14', title: 'Soldado de Cristo', artist: '3 Palavrinhas', key: 'G', category: 'Infantil', timesPlayedQuarterly: 5, timesPlayedTotal: 35 },
];

export const scheduleColumns: ScheduleColumn[] = [
    { id: 'dirigente_manha', label: 'Dirigente Manhã', icon: Sun, role: 'Dirigente' },
    { id: 'pregacao_manha', label: 'Pregação Manhã', icon: BookUser, role: 'Pregador' },
    { id: 'dirigente_noite', label: 'Dirigente Noite', icon: Moon, role: 'Dirigente' },
    { id: 'pregacao_noite', label: 'Pregação Noite', icon: BookUser, role: 'Pregador' },
    { id: 'multimedia', label: 'Multimídia', icon: Tv, isMulti: true, role: 'Multimídia' },
];

const getWeekends = (date: Date): Date[] => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const days = eachDayOfInterval({ start, end });
    // Retorna todos os sábados (6) e domingos (0)
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

    const preachers = members.filter(m => m.roles.includes('Pregador'));
    const leaders = members.filter(m => m.roles.includes('Dirigente'));
    const multimedia = members.filter(m => m.roles.includes('Multimídia'));

    if (preachers.length === 0) preachers.push(members[0]);
    if (leaders.length === 0) leaders.push(members[0]);
    if (multimedia.length < 2) multimedia.push(...members.slice(0, 2));


    return uniqueDates.map((date, index) => {
        const isSunday = getDay(date) === 0;

        const leaderMorning = leaders[index % leaders.length];
        const leaderNight = leaders[(index + 1) % leaders.length];
        const preacherMorning = preachers[index % preachers.length];
        const preacherNight = preachers[(index + 1) % preachers.length];
        const multimedia1 = multimedia[index % multimedia.length];
        const multimedia2 = multimedia[(index + 2) % multimedia.length];
        
        // Only populate assignments for Sundays
        const assignments = (isSunday && members.length > 0) ? {
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
