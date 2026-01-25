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
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useFirebase } from '@/firebase';
import { doc, collection, setDoc } from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { useState, useEffect } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { firestore, storage } = useFirebase();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

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
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !storage) {
      toast({
        title: 'Erro de Inicialização',
        description: 'O Firebase não foi inicializado corretamente.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      let avatarUrl = member?.avatar || '';
      const memberId = member?.id ?? doc(collection(firestore, 'members')).id;

      // 1. Upload da foto, se houver uma nova
      if (avatarFile) {
        const filePath = `members/${memberId}/avatar`;
        const fileRef = storageRef(storage, filePath);
        const metadata = { contentType: avatarFile.type };

        await uploadBytes(fileRef, avatarFile, metadata);
        avatarUrl = await getDownloadURL(fileRef);
      }

      // 2. Preparar os dados para salvar
      const memberData = {
        name: values.name,
        email: values.email || '',
        phone: values.phone || '',
        roles: values.roles as MemberRole[],
        avatar: avatarUrl,
      };

      // 3. Salvar no Firestore
      await setDoc(doc(firestore, 'members', memberId), memberData);

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
          'Não foi possível salvar o membro. Verifique sua conexão e as permissões do Firebase.',
        variant: 'destructive',
      });
    } finally {
      // 4. Garantir que o estado de "carregando" seja sempre desativado
      setIsUploading(false);
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
             <FormItem>
                <FormLabel>Foto do Perfil</FormLabel>
                <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                        <AvatarImage src={avatarPreview || undefined} alt="Avatar preview" />
                        <AvatarFallback>{form.watch('name')?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <FormControl>
                      <Button asChild variant="outline" className="relative">
                        <label htmlFor="avatar-upload" className="cursor-pointer">
                          <Upload className="mr-2 h-4 w-4" />
                          {avatarFile ? 'Trocar foto' : 'Escolher foto'}
                          <Input id="avatar-upload" type="file" className="sr-only" accept="image/*" onChange={handleAvatarChange} />
                        </label>
                      </Button>
                    </FormControl>
                </div>
              </FormItem>
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
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isUploading}>
                 {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUploading ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
