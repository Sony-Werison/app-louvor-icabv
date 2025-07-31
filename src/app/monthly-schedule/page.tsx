
'use client';
import { useState } from 'react';
import { useSchedule } from '@/context/schedule-context';
import { MonthlyScheduleView } from '@/components/monthly-schedule-view';
import type { MonthlySchedule } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ptBR } from 'date-fns/locale';
import { addMonths, format, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function MonthlySchedulePage() {
    const { monthlySchedules, addSchedule, members, scheduleColumns } = useSchedule();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const { toast } = useToast();

    const navigateMonths = (amount: number) => {
        setCurrentMonth(prevMonth => addMonths(prevMonth, amount));
    };

    const handleAddDate = (date: Date | undefined) => {
        if (date) {
            const dateExists = monthlySchedules.some(
                schedule => startOfDay(schedule.date).getTime() === startOfDay(date).getTime()
            );

            if (dateExists) {
                toast({
                    title: 'Data Duplicada',
                    description: 'Esta data já existe na escala.',
                    variant: 'destructive',
                });
                return;
            }

            addSchedule(date);
            setIsCalendarOpen(false);
            setCurrentMonth(date);
        }
    };
    
    const filteredSchedules = monthlySchedules.filter(
        schedule => schedule.date.getMonth() === currentMonth.getMonth() &&
                    schedule.date.getFullYear() === currentMonth.getFullYear()
    );

    return (
        <div className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 sm:mb-8 gap-4">
                <div className="flex items-center gap-2 sm:gap-4 justify-between">
                    <Button variant="outline" size="icon" onClick={() => navigateMonths(-1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-headline font-bold text-center w-48 sm:w-64 capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                    </h1>
                    <Button variant="outline" size="icon" onClick={() => navigateMonths(1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button size="sm" className="sm:size-auto w-full sm:w-auto">
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
                schedules={filteredSchedules}
                members={members}
                columns={scheduleColumns}
            />
        </div>
    );
}
