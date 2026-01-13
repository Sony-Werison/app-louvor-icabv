
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useForm, useForm as useReminderForm, useForm as useShareForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as FormDesc } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { exportAllData, importAllData } from '@/lib/blob-storage';
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
import { Loader2 } from 'lucide-react';
import type { BackupData } from '@/types';


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

const textFormSchema = z.object({
    message: z.string().min(10, { message: 'A mensagem deve ter pelo menos 10 caracteres.' }),
});


export default function SettingsPage() {
  const { role, can, updatePassword, whatsappMessage, updateWhatsappMessage, shareMessage, updateShareMessage } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportAlertOpen, setIsImportAlertOpen] = useState(false);
  const [backupFileToImport, setBackupFileToImport] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentAdminPassword: '',
      newAdminPassword: '',
      currentAberturaPassword: '',
      newAberturaPassword: '',
    },
  });
  
  const reminderForm = useReminderForm<z.infer<typeof textFormSchema>>({
      resolver: zodResolver(textFormSchema),
      defaultValues: {
          message: whatsappMessage || '',
      }
  });

  const shareForm = useShareForm<z.infer<typeof textFormSchema>>({
      resolver: zodResolver(textFormSchema),
      defaultValues: {
          message: shareMessage || '',
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

  useEffect(() => {
    shareForm.reset({ message: shareMessage });
  }, [shareMessage, shareForm]);


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
  
  const onReminderSubmit = async (values: z.infer<typeof textFormSchema>) => {
      const success = await updateWhatsappMessage(values.message);
      if (success) {
          toast({ title: 'Sucesso!', description: 'A mensagem de lembrete do WhatsApp foi atualizada.'});
      } else {
          toast({ title: 'Erro', description: 'Não foi possível salvar a mensagem.', variant: 'destructive'});
      }
  }

  const onShareSubmit = async (values: z.infer<typeof textFormSchema>) => {
      const success = await updateShareMessage(values.message);
      if (success) {
          toast({ title: 'Sucesso!', description: 'A mensagem de compartilhamento foi atualizada.'});
      } else {
          toast({ title: 'Erro', description: 'Não foi possível salvar a mensagem.', variant: 'destructive'});
      }
  }

  const handleExport = async () => {
    setIsExporting(true);
    try {
        const data = await exportAllData();
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
        const link = document.createElement('a');
        link.href = jsonString;
        link.download = `backup_louvor_icabv_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        toast({ title: 'Exportação Concluída', description: 'O arquivo de backup foi baixado.' });
    } catch (error) {
        toast({ title: 'Erro na Exportação', description: 'Não foi possível gerar o arquivo de backup.', variant: 'destructive' });
    } finally {
        setIsExporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBackupFileToImport(file);
      setIsImportAlertOpen(true);
    }
  };

  const handleImportConfirm = async () => {
    if (!backupFileToImport) return;
    
    setIsImporting(true);
    setIsImportAlertOpen(false);

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') {
              throw new Error('Falha ao ler o arquivo.');
            }
            const data = JSON.parse(text) as BackupData;
            
            // Basic validation
            if (!data.members || !data.songs || !data.monthlySchedules || !data.passwords) {
              throw new Error('Arquivo de backup inválido ou corrompido.');
            }
            
            await importAllData(data);
            
            toast({ title: 'Importação Concluída!', description: 'Os dados foram restaurados. A página será recarregada.' });
            
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error: any) {
            toast({ title: 'Erro na Importação', description: error.message || 'Não foi possível restaurar os dados.', variant: 'destructive' });
            setIsImporting(false);
        }
    };
    reader.readAsText(backupFileToImport);
  };
  
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
                <CardTitle>Mensagem de Lembrete (WhatsApp)</CardTitle>
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
                                Salvar Mensagem de Lembrete
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Mensagem de Compartilhamento</CardTitle>
                <CardDescription>
                    Personalize a mensagem padrão que acompanha a imagem ao usar a função "Compartilhar".
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Form {...shareForm}>
                    <form onSubmit={shareForm.handleSubmit(onShareSubmit)} className="space-y-4">
                        <FormField
                            control={shareForm.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Template da Mensagem</FormLabel>
                                <FormControl>
                                    <Textarea rows={5} {...field} />
                                </FormControl>
                                <FormDesc>
                                    Use as variáveis: `[PERIODO]`, `[DATA]`.
                                </FormDesc>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <div className="flex justify-end">
                            <Button type="submit" disabled={shareForm.formState.isSubmitting}>
                                Salvar Mensagem de Compartilhamento
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backup e Restauração</CardTitle>
            <CardDescription>
              Exporte todos os dados da aplicação para um arquivo ou importe um backup para restaurar o estado. Cuidado: importar um backup substituirá todos os dados existentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleExport} disabled={isExporting} className="w-full">
                {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Exportar Backup Completo
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} disabled={isImporting} variant="outline" className="w-full">
                {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Importar Backup
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleFileSelect}
              />
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={isImportAlertOpen} onOpenChange={setIsImportAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação substituirá **TODOS** os dados atuais (membros, escalas, músicas e configurações) pelo conteúdo do arquivo de backup. Essa ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setBackupFileToImport(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleImportConfirm}>Sim, importar backup</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
}
