'use client';

import { useState } from 'react';
import type { Member } from '@/types';
import { members as initialMembers } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MemberFormDialog } from '@/components/member-form-dialog';
import { Mail, Phone, User, Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
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
      // Edit existing member
      setMembers(members.map((m) => (m.id === memberData.id ? { ...m, ...memberData } : m)));
    } else {
      // Add new member
      const newMember = { ...memberData, id: `m${Date.now()}` };
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

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-headline font-bold">Membros</h1>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2" />
          Novo Membro
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {members.map((member) => (
          <Card key={member.id} className="relative">
            <CardHeader className="items-center text-center">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={member.avatar} alt={member.name} data-ai-hint="person portrait" />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle className="font-headline font-bold text-xl">{member.name}</CardTitle>
              <div className="absolute top-2 right-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
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
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{member.role}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${member.email}`} className="hover:text-foreground transition-colors break-all">
                  {member.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href={`tel:${member.phone}`} className="hover:text-foreground transition-colors">
                  {member.phone}
                </a>
              </div>
            </CardContent>
          </Card>
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
