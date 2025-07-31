'use client';
import { useState } from 'react';
import { members, monthlySchedules as initialMonthlySchedules, scheduleColumns } from '@/lib/data';
import { MonthlyScheduleView } from '@/components/monthly-schedule-view';
import type { MonthlySchedule } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ptBR } from 'date-fns/locale';

export default function MonthlySchedulePage() {
    const [monthlySchedules, setMonthlySchedules] = useState<MonthlySchedule[]>(initialMonthlySchedules);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const handleSchedulesChange = (schedules: MonthlySchedule[]) => {
        // Sort schedules by date before updating state
        const sortedSchedules = [...schedules].sort((a, b) => a.date.getTime() - b.date.getTime());
        setMonthlySchedules(sortedSchedules);
    };

    const handleAddDate = (date: Date | undefined) => {
        if (date) {
            const newSchedule: MonthlySchedule = {
                date: date,
                assignments: scheduleColumns.reduce((acc, col) => {
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
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-headline font-bold">Escala Mensal</h1>
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
                columns={scheduleColumns}
                onSchedulesChange={handleSchedulesChange}
            />
        </div>
    );
}
