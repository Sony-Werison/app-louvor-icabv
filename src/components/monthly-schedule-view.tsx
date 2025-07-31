'use client';

import type { MonthlySchedule, Member, ScheduleColumn } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Calendar } from './ui/calendar';
import { ptBR } from 'date-fns/locale';

interface MonthlyScheduleViewProps {
  schedules: MonthlySchedule[];
  members: Member[];
  columns: ScheduleColumn[];
  onSchedulesChange: (schedules: MonthlySchedule[]) => void;
}

export function MonthlyScheduleView({
  schedules,
  members,
  columns,
  onSchedulesChange,
}: MonthlyScheduleViewProps) {
  const handleMemberChange = (date: Date, columnId: string, memberId: string, index: number) => {
    const newSchedules = schedules.map((schedule) => {
      if (schedule.date.getTime() === date.getTime()) {
        const newAssignments = { ...schedule.assignments };
        const currentAssignment = newAssignments[columnId] ? [...newAssignments[columnId]] : [];
        currentAssignment[index] = memberId;
        newAssignments[columnId] = currentAssignment;
        return { ...schedule, assignments: newAssignments };
      }
      return schedule;
    });
    onSchedulesChange(newSchedules);
  };

  const handleClearAssignment = (date: Date, columnId: string, index: number) => {
    const newSchedules = schedules.map((schedule) => {
      if (schedule.date.getTime() === date.getTime()) {
        const newAssignments = { ...schedule.assignments };
        const currentAssignment = newAssignments[columnId] ? [...newAssignments[columnId]] : [];
        currentAssignment[index] = null;
        newAssignments[columnId] = currentAssignment;
        return { ...schedule, assignments: newAssignments };
      }
      return schedule;
    });
    onSchedulesChange(newSchedules);
  };

  const handleRemoveDate = (date: Date) => {
    const newSchedules = schedules.filter(schedule => schedule.date.getTime() !== date.getTime());
    onSchedulesChange(newSchedules);
  };

  const handleDateChange = (oldDate: Date, newDate: Date | undefined) => {
     if (newDate) {
        const newSchedules = schedules.map(s => 
            s.date.getTime() === oldDate.getTime() ? { ...s, date: newDate } : s
        );
        onSchedulesChange(newSchedules);
     }
  }

  const getAssignedMemberIds = (date: Date, columnId: string): (string | null)[] => {
    const schedule = schedules.find(s => s.date.getTime() === date.getTime());
    if (schedule) {
      return schedule.assignments[columnId] || [];
    }
    return [];
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Data</TableHead>
            {columns.map((col) => (
              <TableHead key={col.id}>
                <div className="flex items-center gap-2">
                  {col.icon && <col.icon className="h-4 w-4 text-muted-foreground" />}
                  {col.label}
                </div>
              </TableHead>
            ))}
            <TableHead className="w-[50px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.map((schedule) => (
            <TableRow key={schedule.date.toISOString()}>
              <TableCell className="font-medium">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start font-normal capitalize">
                           {format(schedule.date, 'EEEE, dd/MM/yyyy', { locale: ptBR })}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={schedule.date}
                            onSelect={(newDate) => handleDateChange(schedule.date, newDate)}
                            locale={ptBR}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
              </TableCell>
              {columns.map((col) => {
                const assignedMemberIds = getAssignedMemberIds(schedule.date, col.id);
                const slots = col.isMulti ? [0, 1] : [0];

                return (
                  <TableCell key={col.id}>
                    <div className={`flex gap-2 ${col.isMulti ? 'flex-col' : ''}`}>
                      {slots.map(index => {
                        const assignedMemberId = assignedMemberIds[index];
                        return (
                          <div key={index} className="flex items-center gap-1">
                            <Select
                              value={assignedMemberId || ''}
                              onValueChange={(memberId) => handleMemberChange(schedule.date, col.id, memberId, index)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                {members.map((member) => (
                                  <SelectItem key={member.id} value={member.id}>
                                    {member.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {assignedMemberId && (
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleClearAssignment(schedule.date, col.id, index)}>
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </TableCell>
                );
              })}
              <TableCell>
                 <Button variant="ghost" size="icon" onClick={() => handleRemoveDate(schedule.date)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                 </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
