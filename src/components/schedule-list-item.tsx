

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
import { Trash2, Pin, Sun, Moon } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Calendar } from './ui/calendar';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Input } from './ui/input';
import { Label } from './ui/label';


const MemberSelector: React.FC<{
    assignedMemberId: string | null;
    allMembers: Member[];
    filteredMembers: Member[];
    onValueChange: (memberId: string) => void;
    onClear: () => void;
    isReadOnly?: boolean;
    isExporting?: boolean;
}> = ({ assignedMemberId, allMembers, filteredMembers, onValueChange, onClear, isReadOnly, isExporting }) => {
    const selectedMember = assignedMemberId ? allMembers.find(m => m.id === assignedMemberId) : null;
    
    if (isExporting && selectedMember) {
        return (
            <div className="flex items-center gap-2 h-9 text-xs sm:text-sm px-3 py-2 rounded-md border border-input bg-card text-card-foreground">
                <Avatar className="w-5 h-5">
                    <AvatarImage src={selectedMember.avatar} alt={selectedMember.name} />
                    <AvatarFallback>{selectedMember.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="truncate">{selectedMember.name}</span>
            </div>
        )
    }

    if (isExporting && !selectedMember) {
        return (
            <div className="flex items-center justify-center gap-2 h-9 text-xs sm:text-sm px-3 py-2 rounded-md border border-input bg-card text-card-foreground">
                 <span className="text-muted-foreground">N/A</span>
            </div>
        )
    }
    
    return (
        <div className="flex items-center gap-1">
             <Select value={assignedMemberId || ''} onValueChange={onValueChange} disabled={isReadOnly}>
                <SelectTrigger className={cn("h-9 text-xs sm:text-sm w-full", !assignedMemberId && "text-muted-foreground/60")}>
                    <div className="flex items-center gap-2 truncate">
                         {selectedMember ? (
                            <>
                                <Avatar className="w-5 h-5">
                                    <AvatarImage src={selectedMember.avatar} alt={selectedMember.name} />
                                    <AvatarFallback>{selectedMember.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="truncate">{selectedMember.name}</span>
                            </>
                        ) : (
                            <SelectValue placeholder="Selecione..." />
                        )}
                    </div>
                </SelectTrigger>
                <SelectContent>
                    {filteredMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                           <div className="flex items-center gap-2">
                                <Avatar className="w-5 h-5">
                                    <AvatarImage src={member.avatar} alt={member.name} />
                                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{member.name}</span>
                           </div>
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
};


export function ScheduleListItem({
  schedule,
  members,
  columns,
  getAssignedMemberIds,
  handleMemberChange,
  handleClearAssignment,
  handleDateChange,
  handleNameChange,
  handleRemoveDate,
  handleFeatureToggle,
  isDesktop = false,
  isReadOnly = false,
  isExporting = false,
}: {
    schedule: MonthlySchedule;
    members: Member[];
    columns: ScheduleColumn[];
    getAssignedMemberIds: (date: Date, columnId: string) => (string | null)[];
    handleMemberChange: (date: Date, columnId: string, memberId: string, index: number) => void;
    handleClearAssignment: (date: Date, columnId: string, index: number) => void;
    handleDateChange: (oldDate: Date, newDate: Date | undefined) => void;
    handleNameChange: (date: Date, service: 'manha' | 'noite', newName: string) => void;
    handleRemoveDate: (date: Date) => void;
    handleFeatureToggle: (date: Date) => void;
    isDesktop?: boolean;
    isReadOnly?: boolean;
    isExporting?: boolean;
}) {

  const [nameManha, setNameManha] = useState(schedule.name_manha || '');
  const [nameNoite, setNameNoite] = useState(schedule.name_noite || '');
  
  const handleBlur = (service: 'manha' | 'noite') => {
    const newName = service === 'manha' ? nameManha : nameNoite;
    const oldName = service === 'manha' ? schedule.name_manha : schedule.name_noite;
    if (newName !== (oldName || '')) {
      handleNameChange(schedule.date, service, newName);
    }
  }


  const getFilteredMembersForColumn = (column: ScheduleColumn): Member[] => {
    let filtered: Member[] = [];
    if (column.id.includes('pregacao')) {
        filtered = members.filter(m => m.roles.includes('Pregação') || m.roles.includes('Convidado'));
    } else if (column.role) {
        filtered = members.filter(m => m.roles.includes(column.role!));
    } else {
        filtered = [...members];
    }
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
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
                    allMembers={members}
                    filteredMembers={filteredMembersForColumn}
                    onValueChange={(memberId) => handleMemberChange(schedule.date, col.id, memberId, index)}
                    onClear={() => handleClearAssignment(schedule.date, col.id, index)}
                    isReadOnly={isReadOnly}
                    isExporting={isExporting}
                />
            ))}
        </div>
    );
  };
  
  if (isDesktop) {
    return (
        <TableRow key={schedule.date.toISOString()} className={cn(isExporting ? 'bg-card' : '', schedule.isFeatured && 'bg-amber-500/10')}>
            <TableCell className={cn("font-medium p-2 sticky left-0 z-10", isExporting ? 'bg-card text-card-foreground' : 'bg-background group-hover:bg-muted/50', schedule.isFeatured && 'bg-amber-500/10')}>
             <div className="flex items-center gap-1">
                {!isReadOnly && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleFeatureToggle(schedule.date)}>
                        <Pin className={cn("h-4 w-4", schedule.isFeatured ? "text-amber-500 fill-amber-500" : "text-muted-foreground")}/>
                    </Button>
                )}
                 {isReadOnly ? (
                    <div className="text-left font-normal capitalize h-9 px-3 py-2 text-xs sm:text-sm">
                         {format(schedule.date, 'EEEE, dd/MM', { locale: ptBR })}
                    </div>
                ) : (
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
                )}
             </div>
            </TableCell>
            {columns.map((col) => {
               if (col.id.includes('manha')) {
                  return (
                     <TableCell key={col.id} className="p-2 min-w-44 border-r">
                        {renderDesktopAssignment(col)}
                    </TableCell>
                  )
               }
               return (
                <TableCell key={col.id} className="p-2 min-w-44">
                    {renderDesktopAssignment(col)}
                </TableCell>
               )
            })}
            {!isReadOnly && (
                <TableCell className={cn("p-2 sticky right-0 z-10", isExporting ? 'bg-card' : 'bg-background group-hover:bg-muted/50', schedule.isFeatured && 'bg-amber-500/10')}>
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
    <Card className={cn(isExporting ? 'bg-card border-border shadow-lg' : '', schedule.isFeatured && 'bg-amber-500/10 border-amber-500/20')}>
        <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
             <div className={cn("font-semibold capitalize text-base flex items-center gap-2 flex-grow justify-start", isExporting ? 'text-card-foreground' : '')}>
                 {!isReadOnly && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2" onClick={() => handleFeatureToggle(schedule.date)}>
                        <Pin className={cn("h-4 w-4", schedule.isFeatured ? "text-amber-500 fill-amber-500" : "text-muted-foreground")}/>
                    </Button>
                )}
                {format(schedule.date, 'EEEE, dd/MM', { locale: ptBR })}
             </div>
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
             {isExporting ? (
                 <div className="p-3 pt-2 space-y-4">
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
                                             allMembers={members}
                                             filteredMembers={filteredMembersForColumn}
                                             onValueChange={() => {}}
                                             onClear={() => {}}
                                             isReadOnly={true}
                                             isExporting={true}
                                         />
                                     ))}
                                 </div>
                             </div>
                         )
                     })}
                 </div>
             ) : (
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="p-3">
                            <span className="text-sm font-medium">Atribuições</span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-6 p-4 pt-0">
                                <div className="space-y-4 rounded-lg border p-3">
                                  <div className="flex items-center gap-2 font-medium">
                                    <Sun className="h-5 w-5 text-amber-500"/>
                                    Manhã
                                  </div>
                                  {!isReadOnly && <div className="space-y-2">
                                        <Label htmlFor="name_manha">Nome da Reunião</Label>
                                        <Input 
                                            id="name_manha"
                                            placeholder="Ex: Culto de Manhã"
                                            value={nameManha}
                                            onChange={(e) => setNameManha(e.target.value)}
                                            onBlur={() => handleBlur('manha')}
                                        />
                                    </div>}
                                    {columns.filter(c => c.id.includes('manha')).map(col => {
                                        const assignedMemberIds = getAssignedMemberIds(schedule.date, col.id);
                                        const slots = col.isMulti ? [0, 1] : [0];
                                        const filteredMembersForColumn = getFilteredMembersForColumn(col);
                                        return (
                                            <div key={col.id}>
                                                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1.5">
                                                    {col.icon && <col.icon className="h-4 w-4" />}
                                                    {col.label}
                                                </Label>
                                                <div className={`flex gap-1 ${col.isMulti ? 'flex-col' : ''}`}>
                                                    {slots.map(index => (
                                                        <MemberSelector
                                                            key={`${col.id}-${index}`}
                                                            assignedMemberId={assignedMemberIds[index]}
                                                            allMembers={members}
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
                                <div className="space-y-4 rounded-lg border p-3">
                                   <div className="flex items-center gap-2 font-medium">
                                    <Moon className="h-5 w-5 text-blue-400"/>
                                    Noite
                                  </div>
                                   {!isReadOnly && <div className="space-y-2">
                                        <Label htmlFor="name_noite">Nome da Reunião</Label>
                                        <Input 
                                            id="name_noite"
                                            placeholder="Ex: Culto da Noite"
                                            value={nameNoite}
                                            onChange={(e) => setNameNoite(e.target.value)}
                                            onBlur={() => handleBlur('noite')}
                                        />
                                    </div>}
                                    {columns.filter(c => c.id.includes('noite')).map(col => {
                                        const assignedMemberIds = getAssignedMemberIds(schedule.date, col.id);
                                        const slots = col.isMulti ? [0, 1] : [0];
                                        const filteredMembersForColumn = getFilteredMembersForColumn(col);
                                        return (
                                            <div key={col.id}>
                                                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1.5">
                                                    {col.icon && <col.icon className="h-4 w-4" />}
                                                    {col.label}
                                                </Label>
                                                <div className={`flex gap-1 ${col.isMulti ? 'flex-col' : ''}`}>
                                                    {slots.map(index => (
                                                        <MemberSelector
                                                            key={`${col.id}-${index}`}
                                                            assignedMemberId={assignedMemberIds[index]}
                                                            allMembers={members}
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
                                <div className="space-y-4 rounded-lg border p-3">
                                    {columns.filter(c => !c.id.includes('manha') && !c.id.includes('noite')).map(col => {
                                        const assignedMemberIds = getAssignedMemberIds(schedule.date, col.id);
                                        const slots = col.isMulti ? [0, 1] : [0];
                                        const filteredMembersForColumn = getFilteredMembersForColumn(col);
                                        return (
                                            <div key={col.id}>
                                                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1.5">
                                                    {col.icon && <col.icon className="h-4 w-4" />}
                                                    {col.label}
                                                </Label>
                                                <div className={`flex gap-1 ${col.isMulti ? 'flex-col' : ''}`}>
                                                    {slots.map(index => (
                                                        <MemberSelector
                                                            key={`${col.id}-${index}`}
                                                            assignedMemberId={assignedMemberIds[index]}
                                                            allMembers={members}
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
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            )}
        </CardContent>
    </Card>
  )
}
