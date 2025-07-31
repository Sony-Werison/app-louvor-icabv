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
import { addMonths, format } from 'date-fns';

export default function MonthlySchedulePage() {
    const { monthlySchedules, addSchedule, members, scheduleColumns } = useSchedule();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const navigateMonths = (amount: number) => {
        setCurrentMonth(prevMonth => addMonths(prevMonth, amount));
    };

    const handleAddDate = (date: Date | undefined) => {
        if (date) {
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
                schedules={filteredSchedules}
                members={members}
                columns={scheduleColumns}
            />
        </div>
    );
}
