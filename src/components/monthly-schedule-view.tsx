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

  const handleMemberChange = (date: Date, columnId: string, memberId: string) => {
    const newSchedules = schedules.map((schedule) => {
      if (schedule.date.getTime() === date.getTime()) {
        const newAssignments = { ...schedule.assignments, [columnId]: memberId };
        return { ...schedule, assignments: newAssignments };
      }
      return schedule;
    });
    onSchedulesChange(newSchedules);
  };
  
  const handleClearAssignment = (date: Date, columnId: string) => {
     const newSchedules = schedules.map((schedule) => {
      if (schedule.date.getTime() === date.getTime()) {
        const newAssignments = { ...schedule.assignments, [columnId]: null };
        return { ...schedule, assignments: newAssignments };
      }
      return schedule;
    });
    onSchedulesChange(newSchedules);
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Data</TableHead>
            {columns.map((col) => (
              <TableHead key={col.id}>
                <div className="flex items-center gap-2">
                  {col.icon && <col.icon className="h-4 w-4 text-muted-foreground" />}
                  {col.label}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.map((schedule) => (
            <TableRow key={schedule.date.toISOString()}>
              <TableCell className="font-medium">
                {format(schedule.date, 'dd/MM/yyyy')}
              </TableCell>
              {columns.map((col) => {
                const assignedMemberId = schedule.assignments[col.id];
                const assignedMember = members.find(m => m.id === assignedMemberId);

                return (
                  <TableCell key={col.id}>
                    <div className="flex items-center gap-1">
                      <Select
                        value={assignedMemberId || ''}
                        onValueChange={(memberId) => handleMemberChange(schedule.date, col.id, memberId)}
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleClearAssignment(schedule.date, col.id)}>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
