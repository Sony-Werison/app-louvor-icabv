
'use client';

import type { Member, MemberRole } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from './ui/checkbox';

interface MemberFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (memberData: Omit<Member, 'id'> & { id?: string }) => void;
  member: Member | null;
}

const memberRoles: MemberRole[] = ['Dirigente', 'Pregador', 'Multimídia'];

const formSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  roles: z.array(z.string()).refine(value => value.some(item => item), {
    message: "Você deve selecionar pelo menos uma função.",
  }),
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  avatar: z.string().url({ message: 'Por favor, insira uma URL de avatar válida.' }).optional().or(z.literal('')),
});

export function MemberFormDialog({ isOpen, onOpenChange, onSave, member }: MemberFormDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: member?.name || '',
      roles: member?.roles || [],
      email: member?.email || '',
      avatar: member?.avatar || '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const avatar = values.avatar || `https://i.pravatar.cc/150?u=${values.email}`;
    if (member) {
      onSave({ ...values, roles: values.roles as MemberRole[], avatar, id: member.id });
    } else {
      onSave({ ...values, roles: values.roles as MemberRole[], avatar });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{member ? 'Editar Membro' : 'Novo Membro'}</DialogTitle>
          <DialogDescription>
            {member ? 'Edite as informações do membro.' : 'Preencha os dados para adicionar um novo membro.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="roles"
              render={() => (
                <FormItem>
                  <FormLabel>Funções</FormLabel>
                  <div className="space-y-2">
                  {memberRoles.map((role) => (
                    <FormField
                      key={role}
                      control={form.control}
                      name="roles"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={role}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(role)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, role])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== role
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {role}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Avatar</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
