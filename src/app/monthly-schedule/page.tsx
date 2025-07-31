'use client';
import { useState } from 'react';
import { members, scheduleColumns as initialScheduleColumns } from '@/lib/data';
import { MonthlyScheduleView } from '@/components/monthly-schedule-view';
import type { MonthlySchedule, ScheduleColumn } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ptBR } from 'date-fns/locale';
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSaturday, format } from 'date-fns';

const generateSchedulesForMonth = (month: Date, scheduleColumns: ScheduleColumn[]): MonthlySchedule[] => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const allDaysInMonth = eachDayOfInterval({ start, end });
    const saturdays = allDaysInMonth.filter(day => isSaturday(day));
    
    return saturdays.map(date => ({
        date: date,
        assignments: scheduleColumns.reduce((acc, col) => {
            acc[col.id] = col.isMulti ? [null, null] : [null];
            return acc;
        }, {} as Record<string, (string | null)[]>),
    }));
}


export default function MonthlySchedulePage() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [monthlySchedules, setMonthlySchedules] = useState<MonthlySchedule[]>(() => generateSchedulesForMonth(currentMonth, initialScheduleColumns));
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const navigateMonths = (amount: number) => {
        const newMonth = addMonths(currentMonth, amount);
        setCurrentMonth(newMonth);
        setMonthlySchedules(generateSchedulesForMonth(newMonth, initialScheduleColumns));
    };

    const handleSchedulesChange = (schedules: MonthlySchedule[]) => {
        const sortedSchedules = [...schedules].sort((a, b) => a.date.getTime() - b.date.getTime());
        setMonthlySchedules(sortedSchedules);
    };

    const handleAddDate = (date: Date | undefined) => {
        if (date) {
            const newSchedule: MonthlySchedule = {
                date: date,
                assignments: initialScheduleColumns.reduce((acc, col) => {
                    acc[col.id] = col.isMulti ? [null, null] : [null];
                    return acc;
                }, {} as Record<string, (string | null)[]>),
            };
            handleSchedulesChange([...monthlySchedules, newSchedule]);
            setIsCalendarOpen(false);
        }
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigateMonths(-1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl md:text-4xl font-headline font-bold text-center w-64 capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                    </h1>
                    <Button variant="outline" size="icon" onClick={() => navigateMonths(1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button>
                            <Plus className="mr-2" />
                            Adicionar Data
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            onSelect={handleAddDate}
                            locale={ptBR}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <MonthlyScheduleView 
                schedules={monthlySchedules}
                members={members}
                columns={initialScheduleColumns}
                onSchedulesChange={handleSchedulesChange}
            />
        </div>
    );
}
