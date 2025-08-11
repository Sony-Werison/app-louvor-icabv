
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
import { useState } from 'react';
import { uploadAvatar } from '@/app/actions';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface MemberFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (memberData: Omit<Member, 'id'> & { id?: string }) => void;
  member: Member | null;
}

const memberRoles: MemberRole[] = ['Abertura', 'Pregador', 'Multimídia', 'Convidado'];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  roles: z.array(z.string()).refine(value => value.some(item => item), {
    message: "Você deve selecionar pelo menos uma função.",
  }),
  avatar: z.any()
    .refine(
        (file) => {
            if (!file || typeof file === 'string') return true; // Allow existing URL string
            return file?.size <= MAX_FILE_SIZE;
        }, 
        `O tamanho máximo da imagem é 5MB.`
    )
    .refine(
        (file) => {
             if (!file || typeof file === 'string') return true;
             return ACCEPTED_IMAGE_TYPES.includes(file?.type)
        },
        "Apenas os formatos .jpg, .jpeg, .png e .webp são suportados."
    )
    .optional(),
});

export function MemberFormDialog({ isOpen, onOpenChange, onSave, member }: MemberFormDialogProps) {
  const [preview, setPreview] = useState<string | null>(member?.avatar || null);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: member?.name || '',
      roles: member?.roles || [],
      avatar: member?.avatar || '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        form.setValue('avatar', file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsUploading(true);
    let avatarUrl = member?.avatar || '';

    if (values.avatar && typeof values.avatar !== 'string') {
        try {
            const formData = new FormData();
            formData.append('file', values.avatar);
            const result = await uploadAvatar(formData);
            if (result.url) {
                avatarUrl = result.url;
            } else {
                 toast({ title: "Erro no Upload", description: result.error || "Não foi possível carregar a imagem.", variant: "destructive" });
                 setIsUploading(false);
                 return;
            }
        } catch (error) {
            toast({ title: "Erro de Conexão", description: "Falha ao enviar imagem.", variant: "destructive" });
            setIsUploading(false);
            return;
        }
    }
    
    const finalData = { ...values, roles: values.roles as MemberRole[], avatar: avatarUrl };

    if (member) {
      onSave({ ...finalData, id: member.id });
    } else {
      onSave(finalData);
    }
    setIsUploading(false);
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
              name="avatar"
              render={() => (
                <FormItem>
                  <FormLabel>Foto do Perfil</FormLabel>
                   <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16">
                            <AvatarImage src={preview || undefined} alt="Avatar preview" />
                            <AvatarFallback>{form.watch('name')?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <FormControl>
                            <Input type="file" accept="image/*" onChange={handleFileChange} className="max-w-xs file:text-primary"/>
                        </FormControl>
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
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
