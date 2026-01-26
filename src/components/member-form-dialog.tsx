
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
import { useState, useEffect } from 'react';
import { Loader2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSchedule } from '@/context/schedule-context';
import { v4 as uuidv4 } from 'uuid';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Label } from './ui/label';

interface MemberFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
}

const memberRoles: MemberRole[] = ['Abertura', 'Pregação', 'Multimídia', 'Convidado'];

const formSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  roles: z.array(z.string()).refine(value => value.some(item => item), {
    message: "Você deve selecionar pelo menos uma função.",
  }),
});

export function MemberFormDialog({ isOpen, onOpenChange, member }: MemberFormDialogProps) {
  const { saveMember } = useSchedule();
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(member?.avatar || null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      roles: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (member) {
        form.reset({
          name: member.name || '',
          email: member.email || '',
          phone: member.phone || '',
          roles: member.roles || [],
        });
        setAvatarPreview(member.avatar || null);
      } else {
        form.reset({
          name: '',
          email: '',
          phone: '',
          roles: [],
        });
        setAvatarPreview(null);
      }
      setAvatarFile(null);
    }
  }, [isOpen, member, form]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>>) => {
    setIsSaving(true);
    try {
      const memberId = member?.id ?? uuidv4();
      const memberData: Member = {
        id: memberId,
        name: values.name,
        email: values.email || '',
        phone: values.phone || '',
        roles: values.roles as MemberRole[],
        avatar: member?.avatar,
      };

      await saveMember(memberData, avatarFile);

      toast({
        title: 'Sucesso!',
        description: `Membro ${member ? 'atualizado' : 'criado'} com sucesso.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving member:', error);
      toast({
        title: 'Erro ao Salvar',
        description:
          'Não foi possível salvar o membro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
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
            <div className='flex items-center gap-4'>
              <Avatar className="w-20 h-20">
                <AvatarImage src={avatarPreview || undefined} alt={form.getValues('name')} />
                <AvatarFallback className="text-3xl">
                  {form.getValues('name') ? form.getValues('name').charAt(0) : <User />}
                </AvatarFallback>
              </Avatar>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="avatar">Foto de Perfil</Label>
                <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} />
              </div>
            </div>

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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone (WhatsApp)</FormLabel>
                  <FormControl>
                    <Input placeholder="5511999998888" {...field} />
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                 {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
