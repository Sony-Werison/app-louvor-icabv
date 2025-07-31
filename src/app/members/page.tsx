
'use client';

import { useState } from 'react';
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
import { Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  const handleSaveMember = (memberData: Omit<Member, 'id'> & { id?: string }) => {
    if (memberData.id) {
      setMembers(members.map((m) => (m.id === memberData.id ? { ...m, ...memberData } as Member : m)));
    } else {
      const newMember = { ...memberData, id: `m${Date.now()}` } as Member;
      setMembers([...members, newMember]);
    }
    setIsDialogOpen(false);
    setSelectedMember(null);
  };

  const handleAddNew = () => {
    setSelectedMember(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    setIsDialogOpen(true);
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
                  <Avatar className="w-16 h-16 sm:w-20 sm:h-20 mb-2">
                    <AvatarImage src={member.avatar} alt={member.name} data-ai-hint="person portrait" />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-xs sm:text-sm w-full break-words">{member.name}</p>
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


      {isDialogOpen && (
        <MemberFormDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSave={handleSaveMember}
          member={selectedMember}
        />
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
