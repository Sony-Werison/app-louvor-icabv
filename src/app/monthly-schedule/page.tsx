'use client';
import { useState } from 'react';
import { members, monthlySchedules as initialMonthlySchedules, scheduleColumns } from '@/lib/data';
import { MonthlyScheduleView } from '@/components/monthly-schedule-view';

export default function MonthlySchedulePage() {
    const [monthlySchedules, setMonthlySchedules] = useState(initialMonthlySchedules);

    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-headline font-bold">Escala Mensal</h1>
            </div>
            <MonthlyScheduleView 
                schedules={monthlySchedules}
                members={members}
                columns={scheduleColumns}
                onSchedulesChange={setMonthlySchedules}
            />
        </div>
    );
}
