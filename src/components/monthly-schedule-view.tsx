

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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const { can, account } = useAuth();
  const [editing, setEditing] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
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
      {/* On phones, preserve the same date-by-role grid as the full schedule. */}
      <div className="md:hidden rounded-lg border bg-card overflow-hidden">
        {!isReadOnly && <div className="flex justify-end border-b p-2"><Button size="sm" variant="outline" onClick={() => setEditing(!editing)}>{editing ? 'Concluir edição' : 'Editar escala'}</Button></div>}
        <table className="w-full table-fixed border-collapse text-[10px] leading-tight">
          <thead>
            <tr className="border-b bg-muted/30 text-center text-muted-foreground">
              <th scope="col" className="w-[14%] px-1 py-2 font-semibold">Data</th>
              {columns.map((column) => (
                <th scope="col" key={column.id} className="px-1 py-2 align-middle text-center font-semibold break-words">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedSchedules.map((schedule) => (
              <tr key={schedule.id} className={cn('border-b last:border-0 align-middle', schedule.date.getDay() !== 0 && 'bg-blue-500/10')}>
                <th scope="row" className="px-1 py-3 text-center align-middle font-medium">
                  {format(schedule.date, 'dd/MM', { locale: ptBR })}
                  {schedule.name_manha && <span className="mt-1 block break-words" title="Reunião da manhã">{schedule.name_manha}</span>}
                  {schedule.name_noite && <span className="mt-1 block break-words" title="Reunião da noite">{schedule.name_noite}</span>}
                  {editing && <button type="button" className="mt-1 block w-full text-primary underline" onClick={() => setSelectedSchedule(schedule.id)} aria-label={`Editar escala de ${format(schedule.date, 'dd/MM')}`}>Editar</button>}
                </th>
                {columns.map((column) => {
                  const names = (schedule.assignments?.[column.id] || [])
                    .filter(Boolean)
                    .map((id) => ({ id, name: id?.startsWith('guest:') ? id.slice(6) : members.find((member) => member.id === id)?.name || 'Membro não encontrado' }));
                  return <td key={column.id} className="px-1 py-2 text-center align-middle break-words">
                    {column.id.includes('manha') && schedule.status_manha && schedule.status_manha !== 'scheduled' ? <span title={schedule.reason_manha}>{schedule.status_manha === 'cancelled' ? 'Cancelada' : 'N/A'}{schedule.reason_manha && <span className="block">{schedule.reason_manha}</span>}</span> : column.id.includes('noite') && schedule.status_noite && schedule.status_noite !== 'scheduled' ? <span title={schedule.reason_noite}>{schedule.status_noite === 'cancelled' ? 'Cancelada' : 'N/A'}{schedule.reason_noite && <span className="block">{schedule.reason_noite}</span>}</span> : names.length ? names.map(({id,name}, index) => <div key={index} title={name} className={cn('py-0.5', column.id === 'multimedia' ? 'whitespace-nowrap overflow-hidden text-ellipsis' : 'break-words', id === account?.member_id && 'font-bold text-amber-400')}>{name}</div>) : '-'}
                  </td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        {!isReadOnly && <Dialog open={!!selectedSchedule} onOpenChange={open => { if (!open) setSelectedSchedule(null); }}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Editar escala</DialogTitle></DialogHeader>
          {sortedSchedules.filter(schedule => schedule.id === selectedSchedule).map((schedule) => <div key={schedule.id} className="space-y-4">{(['manha', 'noite'] as const).map(period => <MeetingEditor key={period} schedule={schedule} period={period} onSave={updateSchedule} />)}<ScheduleListItem
            schedule={schedule} members={members} columns={columns}
            handleMemberChange={handleMemberChange} handleClearAssignment={handleClearAssignment}
            handleDateChange={handleDateChange} handleNameChange={handleNameChange}
            handleRemoveSchedule={handleRemoveSchedule} handleFeatureToggle={handleFeatureToggle}
            isReadOnly={false} /></div>)}
        </DialogContent></Dialog>}

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
                 onEditMeeting={() => setSelectedSchedule(schedule.id)}
               />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function MeetingEditor({ schedule, period, onSave }: { schedule: MonthlySchedule; period: 'manha' | 'noite'; onSave: (id: string, updates: Partial<Omit<MonthlySchedule, 'id'>>) => Promise<void> }) {
  const [name, setName] = useState(schedule[`name_${period}`] || '');
  const [status, setStatus] = useState(schedule[`status_${period}`] || 'scheduled');
  const [reason, setReason] = useState(schedule[`reason_${period}`] || '');
  const [saving, setSaving] = useState(false);
  return <div className="space-y-2 rounded-lg border p-3"><h3 className="font-semibold">Reunião da {period === 'manha' ? 'manhã' : 'noite'}</h3>
    <Label htmlFor={`meeting-name-${period}`}>Nome da reunião</Label><Input id={`meeting-name-${period}`} value={name} onChange={event => setName(event.target.value)} />
    <Label htmlFor={`meeting-status-${period}`}>Situação</Label><select id={`meeting-status-${period}`} className="flex h-10 w-full rounded-md border bg-background px-3 text-sm" value={status} onChange={event => setStatus(event.target.value as typeof status)}><option value="scheduled">Programada</option><option value="cancelled">Cancelada</option><option value="not_applicable">Não aplicável</option></select>
    {status !== 'scheduled' && <><Label htmlFor={`meeting-reason-${period}`}>Motivo</Label><Input id={`meeting-reason-${period}`} value={reason} onChange={event => setReason(event.target.value)} placeholder="Informe o motivo" /></>}
    <Button size="sm" disabled={saving} onClick={async () => { setSaving(true); try { await onSave(schedule.id, { [`name_${period}`]: name, [`status_${period}`]: status, [`reason_${period}`]: status === 'scheduled' ? '' : reason }); } finally { setSaving(false); } }}>Salvar reunião</Button>
  </div>;
}
