
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm, useForm as useReminderForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as FormDesc } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const passwordFormSchema = z.object({
  currentAdminPassword: z.string().optional(),
  newAdminPassword: z.string().optional(),
  currentAberturaPassword: z.string().optional(),
  newAberturaPassword: z.string().optional(),
}).refine(data => {
    if (data.currentAdminPassword && !data.newAdminPassword) return false;
    if (!data.currentAdminPassword && data.newAdminPassword) return false;
    return true;
}, {
    message: "Preencha a senha atual e a nova senha para alterar.",
    path: ['newAdminPassword']
}).refine(data => {
    if (data.currentAberturaPassword && !data.newAberturaPassword) return false;
    if (!data.currentAberturaPassword && data.newAberturaPassword) return false;
    return true;
}, {
    message: "Preencha a senha atual e a nova senha para alterar.",
    path: ['newAberturaPassword']
});

const reminderFormSchema = z.object({
    message: z.string().min(10, { message: 'A mensagem deve ter pelo menos 10 caracteres.' }),
});


export default function SettingsPage() {
  const { role, can, updatePassword, whatsappMessage, updateWhatsappMessage } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentAdminPassword: '',
      newAdminPassword: '',
      currentAberturaPassword: '',
      newAberturaPassword: '',
    },
  });
  
  const reminderForm = useReminderForm<z.infer<typeof reminderFormSchema>>({
      resolver: zodResolver(reminderFormSchema),
      defaultValues: {
          message: whatsappMessage || '',
      }
  });

  useEffect(() => {
    if (!can('manage:settings')) {
      router.push('/');
    }
  }, [role, can, router]);
  
  useEffect(() => {
    reminderForm.reset({ message: whatsappMessage });
  }, [whatsappMessage, reminderForm]);


  const onPasswordSubmit = async (values: z.infer<typeof passwordFormSchema>) => {
    let changed = false;
    if (values.currentAdminPassword && values.newAdminPassword) {
        const adminSuccess = await updatePassword('admin', values.currentAdminPassword, values.newAdminPassword);
        if(adminSuccess) {
            passwordForm.resetField('currentAdminPassword');
            passwordForm.resetField('newAdminPassword');
            changed = true;
        }
    }
    if (values.currentAberturaPassword && values.newAberturaPassword) {
        const aberturaSuccess = await updatePassword('abertura', values.currentAberturaPassword, values.newAberturaPassword);
        if(aberturaSuccess) {
            passwordForm.resetField('currentAberturaPassword');
            passwordForm.resetField('newAberturaPassword');
            changed = true;
        }
    }
    if(!changed) {
        passwordForm.setError('root', { message: 'Nenhuma alteração foi feita. Verifique as senhas atuais.'})
    }
  };
  
  const onReminderSubmit = async (values: z.infer<typeof reminderFormSchema>) => {
      const success = await updateWhatsappMessage(values.message);
      if (success) {
          toast({ title: 'Sucesso!', description: 'A mensagem de lembrete do WhatsApp foi atualizada.'});
      } else {
          toast({ title: 'Erro', description: 'Não foi possível salvar a mensagem.', variant: 'destructive'});
      }
  }
  
  if (!can('manage:settings')) {
    return null;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-2xl font-headline font-bold">Configurações</h1>
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Senhas</CardTitle>
            <CardDescription>
              Altere as senhas para os perfis de Admin e Abertura. Preencha os campos apenas do perfil que deseja alterar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-8">
                <div className="space-y-4">
                    <h3 className="font-semibold">Perfil Administrador</h3>
                     <FormField
                        control={passwordForm.control}
                        name="currentAdminPassword"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Senha Atual</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="Digite a senha atual de admin" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                    control={passwordForm.control}
                    name="newAdminPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nova Senha de Administrador</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="Digite a nova senha de admin" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                <Separator />
                
                <div className="space-y-4">
                     <h3 className="font-semibold">Perfil Abertura</h3>
                    <FormField
                    control={passwordForm.control}
                    name="currentAberturaPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Senha Atual</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="Digite a senha atual de abertura" {...field} />
                        </FormControl>
                         <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={passwordForm.control}
                    name="newAberturaPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nova Senha de Abertura</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="Digite a nova senha de abertura" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                {passwordForm.formState.errors.root && (
                    <p className="text-sm font-medium text-destructive">{passwordForm.formState.errors.root.message}</p>
                )}

                <div className="flex justify-end">
                    <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                        Salvar Alterações de Senha
                    </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Mensagem de Lembrete</CardTitle>
                <CardDescription>
                    Personalize a mensagem automática enviada via WhatsApp para os membros de abertura.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Form {...reminderForm}>
                    <form onSubmit={reminderForm.handleSubmit(onReminderSubmit)} className="space-y-4">
                        <FormField
                            control={reminderForm.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Template da Mensagem</FormLabel>
                                <FormControl>
                                    <Textarea rows={10} {...field} />
                                </FormControl>
                                <FormDesc>
                                    Use as variáveis: `[NOME]`, `[PERIODO]`, `[SENHA]`.
                                </FormDesc>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <div className="flex justify-end">
                            <Button type="submit" disabled={reminderForm.formState.isSubmitting}>
                                Salvar Mensagem
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
