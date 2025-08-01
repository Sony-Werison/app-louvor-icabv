
'use client';

import type { MonthlySchedule, Member, ScheduleColumn, MemberRole } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Calendar } from './ui/calendar';
import { ptBR } from 'date-fns/locale';
import { useSchedule } from '@/context/schedule-context';
import { ScheduleListItem } from './schedule-list-item';

interface MonthlyScheduleViewProps {
  schedules: MonthlySchedule[];
  members: Member[];
  columns: ScheduleColumn[];
}

export function MonthlyScheduleView({
  schedules,
  members,
  columns,
}: MonthlyScheduleViewProps) {
  const { updateSchedule, removeSchedule } = useSchedule();

  const handleMemberChange = (date: Date, columnId: string, memberId: string, index: number) => {
    const schedule = schedules.find((s) => s.date.getTime() === date.getTime());
    if (!schedule) return;

    const newAssignments = { ...schedule.assignments };
    const currentAssignment = newAssignments[columnId] ? [...newAssignments[columnId]] : [];
    currentAssignment[index] = memberId;
    newAssignments[columnId] = currentAssignment;

    updateSchedule(date, { assignments: newAssignments });
  };

  const handleClearAssignment = (date: Date, columnId: string, index: number) => {
    const schedule = schedules.find((s) => s.date.getTime() === date.getTime());
    if (!schedule) return;
    
    const newAssignments = { ...schedule.assignments };
    const currentAssignment = newAssignments[columnId] ? [...newAssignments[columnId]] : [];
    currentAssignment[index] = null;
    newAssignments[columnId] = currentAssignment;
    updateSchedule(date, { assignments: newAssignments });
  };

  const handleRemoveDate = (date: Date) => {
    removeSchedule(date);
  };

  const handleDateChange = (oldDate: Date, newDate: Date | undefined) => {
     if (newDate) {
        updateSchedule(oldDate, { date: newDate });
     }
  }

  const getAssignedMemberIds = (date: Date, columnId: string): (string | null)[] => {
    const schedule = schedules.find(s => s.date.getTime() === date.getTime());
    return schedule?.assignments[columnId] || [];
  };
  
  const sortedSchedules = [...schedules].sort((a, b) => a.date.getTime() - b.date.getTime());

  const getFilteredMembers = (role: MemberRole | undefined) => {
    if (!role) {
      return members;
    }
    return members.filter(member => member.role === role);
  };

  return (
    <>
      {/* Mobile View */}
      <div className="space-y-3 md:hidden">
        {sortedSchedules.map((schedule) => (
          <ScheduleListItem 
            key={schedule.date.toISOString()} 
            schedule={schedule}
            members={members}
            columns={columns}
            getFilteredMembers={getFilteredMembers}
            handleMemberChange={handleMemberChange}
            handleClearAssignment={handleClearAssignment}
            getAssignedMemberIds={getAssignedMemberIds}
            handleDateChange={handleDateChange}
            handleRemoveDate={handleRemoveDate}
          />
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block rounded-lg border overflow-x-auto" style={{maxHeight: 'calc(100vh - 12rem)'}}>
        <Table className="min-w-max">
          <TableHeader className="bg-background">
            <TableRow className="hover:bg-background">
              <TableHead className="w-[180px] sticky left-0 z-20 bg-inherit">Data</TableHead>
              {columns.map((col) => (
                <TableHead key={col.id} className="sticky top-0 z-10 bg-inherit min-w-[180px]">
                  <div className="flex items-center gap-2">
                    {col.icon && <col.icon className="h-4 w-4 text-muted-foreground" />}
                    {col.label}
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-[50px] sticky right-0 z-20 bg-inherit">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSchedules.map((schedule) => (
               <ScheduleListItem 
                 key={schedule.date.toISOString()}
                 schedule={schedule}
                 isDesktop 
                 members={members}
                 columns={columns}
                 getFilteredMembers={getFilteredMembers}
                 handleMemberChange={handleMemberChange}
                 handleClearAssignment={handleClearAssignment}
                 getAssignedMemberIds={getAssignedMemberIds}
                 handleDateChange={handleDateChange}
                 handleRemoveDate={handleRemoveDate}
               />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
