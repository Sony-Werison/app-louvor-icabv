
'use client';

import { useState, useMemo } from 'react';
import type { Member } from '@/types';
import { members as initialMembers } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MemberFormDialog } from '@/components/member-form-dialog';
import { Plus, MoreVertical, Edit, Trash2, CalendarCheck2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useSchedule } from '@/context/schedule-context';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isScheduleViewOpen, setIsScheduleViewOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [memberToView, setMemberToView] = useState<Member | null>(null);

  const { monthlySchedules, scheduleColumns } = useSchedule();

  const handleSaveMember = (memberData: Omit<Member, 'id'> & { id?: string }) => {
    if (memberData.id) {
      setMembers(members.map((m) => (m.id === memberData.id ? { ...m, ...memberData } as Member : m)));
    } else {
      const newMember = { ...memberData, id: `m${Date.now()}` } as Member;
      setMembers([...members, newMember]);
    }
    setIsFormDialogOpen(false);
    setSelectedMember(null);
  };

  const handleAddNew = () => {
    setSelectedMember(null);
    setIsFormDialogOpen(true);
  };

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    setIsFormDialogOpen(true);
  };

  const handleDeleteClick = (member: Member) => {
    setMemberToDelete(member);
    setIsAlertOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (memberToDelete) {
      setMembers(members.filter((m) => m.id !== memberToDelete.id));
      setIsAlertOpen(false);
      setMemberToDelete(null);
    }
  };

  const handleViewSchedule = (member: Member) => {
    setMemberToView(member);
    setIsScheduleViewOpen(true);
  };

  const memberUpcomingSchedules = useMemo(() => {
    if (!memberToView) return [];
    
    const today = new Date();
    today.setHours(0,0,0,0);

    const upcoming = monthlySchedules
      .filter(schedule => new Date(schedule.date) >= today)
      .map(schedule => {
        const roles: string[] = [];
        Object.entries(schedule.assignments).forEach(([columnId, memberIds]) => {
          if (memberIds.includes(memberToView.id)) {
            const column = scheduleColumns.find(c => c.id === columnId);
            if(column) {
                roles.push(column.label);
            }
          }
        });
        if (roles.length > 0) {
          return {
            date: schedule.date,
            roles: roles,
          };
        }
        return null;
      })
      .filter((item): item is { date: Date; roles: string[] } => item !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

      return upcoming;

  }, [memberToView, monthlySchedules, scheduleColumns]);

  const groupedMembers = members.reduce((acc, member) => {
    const role = member.role;
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(member);
    return acc;
  }, {} as Record<Member['role'], Member[]>);

  const roleOrder: Member['role'][] = ['Dirigente', 'Pregador', 'Multimídia'];
  const sortedRoles = Object.keys(groupedMembers).sort((a,b) => {
    const aIndex = roleOrder.indexOf(a as any);
    const bIndex = roleOrder.indexOf(b as any);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });


  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 sm:mb-8 gap-4">
        <h1 className="text-3xl sm:text-4xl font-headline font-bold">Membros</h1>
        <Button onClick={handleAddNew} size="sm" className="sm:size-auto">
          <Plus className="mr-2" />
          Novo Membro
        </Button>
      </div>

      <div className="space-y-8">
        {sortedRoles.map((role) => (
          <section key={role}>
            <h2 className="text-xl sm:text-2xl font-headline font-semibold mb-4 border-b pb-2">{role}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
              {groupedMembers[role as Member['role']].map((member) => (
                <div key={member.id} className="relative flex flex-col items-center text-center group">
                  <div className="cursor-pointer" onClick={() => handleViewSchedule(member)}>
                    <Avatar className="w-16 h-16 sm:w-20 sm:h-20 mb-2">
                      <AvatarImage src={member.avatar} alt={member.name} data-ai-hint="person portrait" />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="font-medium text-xs sm:text-sm w-full break-words">{member.name}</p>
                  </div>
                   <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEdit(member)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(member)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Excluir</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>


      {isFormDialogOpen && (
        <MemberFormDialog
          isOpen={isFormDialogOpen}
          onOpenChange={setIsFormDialogOpen}
          onSave={handleSaveMember}
          member={selectedMember}
        />
      )}

      {isScheduleViewOpen && memberToView && (
          <Dialog open={isScheduleViewOpen} onOpenChange={setIsScheduleViewOpen}>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>Próximas Escalas de {memberToView.name}</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-80 pr-4">
                  {memberUpcomingSchedules.length > 0 ? (
                      <div className="space-y-4">
                          {memberUpcomingSchedules.map((schedule, index) => (
                              <div key={index} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                                <CalendarCheck2 className="h-5 w-5 mt-1 text-primary shrink-0"/>
                                <div>
                                    <p className="font-semibold capitalize">{format(schedule.date, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                                        {schedule.roles.map((role, r_index) => (
                                            <li key={r_index}>{role}</li>
                                        ))}
                                    </ul>
                                </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p className="text-center text-muted-foreground py-8">Nenhuma escala futura encontrada.</p>
                  )}
                  </ScrollArea>
              </DialogContent>
          </Dialog>
      )}

      {isAlertOpen && (
          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                          Essa ação não pode ser desfeita. Isso excluirá permanentemente o membro.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteConfirm}>Continuar</AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
      )}
    </div>
  );
}
