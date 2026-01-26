

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
import { useSchedule } from '@/context/schedule-context';
import { ScheduleListItem } from './schedule-list-item';
import { useAuth } from '@/context/auth-context';

const renderTableForExport = (
  schedules: MonthlySchedule[],
  columns: ScheduleColumn[],
  members: Member[],
  isForDialog: boolean
) => {
  return (
    <div className="rounded-lg border overflow-hidden">
        <div className={isForDialog ? "relative overflow-x-auto" : ""}>
            <Table className="min-w-full">
            <TableHeader className="bg-card">
                <TableRow className="hover:bg-card">
                <TableHead className="w-[180px] sticky left-0 z-20 bg-card text-card-foreground">Data</TableHead>
                {columns.map((col) => (
                    <TableHead key={col.id} className="sticky top-0 z-10 bg-card text-card-foreground min-w-[180px]">
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
                <ScheduleListItem 
                    key={schedule.date.toISOString()}
                    schedule={schedule}
                    isDesktop 
                    members={members}
                    columns={columns}
                    handleMemberChange={() => {}}
                    handleClearAssignment={() => {}}
                    handleDateChange={() => {}}
                    handleNameChange={() => {}}
                    handleRemoveSchedule={() => {}}
                    handleFeatureToggle={() => {}}
                    isReadOnly={true}
                    isExporting={true}
                />
                ))}
            </TableBody>
            </Table>
        </div>
    </div>
  );
};

export function MonthlyScheduleView({
  schedules,
  members,
  columns,
  isExporting = false,
  isForDialog = false,
}: {
    schedules: MonthlySchedule[];
    members: Member[];
    columns: ScheduleColumn[];
    isExporting?: boolean;
    isForDialog?: boolean;
}) {
  const { updateSchedule, removeSchedule } = useSchedule();
  const { can } = useAuth();
  const isReadOnly = !can('edit:schedule') || isExporting;

  const handleMemberChange = (scheduleId: string, columnId: string, memberId: string, index: number) => {
    if (isReadOnly) return;
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (!schedule) return;

    const newAssignments = { ...schedule.assignments };
    const currentAssignment = newAssignments[columnId] ? [...newAssignments[columnId]] : [];
    currentAssignment[index] = memberId;
    newAssignments[columnId] = currentAssignment;

    updateSchedule(scheduleId, { assignments: newAssignments });
  };

  const handleClearAssignment = (scheduleId: string, columnId: string, index: number) => {
    if (isReadOnly) return;
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (!schedule) return;
    
    const newAssignments = { ...schedule.assignments };
    const currentAssignment = newAssignments[columnId] ? [...newAssignments[columnId]] : [];
    currentAssignment[index] = null;
    newAssignments[columnId] = currentAssignment;
    updateSchedule(scheduleId, { assignments: newAssignments });
  };

  const handleRemoveSchedule = (scheduleId: string) => {
    if (isReadOnly) return;
    removeSchedule(scheduleId);
  };

  const handleDateChange = (scheduleId: string, newDate: Date | undefined) => {
    if (isReadOnly) return;
     if (newDate) {
        updateSchedule(scheduleId, { date: newDate });
     }
  }

  const handleNameChange = (scheduleId: string, service: 'manha' | 'noite', newName: string) => {
    if (isReadOnly) return;
    updateSchedule(scheduleId, { [`name_${service}`]: newName });
  };

  const handleFeatureToggle = (scheduleId: string) => {
    if (isReadOnly) return;
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (schedule) {
        updateSchedule(scheduleId, { isFeatured: !schedule.isFeatured });
    }
  }
  
  const sortedSchedules = [...schedules].sort((a, b) => a.date.getTime() - b.date.getTime());

  if (isExporting) {
    // Desktop Exporting for PNG
    if (isForDialog) {
       return renderTableForExport(sortedSchedules, columns, members, true);
    }

    const splitIndex = Math.ceil(sortedSchedules.length / 2);
    const firstHalf = sortedSchedules.slice(0, splitIndex);
    const secondHalf = sortedSchedules.slice(splitIndex);

    // If there are 5 or less, render in a single column to not waste space
    if (sortedSchedules.length <= 5) {
      return renderTableForExport(sortedSchedules, columns, members, false);
    }
    
    return (
      <div className="flex gap-4">
        <div className="flex-1">
          {renderTableForExport(firstHalf, columns, members, false)}
        </div>
        {secondHalf.length > 0 && (
          <div className="flex-1">
             {renderTableForExport(secondHalf, columns, members, false)}
          </div>
        )}
      </div>
    );
  }


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
            handleMemberChange={handleMemberChange}
            handleClearAssignment={handleClearAssignment}
            handleDateChange={handleDateChange}
            handleNameChange={handleNameChange}
            handleRemoveSchedule={handleRemoveSchedule}
            handleFeatureToggle={handleFeatureToggle}
            isReadOnly={isReadOnly}
            isExporting={isExporting}
          />
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block rounded-lg border overflow-x-auto" style={{maxHeight: 'calc(100vh - 12rem)'}}>
        <Table className="min-w-max">
          <TableHeader className="bg-background">
            <TableRow className="hover:bg-background">
              <TableHead className="w-[180px] sticky left-0 z-20 bg-background">Data</TableHead>
              {columns.map((col) => (
                <TableHead key={col.id} className="sticky top-0 z-10 bg-background min-w-[180px]">
                  <div className="flex items-center gap-2">
                    {col.icon && <col.icon className="h-4 w-4 text-muted-foreground" />}
                    {col.label}
                  </div>
                </TableHead>
              ))}
              { !isReadOnly && (
                <TableHead className="w-[50px] sticky right-0 z-20 bg-background">Ações</TableHead>
              )}
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
                 handleMemberChange={handleMemberChange}
                 handleClearAssignment={handleClearAssignment}
                 handleDateChange={handleDateChange}
                 handleNameChange={handleNameChange}
                 handleRemoveSchedule={handleRemoveSchedule}
                 handleFeatureToggle={handleFeatureToggle}
                 isReadOnly={isReadOnly}
                 isExporting={isExporting}
               />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
