
'use client';

import type { MonthlySchedule, Member, ScheduleColumn, MemberRole } from '@/types';
import { TableCell, TableRow } from '@/components/ui/table';
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
import { cn } from '@/lib/utils';
import React from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';


const MemberSelector: React.FC<{
    assignedMemberId: string | null;
    filteredMembers: Member[];
    onValueChange: (memberId: string) => void;
    onClear: () => void;
    isReadOnly?: boolean;
}> = ({ assignedMemberId, filteredMembers, onValueChange, onClear, isReadOnly }) => (
    <div className="flex items-center gap-1">
        <Select value={assignedMemberId || ''} onValueChange={onValueChange} disabled={isReadOnly}>
            <SelectTrigger className={cn("h-9 text-xs sm:text-sm", !assignedMemberId && "text-muted-foreground/60")}>
                <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
                {filteredMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                        {member.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
        {assignedMemberId && !isReadOnly && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClear}>
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
        )}
    </div>
);


export function ScheduleListItem({
  schedule,
  members,
  columns,
  getAssignedMemberIds,
  handleMemberChange,
  handleClearAssignment,
  handleDateChange,
  handleRemoveDate,
  isDesktop = false,
  isReadOnly = false,
}: {
    schedule: MonthlySchedule;
    members: Member[];
    columns: ScheduleColumn[];
    getAssignedMemberIds: (date: Date, columnId: string) => (string | null)[];
    handleMemberChange: (date: Date, columnId: string, memberId: string, index: number) => void;
    handleClearAssignment: (date: Date, columnId: string, index: number) => void;
    handleDateChange: (oldDate: Date, newDate: Date | undefined) => void;
    handleRemoveDate: (date: Date) => void;
    isDesktop?: boolean;
    isReadOnly?: boolean;
}) {

  const getFilteredMembersForColumn = (column: ScheduleColumn): Member[] => {
    if (column.id.includes('pregacao')) {
        return members.filter(m => m.roles.includes('Pregador') || m.roles.includes('Convidado'));
    }
    if (column.role) {
        return members.filter(m => m.roles.includes(column.role!));
    }
    return members;
  };

  const renderDesktopAssignment = (col: ScheduleColumn) => {
    const assignedMemberIds = getAssignedMemberIds(schedule.date, col.id);
    const slots = col.isMulti ? [0, 1] : [0];
    const filteredMembersForColumn = getFilteredMembersForColumn(col);

    return (
        <div className={`flex gap-1 ${col.isMulti ? 'flex-col' : ''}`}>
            {slots.map(index => (
                <MemberSelector
                    key={`${col.id}-${index}`}
                    assignedMemberId={assignedMemberIds[index]}
                    filteredMembers={filteredMembersForColumn}
                    onValueChange={(memberId) => handleMemberChange(schedule.date, col.id, memberId, index)}
                    onClear={() => handleClearAssignment(schedule.date, col.id, index)}
                    isReadOnly={isReadOnly}
                />
            ))}
        </div>
    );
  };
  
  if (isDesktop) {
    return (
        <TableRow key={schedule.date.toISOString()}>
            <TableCell className="font-medium p-2 sticky left-0 z-10 bg-background group-hover:bg-muted/50">
            <Popover>
                <PopoverTrigger asChild disabled={isReadOnly}>
                    <Button variant="outline" size="sm" className="w-full justify-start font-normal capitalize h-9 text-xs sm:text-sm">
                        {format(schedule.date, 'EEEE, dd/MM', { locale: ptBR })}
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
            {columns.map((col) => (
                <TableCell key={col.id} className="p-2">
                    {renderDesktopAssignment(col)}
                </TableCell>
            ))}
            {!isReadOnly && (
                <TableCell className="p-2 sticky right-0 z-10 bg-background group-hover:bg-muted/50">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Essa ação não pode ser desfeita. Isso excluirá permanentemente esta data e todas as suas atribuições.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveDate(schedule.date)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </TableCell>
            )}
        </TableRow>
    )
  }

  // Mobile View
  return (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
             <Popover>
                <PopoverTrigger asChild disabled={isReadOnly}>
                    <Button variant="outline" className="font-semibold capitalize text-base flex-grow justify-start">
                       {format(schedule.date, 'EEEE, dd/MM', { locale: ptBR })}
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
            {!isReadOnly && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Essa ação não pode ser desfeita. Isso excluirá permanentemente esta data e todas as suas atribuições.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveDate(schedule.date)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </CardHeader>
        <CardContent className="p-0">
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger className="p-3">
                        <span className="text-sm font-medium">Atribuições</span>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="p-3 pt-0 space-y-4">
                        {columns.map(col => {
                            const assignedMemberIds = getAssignedMemberIds(schedule.date, col.id);
                            const slots = col.isMulti ? [0, 1] : [0];
                            const filteredMembersForColumn = getFilteredMembersForColumn(col);
                            return (
                                <div key={col.id}>
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1.5">
                                        {col.icon && <col.icon className="h-4 w-4" />}
                                        {col.label}
                                    </label>
                                    <div className={`flex gap-1 ${col.isMulti ? 'flex-col' : ''}`}>
                                        {slots.map(index => (
                                            <MemberSelector
                                                key={`${col.id}-${index}`}
                                                assignedMemberId={assignedMemberIds[index]}
                                                filteredMembers={filteredMembersForColumn}
                                                onValueChange={(memberId) => handleMemberChange(schedule.date, col.id, memberId, index)}
                                                onClear={() => handleClearAssignment(schedule.date, col.id, index)}
                                                isReadOnly={isReadOnly}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </CardContent>
    </Card>
  )
}
